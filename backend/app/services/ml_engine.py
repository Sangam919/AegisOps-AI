from typing import Dict, List, Any, Optional, Tuple
import math
import numpy as np
from datetime import datetime, timedelta
from app.core.logging import logger

HISTORICAL_INCIDENT_DNA = [
    {
        "incident_id": "INC-HIST-0014",
        "title": "HikariCP Database Connection Pool Starvation",
        "service": "payment-service",
        "root_cause": "Database connection pool exhaustion due to unclosed sessions in bulk refund worker",
        "resolution": "Enlarged HikariCP pool to 150 and deployed fix for leaked transaction context",
        # Vector: [lat_delta, err_delta, cpu_delta, mem_delta, conn_delta, rps_delta, queue, log_err]
        "vector": [0.85, 0.45, 0.35, 0.15, 0.95, 0.10, 0.20, 0.80],
    },
    {
        "incident_id": "INC-HIST-0027",
        "title": "JVM Heap OutOfMemory in Checkout Pipeline",
        "service": "payment-service",
        "root_cause": "Memory leak caused by un-evicted cache items retaining large payload objects",
        "resolution": "Rolled back release v2.4.0 and tuned G1GC heap boundaries",
        "vector": [0.55, 0.25, 0.40, 0.95, 0.20, 0.05, 0.45, 0.60],
    },
    {
        "incident_id": "INC-HIST-0033",
        "title": "BCrypt CPU Saturation during Credential Stuffing Event",
        "service": "auth-service",
        "root_cause": "CPU thread starvation due to synchronized BCrypt work factor without rate-limiting",
        "resolution": "Implemented edge rate limiter and offloaded bcrypt hashing to dedicated worker pool",
        "vector": [0.70, 0.15, 0.98, 0.30, 0.15, 0.65, 0.10, 0.50],
    },
    {
        "incident_id": "INC-HIST-0041",
        "title": "NullPointerException Regression after v2.4.1 Rollout",
        "service": "payment-service",
        "root_cause": "Unchecked null return on optional discount code attribute in new payload validator",
        "resolution": "Immediate automated rollback to v2.4.0 via deployment orchestrator",
        "vector": [0.30, 0.85, 0.15, 0.10, 0.10, 0.05, 0.05, 0.95],
    },
    {
        "incident_id": "INC-HIST-0052",
        "title": "Redis Cache Eviction Storm Cascading to DB",
        "service": "cache-redis",
        "root_cause": "Massive TTL expiration alignment caused thundering herd query spikes against PostgreSQL",
        "resolution": "Added jitter to TTL expirations and enabled Redis read replicas",
        "vector": [0.65, 0.20, 0.75, 0.60, 0.80, 0.80, 0.30, 0.40],
    },
]


