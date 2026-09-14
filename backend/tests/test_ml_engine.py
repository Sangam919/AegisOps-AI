import pytest
from app.services.ml_engine import ml_engine


def test_zscore_baseline():
    from app.services.ml_engine import MLEngine
    engine = MLEngine()
    service = "isolated-test-service"
    metric = "latency_p95"

    # Seed baseline
    for _ in range(25):
        engine.record_datapoint(service, metric, 85.0)

    # Test nominal point
    z_nom, mean, std = engine.compute_zscore_anomaly(service, metric, 85.0)
    assert z_nom < 1.0

    # Test extreme spike
    z_spike, _, _ = engine.compute_zscore_anomaly(service, metric, 950.0)
    assert z_spike > 5.0


def test_unified_anomaly_scoring():
    service = "payment-service"
    nominal_metrics = {
        "latency_p95": 85.0,
        "error_rate": 0.001,
        "cpu_percent": 34.0,
        "memory_percent": 42.0,
        "db_connections": 30,
    }
    score_nom = ml_engine.unified_anomaly_score(service, nominal_metrics)
    assert score_nom["anomaly_score"] < 0.40

    spike_metrics = {
        "latency_p95": 920.0,
        "error_rate": 0.28,
        "cpu_percent": 88.0,
        "memory_percent": 85.0,
        "db_connections": 98,
    }
    score_spike = ml_engine.unified_anomaly_score(service, spike_metrics)
    assert score_spike["is_anomaly"] is True
    assert score_spike["severity"] in ["HIGH", "CRITICAL"]


def test_incident_dna_matching():
    current_metrics = {
        "latency_p95": 920.0,
        "error_rate": 0.25,
        "cpu_percent": 40.0,
        "memory_percent": 45.0,
        "db_connections": 95,
        "throughput": 110.0,
        "queue_depth": 10,
    }
    recent_logs = [{"level": "ERROR", "message": "ConnectionPoolExhaustedException"}]

    matches = ml_engine.match_incident_dna("payment-service", current_metrics, recent_logs)
    assert len(matches) > 0
    top_match = matches[0]
    assert "HikariCP" in top_match["title"] or "Connection" in top_match["title"]
    assert top_match["similarity_percentage"] > 70.0


def test_predict_incident_risk():
    critical_metrics = {
        "latency_p95": 650.0,
        "error_rate": 0.08,
        "cpu_percent": 82.0,
        "memory_percent": 75.0,
        "db_connections": 88,
    }
    pred = ml_engine.predict_incident_risk("payment-service", critical_metrics)
    assert pred["probability"] > 0.50
    assert pred["horizon_minutes"] == 30
    assert len(pred["contributing_signals"]) > 0
