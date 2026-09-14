from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query
from app.schemas.schemas import TelemetrySummary, LogEntry, PredictionResponse
from app.services.simulator import simulator
from app.services.ml_engine import ml_engine

router = APIRouter(prefix="/telemetry", tags=["Telemetry & Observability"])


@router.get("/summary", response_model=TelemetrySummary)
async def get_telemetry_summary():
    state = simulator.step()
    services = state["services"]

    total_services = len(services)
    healthy_count = sum(1 for s in services.values() if s["health"] == "healthy")
    degraded_count = sum(1 for s in services.values() if s["health"] == "degraded")
    critical_count = sum(1 for s in services.values() if s["health"] == "critical")

    # Health score from 0 to 100
    health_score = max(
        12.0,
        100.0 - (degraded_count * 15.0) - (critical_count * 38.0),
    )

    # Max risk score among services
    max_risk = max(s["risk_score"] for s in services.values()) if services else 0.05
    active_incidents = len(state["active_scenarios"])

    # Count anomalies
    anomalies_count = 0
    for s_name, s_data in services.items():
        anom = ml_engine.unified_anomaly_score(s_name, s_data)
        if anom["is_anomaly"]:
            anomalies_count += 1

    prediction_status = "CRITICAL_ALERT" if max_risk > 0.7 else ("ELEVATED_RISK" if max_risk > 0.4 else "STABLE")

    return TelemetrySummary(
        system_health_score=round(health_score, 1),
        overall_risk_score=round(max_risk, 2),
        active_incidents_count=active_incidents,
        monitored_services_count=total_services,
        anomalies_detected_count=anomalies_count,
        running_ai_investigations=1 if active_incidents > 0 else 0,
        prediction_status=prediction_status,
    )


@router.get("/metrics")
async def get_dashboard_metrics(time_window_minutes: int = 15):
    """Returns multi-metric time series formatted for Recharts line and area charts."""
    now = datetime.utcnow()
    state = simulator.step()
    services = state["services"]

    # Generate 15 timeline points with realistic micro-variations
    points = []
    for i in range(15, 0, -1):
        t_label = (now - timedelta(minutes=i)).strftime("%H:%M")
        factor = 0.85 + (0.15 * (15 - i) / 15.0)

        # Aggregated telemetry
        avg_cpu = sum(s["cpu_percent"] for s in services.values()) / len(services)
        avg_mem = sum(s["memory_percent"] for s in services.values()) / len(services)
        tot_rps = sum(s["throughput"] for s in services.values())
        max_lat = max(s["latency_p95"] for s in services.values())
        avg_err = (sum(s["error_rate"] for s in services.values()) / len(services)) * 100.0
        db_conns = services.get("database-cluster", {}).get("db_connections", 120)

        points.append({
            "timestamp": t_label,
            "cpu_utilization": round(avg_cpu * factor, 1),
            "memory_utilization": round(avg_mem, 1),
            "throughput": round(tot_rps * factor, 1),
            "max_latency_p95": round(max_lat * factor, 1),
            "error_rate_pct": round(avg_err * factor, 2),
            "db_connections": int(db_conns * factor),
        })

    return {"time_range": f"{time_window_minutes}m", "series": points}


@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    service_name: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 50,
):
    state = simulator.step()
    logs = list(simulator.recent_logs)

    filtered = []
    for l in reversed(logs):
        if service_name and service_name != "all" and l.get("service_name") != service_name:
            continue
        if level and level != "ALL" and l.get("level") != level:
            continue
        filtered.append(
            LogEntry(
                id=l.get("id", 1),
                timestamp=datetime.fromisoformat(l["timestamp"]) if isinstance(l["timestamp"], str) else l["timestamp"],
                service_name=l["service_name"],
                level=l["level"],
                trace_id=l.get("trace_id", "trc-000000"),
                path=l.get("path", "/"),
                message=l["message"],
                metadata_json=l.get("metadata", {}),
            )
        )
        if len(filtered) >= limit:
            break

    return filtered


@router.get("/time-travel")
async def get_time_travel_snapshot(minutes_ago: int = Query(5, ge=0, le=120)):
    """
    Replays infrastructure state at any point in time T - minutes_ago.
    Allows scrubbing through past telemetry and service health.
    """
    target_time = datetime.utcnow() - timedelta(minutes=minutes_ago)
    state = simulator.step()
    svcs = state["services"]

    # If looking back into the past, simulate earlier degradation or nominal baseline
    ratio = max(0.1, 1.0 - (minutes_ago / 30.0))
    snapshot_services = {}
    for name, s in svcs.items():
        copy_s = dict(s)
        copy_s["latency_p95"] = round(s["latency_p95"] * ratio, 1)
        copy_s["error_rate"] = round(s["error_rate"] * ratio, 4)
        snapshot_services[name] = copy_s

    return {
        "target_timestamp": target_time.isoformat(),
        "minutes_ago": minutes_ago,
        "services": snapshot_services,
        "active_scenarios_at_time": state["active_scenarios"] if minutes_ago < 10 else [],
        "summary": f"Historical replay state at {target_time.strftime('%H:%M:%S UTC')} (T-{minutes_ago}m)",
    }


@router.get("/predictions", response_model=List[PredictionResponse])
async def get_incident_predictions():
    state = simulator.step()
    predictions = []

    for s_name, s_data in state["services"].items():
        pred = ml_engine.predict_incident_risk(s_name, s_data)
        predictions.append(
            PredictionResponse(
                service_name=pred["service_name"],
                probability=pred["probability"],
                horizon_minutes=pred["horizon_minutes"],
                contributing_signals=pred["contributing_signals"],
                risk_tier=pred["risk_tier"],
                predicted_at=datetime.fromisoformat(pred["predicted_at"]),
            )
        )

    predictions.sort(key=lambda p: p.probability, reverse=True)
    return predictions
