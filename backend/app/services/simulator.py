import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from app.core.logging import logger

SERVICES_CONFIG = {
    "api-gateway": {
        "display_name": "API Gateway",
        "tier": "tier-0",
        "dependencies": ["auth-service", "payment-service", "user-service", "recommendation-service"],
        "base_latency": 25.0,
        "base_error": 0.002,
        "base_rps": 450.0,
        "base_cpu": 28.0,
        "base_mem": 32.0,
        "base_conns": 40,
        "base_queue": 0,
    },
    "auth-service": {
        "display_name": "Authentication Service",
        "tier": "tier-1",
        "dependencies": ["cache-redis", "database-cluster"],
        "base_latency": 35.0,
        "base_error": 0.005,
        "base_rps": 180.0,
        "base_cpu": 30.0,
        "base_mem": 40.0,
        "base_conns": 25,
        "base_queue": 0,
    },
    "payment-service": {
        "display_name": "Payment Service",
        "tier": "tier-1",
        "dependencies": ["database-cluster", "message-queue"],
        "base_latency": 85.0,
        "base_error": 0.001,
        "base_rps": 95.0,
        "base_cpu": 34.0,
        "base_mem": 42.0,
        "base_conns": 30,
        "base_queue": 5,
    },
    "user-service": {
        "display_name": "User Profile Service",
        "tier": "tier-2",
        "dependencies": ["database-cluster", "cache-redis"],
        "base_latency": 45.0,
        "base_error": 0.003,
        "base_rps": 220.0,
        "base_cpu": 22.0,
        "base_mem": 35.0,
        "base_conns": 20,
        "base_queue": 0,
    },
    "recommendation-service": {
        "display_name": "Recommendation Engine",
        "tier": "tier-3",
        "dependencies": ["cache-redis"],
        "base_latency": 110.0,
        "base_error": 0.010,
        "base_rps": 80.0,
        "base_cpu": 45.0,
        "base_mem": 58.0,
        "base_conns": 10,
        "base_queue": 2,
    },
    "database-cluster": {
        "display_name": "PostgreSQL Primary Cluster",
        "tier": "tier-0",
        "dependencies": [],
        "base_latency": 12.0,
        "base_error": 0.0005,
        "base_rps": 650.0,
        "base_cpu": 38.0,
        "base_mem": 62.0,
        "base_conns": 110,
        "base_queue": 0,
    },
    "cache-redis": {
        "display_name": "Redis Distributed Cache",
        "tier": "tier-1",
        "dependencies": [],
        "base_latency": 3.0,
        "base_error": 0.0001,
        "base_rps": 850.0,
        "base_cpu": 15.0,
        "base_mem": 50.0,
        "base_conns": 65,
        "base_queue": 0,
    },
    "message-queue": {
        "display_name": "Kafka Event Bus",
        "tier": "tier-1",
        "dependencies": [],
        "base_latency": 8.0,
        "base_error": 0.0002,
        "base_rps": 400.0,
        "base_cpu": 20.0,
        "base_mem": 45.0,
        "base_conns": 50,
        "base_queue": 12,
    },
}


