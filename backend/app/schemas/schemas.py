from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.entities import (
    UserRole,
    IncidentSeverity,
    IncidentStatus,
    RemediationRisk,
    RemediationStatus,
)


# ==========================================
# Auth & User Schemas
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.OPERATOR


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ==========================================
# Service & Topology Schemas
# ==========================================
class ServiceBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    tier: str = "tier-1"
    dependencies: List[str] = []


class ServiceResponse(ServiceBase):
    id: int
    health: str  # healthy, degraded, critical
    latency_p95: float
    error_rate: float
    throughput: float
    cpu_percent: float
    memory_percent: float
    db_connections: int
    queue_depth: int
    risk_score: float
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TopologyNode(BaseModel):
    id: str
    name: str
    display_name: str
    health: str
    tier: str
    latency_p95: float
    error_rate: float
    throughput: float
    cpu_percent: float
    risk_score: float
    is_impacted: bool = False


class TopologyEdge(BaseModel):
    source: str
    target: str
    traffic_volume: float
    latency_ms: float
    status: str  # normal, degraded, failed


class TopologyResponse(BaseModel):
    nodes: List[TopologyNode]
    edges: List[TopologyEdge]
    timestamp: datetime
    active_incidents: int


# ==========================================
# Metrics & Telemetry Schemas
# ==========================================
class MetricDataPoint(BaseModel):
    timestamp: datetime
    value: float


class MetricSeries(BaseModel):
    service_name: str
    metric_name: str
    unit: str
    points: List[MetricDataPoint]


class TelemetrySummary(BaseModel):
    system_health_score: float  # 0 to 100
    overall_risk_score: float   # 0 to 1
    active_incidents_count: int
    monitored_services_count: int
    anomalies_detected_count: int
    running_ai_investigations: int
    prediction_status: str


# ==========================================
# Logs Schemas
# ==========================================
class LogEntry(BaseModel):
    id: int
    timestamp: datetime
    service_name: str
    level: str
    trace_id: Optional[str] = None
    path: Optional[str] = None
    message: str
    metadata_json: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Anomaly & Prediction Schemas
# ==========================================
class AnomalyResponse(BaseModel):
    id: int
    timestamp: datetime
    service_name: str
    metric_name: str
    expected_value: float
    actual_value: float
    anomaly_score: float
    severity: IncidentSeverity
    detection_strategy: str
    details_json: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class PredictionResponse(BaseModel):
    service_name: str
    probability: float
    horizon_minutes: int = 30
    contributing_signals: List[Dict[str, Any]]
    risk_tier: str
    predicted_at: datetime


# ==========================================
# Incident & RCA Schemas
# ==========================================
class IncidentCreate(BaseModel):
    title: str
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    affected_service: str
    symptoms: Optional[str] = None


class EvidenceItem(BaseModel):
    type: str  # metric, log, deployment, historical_incident
    title: str
    description: str
    confidence_weight: float
    data: Dict[str, Any] = {}


class AlternativeHypothesis(BaseModel):
    cause: str
    probability: float
    reason_rejected_or_unlikely: str


class IncidentResponse(BaseModel):
    id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    affected_service: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    symptoms: Optional[str] = None
    suspected_root_cause: Optional[str] = None
    confidence: float
    evidence_json: List[EvidenceItem] = []
    alternatives_json: List[AlternativeHypothesis] = []
    blast_radius_json: Dict[str, Any] = {}
    recommended_remediation: Optional[str] = None
    remediation_status: RemediationStatus

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Remediation Schemas
# ==========================================
class RemediationActionResponse(BaseModel):
    id: str
    incident_id: str
    action_type: str
    description: str
    risk_level: RemediationRisk
    target_service: str
    parameters_json: Dict[str, Any] = {}
    status: RemediationStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    before_metrics_json: Dict[str, Any] = {}
    after_metrics_json: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class RemediationApprovalRequest(BaseModel):
    action_id: str
    approved: bool
    notes: Optional[str] = None


# ==========================================
# Agent Trace Schemas
# ==========================================
class AgentStepResponse(BaseModel):
    step_number: int
    agent_name: str
    status: str
    action_summary: str
    tool_called: Optional[str] = None
    tool_arguments: Optional[Dict[str, Any]] = None
    tool_result: Optional[Dict[str, Any]] = None
    evidence_ref: Optional[str] = None
    duration_ms: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentRunResponse(BaseModel):
    id: str
    incident_id: str
    run_type: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    total_duration_ms: int
    tokens_used: int
    cost_usd: float
    summary: Optional[str] = None
    steps: List[AgentStepResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Knowledge & RAG Schemas
# ==========================================
class KnowledgeUploadRequest(BaseModel):
    title: str
    category: str = "runbook"
    content: str
    source: str = "manual_upload"


class KnowledgeDocumentResponse(BaseModel):
    id: int
    title: str
    category: str
    source: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeSearchResult(BaseModel):
    document_id: int
    title: str
    category: str
    chunk_content: str
    relevance_score: float
    source: str


# ==========================================
# Standout Features: Time-Travel & Postmortem & NL2Metrics
# ==========================================
class TimeTravelSnapshot(BaseModel):
    target_timestamp: datetime
    services: List[ServiceResponse]
    metrics: Dict[str, Dict[str, float]]
    active_incidents: List[IncidentResponse]
    recent_logs: List[LogEntry]
    deployments: List[Dict[str, Any]]


class PostmortemResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    status: str
    root_cause_summary: str
    impact_summary: str
    timeline_json: List[Dict[str, Any]]
    what_went_well: List[str]
    what_went_wrong: List[str]
    action_items_json: List[Dict[str, Any]]
    markdown_content: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NLQueryRequest(BaseModel):
    query: str
    service_filter: Optional[str] = None


class NLQueryResponse(BaseModel):
    query: str
    interpreted_intent: str
    chart_type: str  # line, bar, area, table
    services: List[str]
    metrics_queried: List[str]
    time_range_minutes: int
    chart_data: List[Dict[str, Any]]
    ai_insights: str
    sql_or_metric_expression: Optional[str] = None