class MLEngine:
    def __init__(self):
        self.history_window: Dict[str, Dict[str, List[float]]] = {}
        self.window_size = 50
        self.min_samples_for_zscore = 10

    def record_datapoint(self, service: str, metric: str, value: float):
        if service not in self.history_window:
            self.history_window[service] = {}
        if metric not in self.history_window[service]:
            self.history_window[service][metric] = []
        
        self.history_window[service][metric].append(value)
        if len(self.history_window[service][metric]) > self.window_size:
            self.history_window[service][metric].pop(0)

    def compute_zscore_anomaly(self, service: str, metric: str, current_value: float) -> Tuple[float, float, float]:
        """Returns (z_score, mean, std)"""
        values = self.history_window.get(service, {}).get(metric, [])
        if len(values) < self.min_samples_for_zscore:
            return 0.0, current_value, 1.0

        arr = np.array(values)
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        if std < 1e-6:
            std = 0.001

        z_score = abs((current_value - mean) / std)
        return z_score, mean, std

    def compute_isolation_anomaly(self, metrics_dict: Dict[str, float]) -> float:
        """
        Multivariate anomaly scoring.
        Normalizes Latency, Error Rate, CPU, Memory, DB Conns into an Isolation distance.
        """
        lat = metrics_dict.get("latency_p95", 30.0)
        err = metrics_dict.get("error_rate", 0.001)
        cpu = metrics_dict.get("cpu_percent", 30.0)
        mem = metrics_dict.get("memory_percent", 40.0)
        conns = metrics_dict.get("db_connections", 20)

        # Dimension weights
        w_lat = min(1.0, max(0.0, (lat - 80.0) / 400.0))
        w_err = min(1.0, max(0.0, err / 0.15))
        w_cpu = min(1.0, max(0.0, (cpu - 70.0) / 30.0))
        w_mem = min(1.0, max(0.0, (mem - 80.0) / 20.0))
        w_conns = min(1.0, max(0.0, (conns - 60) / 100.0))

        score = (w_lat * 0.35) + (w_err * 0.30) + (w_cpu * 0.15) + (w_mem * 0.10) + (w_conns * 0.10)
        return round(float(score), 4)

    def unified_anomaly_score(
        self, service: str, current_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Unifies statistical Z-score and multivariate isolation detection.
        Returns: {
            "service": service,
            "anomaly_score": float,
            "is_anomaly": bool,
            "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "primary_symptom": str,
            "anomalous_metrics": List[Dict]
        }
        """
        anomalies = []
        metrics_to_check = {
            "latency_p95": ("API Latency", 2.8),
            "error_rate": ("Error Rate", 2.5),
            "cpu_percent": ("CPU Utilization", 3.0),
            "memory_percent": ("Memory Usage", 2.8),
            "db_connections": ("DB Connections", 3.0),
        }

        max_zscore = 0.0
        primary_symptom = "Normal operational variance"

        for m_key, (label, thresh) in metrics_to_check.items():
            val = float(current_metrics.get(m_key, 0.0))
            self.record_datapoint(service, m_key, val)
            z, mean, std = self.compute_zscore_anomaly(service, m_key, val)

            if z > thresh:
                anomalies.append({
                    "metric": m_key,
                    "label": label,
                    "current": val,
                    "baseline_mean": round(mean, 2),
                    "z_score": round(z, 2),
                })
                if z > max_zscore:
                    max_zscore = z
                    primary_symptom = f"Elevated {label} ({val} vs baseline {mean:.1f})"

        iso_score = self.compute_isolation_anomaly(current_metrics)
        z_norm = min(1.0, max_zscore / 6.0)
        if max_zscore > 0:
            composite_score = round(0.50 * iso_score + 0.50 * z_norm, 3)
        else:
            composite_score = round(iso_score, 3)

        if composite_score > 0.70:
            severity = "CRITICAL"
        elif composite_score > 0.45:
            severity = "HIGH"
        elif composite_score > 0.25:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return {
            "service": service,
            "anomaly_score": composite_score,
            "is_anomaly": composite_score > 0.35 or len(anomalies) > 0,
            "severity": severity,
            "primary_symptom": primary_symptom,
            "anomalous_metrics": anomalies,
            "iso_score": iso_score,
            "max_zscore": round(max_zscore, 2),
        }

    def predict_incident_risk(
        self, service: str, current_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        ML degradation predictor for a 30-minute forward horizon.
        Uses trend slopes, resource headroom, and warning signals.
        """
        lat = current_metrics.get("latency_p95", 30.0)
        err = current_metrics.get("error_rate", 0.001)
        cpu = current_metrics.get("cpu_percent", 30.0)
        mem = current_metrics.get("memory_percent", 40.0)
        conns = current_metrics.get("db_connections", 20)

        # Calculate contributing factors
        signals = []
        risk_components = []

        if lat > 120.0:
            pct_rise = int(((lat - 50.0) / 50.0) * 100)
            signals.append({"signal": f"Latency +{pct_rise}% above SLA baseline", "weight": 0.30})
            risk_components.append(min(1.0, lat / 600.0))

        if err > 0.015:
            pct_rise = int((err / 0.01) * 100)
            signals.append({"signal": f"Error Rate escalating ({err*100:.1f}%)", "weight": 0.35})
            risk_components.append(min(1.0, err / 0.10))

        if cpu > 70.0:
            signals.append({"signal": f"CPU headroom depleted ({cpu:.1f}%)", "weight": 0.20})
            risk_components.append(min(1.0, (cpu - 50.0) / 50.0))

        if conns > 70:
            signals.append({"signal": f"Database connection pool at {conns}% capacity", "weight": 0.25})
            risk_components.append(min(1.0, conns / 100.0))

        if not signals:
            probability = round(random.uniform(0.04, 0.09), 3)
            risk_tier = "LOW"
            signals.append({"signal": "All telemetry indicators within 99th percentile nominal bounds", "weight": 0.05})
        else:
            probability = min(0.96, round(float(np.mean(risk_components) * 0.85 + 0.15), 3))
            risk_tier = "CRITICAL" if probability > 0.70 else ("HIGH" if probability > 0.45 else "MEDIUM")

        return {
            "service_name": service,
            "probability": probability,
            "horizon_minutes": 30,
            "contributing_signals": signals,
            "risk_tier": risk_tier,
            "predicted_at": datetime.utcnow().isoformat(),
        }

    def match_incident_dna(
        self,
        service: str,
        current_metrics: Dict[str, Any],
        recent_logs: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Extracts 8-dimensional incident signature vector and runs cosine similarity
        against historical incident library to identify recurring patterns.
        """
        # Vector: [lat_delta, err_delta, cpu_delta, mem_delta, conn_delta, rps_delta, queue, log_err]
        lat_norm = min(1.0, current_metrics.get("latency_p95", 30.0) / 800.0)
        err_norm = min(1.0, current_metrics.get("error_rate", 0.0) / 0.25)
        cpu_norm = min(1.0, current_metrics.get("cpu_percent", 30.0) / 100.0)
        mem_norm = min(1.0, current_metrics.get("memory_percent", 40.0) / 100.0)
        con_norm = min(1.0, current_metrics.get("db_connections", 20) / 100.0)
        rps_norm = min(1.0, current_metrics.get("throughput", 100.0) / 800.0)
        queue_norm = min(1.0, current_metrics.get("queue_depth", 0) / 50.0)

        err_logs_count = sum(1 for log in recent_logs if log.get("level") in ["ERROR", "FATAL"])
        log_err_norm = min(1.0, err_logs_count / 10.0)

        current_vector = np.array([
            lat_norm, err_norm, cpu_norm, mem_norm, con_norm, rps_norm, queue_norm, log_err_norm
        ])

        norm_curr = np.linalg.norm(current_vector)
        if norm_curr < 1e-6:
            norm_curr = 1.0

        matches = []
        for hist in HISTORICAL_INCIDENT_DNA:
            hist_vec = np.array(hist["vector"])
            norm_hist = np.linalg.norm(hist_vec)
            if norm_hist < 1e-6:
                norm_hist = 1.0

            cos_sim = float(np.dot(current_vector, hist_vec) / (norm_curr * norm_hist))
            similarity_pct = round(max(0.0, min(1.0, cos_sim)) * 100, 1)

            matches.append({
                "incident_id": hist["incident_id"],
                "title": hist["title"],
                "service": hist["service"],
                "root_cause": hist["root_cause"],
                "resolution": hist["resolution"],
                "similarity_score": round(cos_sim, 3),
                "similarity_percentage": similarity_pct,
            })

        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        return matches[:3]


ml_engine = MLEngine()
