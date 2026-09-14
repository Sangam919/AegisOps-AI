from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.entities import (
    Incident,
    IncidentSeverity,
    IncidentStatus,
    RemediationStatus,
    RemediationAction,
    Postmortem,
)
from app.schemas.schemas import (
    IncidentResponse,
    IncidentCreate,
    RemediationApprovalRequest,
    PostmortemResponse,
)
from app.services.agents.agent_orchestrator import agent_orchestrator
from app.services.simulator import simulator

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

# In-memory default incidents to guarantee rich UI even before DB queries
DEFAULT_INCIDENTS: Dict[str, Dict[str, Any]] = {
    "INC-2026-0042": {
        "id": "INC-2026-0042",
        "title": "Payment Service HikariCP Connection Pool Exhaustion",
        "severity": "CRITICAL",
        "status": "AWAITING_APPROVAL",
        "affected_service": "payment-service",
        "created_at": datetime.utcnow().isoformat(),
        "symptoms": "p95 latency breached SLA (950ms vs nominal 85ms). Error rate surged to 24.8%. Active DB connections pinned at 98/100.",
        "suspected_root_cause": "Database Connection Pool Exhaustion (HikariCP Saturation)",
        "confidence": 0.92,
        "evidence_json": [
            {
                "type": "metric",
                "title": "Connection Pool Saturation",
                "description": "Active connections reached 98% of maximum allowable capacity (98/100).",
                "confidence_weight": 0.35,
                "data": {"active": 98, "max": 100},
            },
            {
                "type": "log",
                "title": "Connection Acquisition Timeouts",
                "description": "ConnectionPoolExhaustedException: Timeout waiting for idle connection from pool 'PaymentHikariCP'",
                "confidence_weight": 0.30,
                "data": {"count": 34},
            },
            {
                "type": "deployment",
                "title": "Release v2.4.1 Configuration Change",
                "description": "Deployment v2.4.1 deployed 24m ago modified HikariCP pool timeout parameters.",
                "confidence_weight": 0.25,
                "data": {"commit": "8f4d92a"},
            },
        ],
        "alternatives_json": [
            {"cause": "Network packet congestion", "probability": 0.05, "reason_rejected_or_unlikely": "No packet loss on VPC"},
            {"cause": "Payment gateway partner downtime", "probability": 0.03, "reason_rejected_or_unlikely": "External endpoints healthy"},
        ],
        "blast_radius_json": {
            "target_service": "payment-service",
            "downstream_impacted": ["api-gateway", "user-service"],
            "estimated_affected_users": 14200,
            "estimated_revenue_loss_per_minute_usd": 2450.0,
            "risk_tier": "CRITICAL",
        },
        "recommended_remediation": "Recycle idle connection pool instances, increase pool max limit to 140, and spawn +2 service replicas",
        "remediation_status": "PENDING_APPROVAL",
    },
    "INC-2026-0038": {
        "id": "INC-2026-0038",
        "title": "Auth Service BCrypt Thread Starvation",
        "severity": "HIGH",
        "status": "RESOLVED",
        "affected_service": "auth-service",
        "created_at": datetime.utcnow().isoformat(),
        "resolved_at": datetime.utcnow().isoformat(),
        "symptoms": "Auth token endpoint latency degraded from 35ms to 840ms. CPU utilization reached 99.4%.",
        "suspected_root_cause": "CPU Thread Starvation from Synchronous BCrypt Hashing",
        "confidence": 0.94,
        "evidence_json": [
            {
                "type": "metric",
                "title": "CPU Exhaustion",
                "description": "CPU pinned at 99.4% on all 3 Auth pods.",
                "confidence_weight": 0.40,
                "data": {"cpu": 99.4},
            }
        ],
        "alternatives_json": [],
        "blast_radius_json": {
            "target_service": "auth-service",
            "downstream_impacted": ["api-gateway"],
            "estimated_affected_users": 6400,
            "estimated_revenue_loss_per_minute_usd": 850.0,
            "risk_tier": "HIGH",
        },
        "recommended_remediation": "Scale Auth pods to 8 replicas and apply edge rate limiting",
        "remediation_status": "VERIFIED",
    },
}


@router.get("", response_model=List[Dict[str, Any]])
async def list_incidents(db: AsyncSession = Depends(get_db)):
    try:
        q = select(Incident)
        res = await db.execute(q)
        db_incs = res.scalars().all()
        if db_incs:
            return [
                {
                    "id": inc.id,
                    "title": inc.title,
                    "severity": inc.severity.value,
                    "status": inc.status.value,
                    "affected_service": inc.affected_service,
                    "created_at": inc.created_at.isoformat(),
                    "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
                    "symptoms": inc.symptoms,
                    "suspected_root_cause": inc.suspected_root_cause,
                    "confidence": inc.confidence,
                    "evidence_json": inc.evidence_json or [],
                    "blast_radius_json": inc.blast_radius_json or {},
                    "recommended_remediation": inc.recommended_remediation,
                    "remediation_status": inc.remediation_status.value if inc.remediation_status else "PENDING_APPROVAL",
                }
                for inc in db_incs
            ]
    except Exception:
        pass

    return list(DEFAULT_INCIDENTS.values())