class TelemetrySimulator:
    def __init__(self):
        self.services = SERVICES_CONFIG
        self.traffic_multiplier = 1.0  # 0.5 low, 1.0 normal, 2.5 high, 5.0 extreme
        self.active_scenarios: Dict[str, Dict[str, Any]] = {}
        self.recent_logs: List[Dict[str, Any]] = []
        self.max_logs_buffer = 500
        self.time_offset_seconds = 0
        self.step_counter = 0

    def set_traffic(self, level: str):
        mapping = {"low": 0.5, "normal": 1.0, "high": 2.5, "extreme": 5.0}
        self.traffic_multiplier = mapping.get(level.lower(), 1.0)
        logger.info(f"Simulator: Traffic multiplier updated to {self.traffic_multiplier}x")

    def inject_scenario(self, scenario_name: str, target_service: Optional[str] = None) -> Dict[str, Any]:
        """
        Injects a failure mode:
        - db_exhaustion
        - memory_leak
        - cpu_spike
        - latency_spike
        - traffic_surge
        - deployment_regression
        - cache_eviction_storm
        - cascading_failure
        """
        scenario_id = f"{scenario_name}_{int(datetime.utcnow().timestamp())}"
        
        target = target_service or {
            "db_exhaustion": "payment-service",
            "memory_leak": "payment-service",
            "cpu_spike": "auth-service",
            "latency_spike": "api-gateway",
            "traffic_surge": "api-gateway",
            "deployment_regression": "payment-service",
            "cache_eviction_storm": "cache-redis",
            "cascading_failure": "database-cluster",
        }.get(scenario_name, "payment-service")

        scenario_info = {
            "id": scenario_id,
            "name": scenario_name,
            "target_service": target,
            "started_at": datetime.utcnow(),
            "progress": 0.0,  # 0.0 to 1.0 ramp up
            "remediated": False,
            "recovery_progress": 0.0,
        }
        self.active_scenarios[scenario_name] = scenario_info
        logger.warning(f"Simulator: Injected scenario '{scenario_name}' into service '{target}'")
        return scenario_info

    def resolve_scenario(self, scenario_name: str) -> bool:
        if scenario_name in self.active_scenarios:
            self.active_scenarios[scenario_name]["remediated"] = True
            logger.info(f"Simulator: Scenario '{scenario_name}' flagged as remediated. Starting recovery curve.")
            return True
        return False

    def clear_all_scenarios(self):
        self.active_scenarios.clear()
        logger.info("Simulator: Cleared all active scenarios.")

    def step(self) -> Dict[str, Any]:
        """Advances the simulation by one tick, returning fresh metrics and generated logs."""
        self.step_counter += 1
        now = datetime.utcnow()
        current_metrics: Dict[str, Dict[str, Any]] = {}
        new_logs: List[Dict[str, Any]] = []

        # Diurnal wave (simulating normal daily peak and trough)
        diurnal_factor = 1.0 + 0.15 * math.sin(self.step_counter / 15.0)

        # Update scenario progression & recovery
        for name, sc in list(self.active_scenarios.items()):
            if sc["remediated"]:
                sc["recovery_progress"] = min(1.0, sc["recovery_progress"] + 0.25)
                if sc["recovery_progress"] >= 1.0:
                    del self.active_scenarios[name]
            else:
                sc["progress"] = min(1.0, sc["progress"] + 0.20)

        # Compute state for each service
        for s_name, cfg in self.services.items():
            mult = self.traffic_multiplier * diurnal_factor
            jitter = random.uniform(-0.04, 0.04)

            # Base metrics
            latency = cfg["base_latency"] * (1.0 + jitter)
            error_rate = max(0.0001, cfg["base_error"] * (1.0 + jitter))
            rps = max(5.0, cfg["base_rps"] * mult * (1.0 + jitter))
            cpu = max(5.0, min(95.0, cfg["base_cpu"] * math.sqrt(mult) + (jitter * 20.0)))
            mem = max(10.0, min(92.0, cfg["base_mem"] + (jitter * 5.0)))
            conns = int(cfg["base_conns"] * mult + (jitter * 10))
            queue = int(cfg["base_queue"] * mult)

            # Apply active failure scenarios
            for s_type, sc in self.active_scenarios.items():
                eff = sc["progress"] * (1.0 - sc["recovery_progress"])
                target = sc["target_service"]

                if s_type == "db_exhaustion":
                    if s_name == "database-cluster":
                        conns = int(conns + (450 * eff))
                        cpu = min(99.0, cpu + (45.0 * eff))
                        latency = latency + (340.0 * eff)
                    elif s_name == target:  # payment-service
                        latency = latency + (880.0 * eff)
                        error_rate = min(0.38, error_rate + (0.32 * eff))
                        conns = int(conns + (85 * eff))
                        if eff > 0.4 and random.random() < 0.65:
                            new_logs.append({
                                "service_name": s_name,
                                "level": "ERROR",
                                "message": f"ConnectionPoolExhaustedException: Timeout waiting for idle connection from pool 'PaymentHikariCP' (active=98, max=100, waitTime=4980ms)",
                                "path": "/v1/payments/process",
                            })
                    elif s_name == "api-gateway":
                        latency = latency + (220.0 * eff)
                        error_rate = min(0.15, error_rate + (0.12 * eff))

                elif s_type == "memory_leak" and s_name == target:
                    mem = min(98.5, mem + (55.0 * eff))
                    cpu = cpu + (25.0 * eff)
                    latency = latency + (400.0 * eff)
                    if eff > 0.5 and random.random() < 0.6:
                        new_logs.append({
                            "service_name": s_name,
                            "level": "WARN",
                            "message": f"JVM Garbage Collection pause duration: 1840ms (ConcurrentMarkSweep). Memory usage: {mem:.1f}%",
                            "path": "/actuator/health",
                        })

                elif s_type == "cpu_spike" and s_name == target:
                    cpu = min(99.8, cpu + (65.0 * eff))
                    latency = latency + (520.0 * eff)
                    if eff > 0.4 and random.random() < 0.5:
                        new_logs.append({
                            "service_name": s_name,
                            "level": "ERROR",
                            "message": "ThreadStarvation: BCrypt hashing thread pool exhausted (queue_capacity=500, rejected=42)",
                            "path": "/api/v1/auth/tokens",
                        })

                elif s_type == "deployment_regression" and s_name == target:
                    error_rate = min(0.42, error_rate + (0.28 * eff))
                    latency = latency + (180.0 * eff)
                    if eff > 0.3 and random.random() < 0.7:
                        new_logs.append({
                            "service_name": s_name,
                            "level": "ERROR",
                            "message": "NullPointerException at com.aegisops.payment.processor.V2Engine.validatePayload(V2Engine.kt:142)",
                            "path": "/v2/checkout",
                        })

                elif s_type == "cache_eviction_storm":
                    if s_name == "cache-redis":
                        cpu = min(96.0, cpu + (55.0 * eff))
                        latency = latency + (45.0 * eff)
                    elif s_name in ["auth-service", "recommendation-service"]:
                        latency = latency + (210.0 * eff)

                elif s_type == "cascading_failure":
                    # Spreads outward
                    if s_name == "database-cluster":
                        conns = 500
                        latency += 400.0 * eff
                        error_rate = min(0.35, error_rate + 0.30 * eff)
                    elif s_name in ["payment-service", "user-service"]:
                        latency += 600.0 * eff
                        error_rate = min(0.45, error_rate + 0.40 * eff)
                    elif s_name == "api-gateway":
                        latency += 350.0 * eff
                        error_rate = min(0.25, error_rate + 0.20 * eff)

            # Determine health status
            if error_rate > 0.10 or latency > (cfg["base_latency"] * 3.5) or cpu > 90.0:
                health = "critical"
                risk_score = min(0.98, 0.65 + (error_rate * 1.5))
            elif error_rate > 0.02 or latency > (cfg["base_latency"] * 1.8) or cpu > 75.0:
                health = "degraded"
                risk_score = min(0.65, 0.30 + (error_rate * 2.0))
            else:
                health = "healthy"
                risk_score = round(max(0.02, min(0.25, (error_rate * 5.0) + (cpu / 400.0))), 3)

            # Standard occasional info log
            if random.random() < 0.15:
                status_code = 500 if health == "critical" else (200 if health == "healthy" else 429)
                new_logs.append({
                    "service_name": s_name,
                    "level": "INFO" if health == "healthy" else ("WARN" if health == "degraded" else "ERROR"),
                    "message": f"HTTP request processed status={status_code} duration={latency:.1f}ms",
                    "path": f"/api/{s_name.replace('-', '/')}/status",
                })

            current_metrics[s_name] = {
                "name": s_name,
                "display_name": cfg["display_name"],
                "tier": cfg["tier"],
                "dependencies": cfg["dependencies"],
                "health": health,
                "latency_p95": round(latency, 1),
                "error_rate": round(error_rate, 4),
                "throughput": round(rps, 1),
                "cpu_percent": round(cpu, 1),
                "memory_percent": round(mem, 1),
                "db_connections": conns,
                "queue_depth": queue,
                "risk_score": round(risk_score, 3),
                "updated_at": now.isoformat(),
            }

        # Store logs in buffer
        for log in new_logs:
            log["id"] = len(self.recent_logs) + 1
            log["timestamp"] = now.isoformat()
            log["trace_id"] = f"trc-{random.randint(100000, 999999)}"
            self.recent_logs.append(log)

        if len(self.recent_logs) > self.max_logs_buffer:
            self.recent_logs = self.recent_logs[-self.max_logs_buffer:]

        return {
            "timestamp": now.isoformat(),
            "services": current_metrics,
            "new_logs": new_logs,
            "active_scenarios": list(self.active_scenarios.keys()),
        }


# Singleton simulator instance
simulator = TelemetrySimulator()