@router.get("/{incident_id}", response_model=Dict[str, Any])
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    try:
        q = select(Incident).where(Incident.id == incident_id)
        res = await db.execute(q)
        inc = res.scalar_one_or_none()
        if inc:
            return {
                "id": inc.id,
                "title": inc.title,
                "severity": inc.severity.value,
                "status": inc.status.value,
                "affected_service": inc.affected_service,
                "created_at": inc.created_at.isoformat(),
                "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
                "symptoms": inc.symptoms,
                "suspected_root_cause": inc.suspected_root_cause,
                "confidence": inc.confidence,
                "evidence_json": inc.evidence_json or [],
                "alternatives_json": inc.alternatives_json or [],
                "blast_radius_json": inc.blast_radius_json or {},
                "recommended_remediation": inc.recommended_remediation,
                "remediation_status": inc.remediation_status.value if inc.remediation_status else "PENDING_APPROVAL",
            }
    except Exception:
        pass

    if incident_id in DEFAULT_INCIDENTS:
        return DEFAULT_INCIDENTS[incident_id]

    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")


@router.post("/{incident_id}/investigate")
async def investigate_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Executes the full multi-agent investigation workflow."""
    result = await agent_orchestrator.investigate_incident(incident_id, db_session=db)
    # Update local in-memory store as well
    if incident_id in DEFAULT_INCIDENTS:
        DEFAULT_INCIDENTS[incident_id]["status"] = "AWAITING_APPROVAL"
        DEFAULT_INCIDENTS[incident_id]["suspected_root_cause"] = result["suspected_root_cause"]
        DEFAULT_INCIDENTS[incident_id]["confidence"] = result["confidence"]
        DEFAULT_INCIDENTS[incident_id]["evidence_json"] = result["evidence"]
        DEFAULT_INCIDENTS[incident_id]["blast_radius_json"] = result["blast_radius"]
        DEFAULT_INCIDENTS[incident_id]["recommended_remediation"] = result["remediation_proposal"]["description"]
    return result


@router.post("/{incident_id}/remediation/approve")
async def approve_remediation(
    incident_id: str,
    req: RemediationApprovalRequest,
    db: AsyncSession = Depends(get_db),
):
    """Executes human-approved remediation in simulator, verifies recovery, and drafts postmortem."""
    if not req.approved:
        if incident_id in DEFAULT_INCIDENTS:
            DEFAULT_INCIDENTS[incident_id]["remediation_status"] = "REJECTED"
        return {"success": False, "status": "REJECTED", "message": "Remediation was rejected by operator."}

    result = await agent_orchestrator.execute_approved_remediation(
        req.action_id,
        incident_id,
        db_session=db,
    )
    if incident_id in DEFAULT_INCIDENTS:
        DEFAULT_INCIDENTS[incident_id]["status"] = "RESOLVED"
        DEFAULT_INCIDENTS[incident_id]["remediation_status"] = "VERIFIED"
        DEFAULT_INCIDENTS[incident_id]["resolved_at"] = datetime.utcnow().isoformat()

    return result


@router.get("/{incident_id}/postmortem")
async def get_postmortem(incident_id: str, db: AsyncSession = Depends(get_db)):
    try:
        q = select(Postmortem).where(Postmortem.incident_id == incident_id)
        res = await db.execute(q)
        pm = res.scalar_one_or_none()
        if pm:
            return {
                "id": pm.id,
                "incident_id": pm.incident_id,
                "title": pm.title,
                "status": pm.status,
                "root_cause_summary": pm.root_cause_summary,
                "impact_summary": pm.impact_summary,
                "timeline_json": pm.timeline_json or [],
                "what_went_well": pm.what_went_well or [],
                "what_went_wrong": pm.what_went_wrong or [],
                "action_items_json": pm.action_items_json or [],
                "markdown_content": pm.markdown_content,
                "generated_at": pm.generated_at.isoformat(),
            }
    except Exception:
        pass

    # Default fallback postmortem
    return {
        "id": f"POST-{incident_id}",
        "incident_id": incident_id,
        "title": "Google SRE Postmortem: Database Connection Pool Exhaustion Outage",
        "status": "PUBLISHED",
        "root_cause_summary": "HikariCP connection pool was saturated under batch query load, resulting in cascaded 504 timeouts.",
        "impact_summary": "14,200 active checkout sessions delayed. Total financial exposure estimated at $34,300.",
        "timeline_json": [
            {"time": "T-15m", "event": "Batch reconciliation query initiated"},
            {"time": "T-10m", "event": "Connection pool hit 98% capacity; latency breached 500ms"},
            {"time": "T-08m", "event": "AegisOps ML Anomaly Engine triggered Critical Alert INC-2026-0042"},
            {"time": "T-05m", "event": "AI Orchestrator synthesized RCA and proposed pool expansion & replica scale"},
            {"time": "T-02m", "event": "Operator approved remediation; automated executor recycled pool"},
            {"time": "T+00m", "event": "Verification engine confirmed p95 latency returned to 48ms nominal"},
        ],
        "what_went_well": [
            "AegisOps ML engine detected anomaly 4 minutes prior to user complaint influx",
            "Automated blast radius calculation accurately quantified business risk",
            "Remediation verification confirmed full recovery without manual rollback",
        ],
        "what_went_wrong": [
            "Batch reconciliation query lacked statement timeout",
            "HikariCP pool size was fixed to 100 rather than dynamically auto-scaled",
        ],
        "action_items_json": [
            {"action": "Add 3000ms query timeout to all reconciliation repository queries", "owner": "DB-Infra", "priority": "P0"},
            {"action": "Configure dynamic connection pooling with circuit breakers", "owner": "Payment-Team", "priority": "P1"},
        ],
        "markdown_content": f"# Postmortem for {incident_id}\n\nAutomated Google SRE Postmortem generated by AegisOps AI Report Agent.",
        "generated_at": datetime.utcnow().isoformat(),
    }
