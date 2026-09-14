from typing import Dict, List, Any, Optional
import time
from datetime import datetime, timedelta
from app.core.logging import logger
from app.services.simulator import simulator
from app.services.ml_engine import ml_engine

RUNBOOKS_DATABASE = [
    {
        "id": 1,
        "title": "Runbook: PostgreSQL / HikariCP Connection Pool Exhaustion",
        "category": "database",
        "keywords": ["connection", "pool", "exhaustion", "hikaricp", "timeout", "saturation", "postgres"],
        "summary": "Step-by-step resolution when application services experience thread blocking on idle DB connections.",
        "steps": [
            "1. Inspect pg_stat_activity to detect long-running uncommitted transactions or table locks.",
            "2. Execute connection pool restart or resize max-pool-size up to allowable database max_connections.",
            "3. If bulk job is starving pool, temporarily pause non-critical batch workers.",
            "4. Verify application p95 latency recovers below SLA threshold.",
        ],
        "recommended_action": "RESTART_CONNECTION_POOL_AND_SCALE",
    },
    {
        "id": 2,
        "title": "Runbook: JVM Heap Memory Leak and High GC Pause Time",
        "category": "runtime",
        "keywords": ["memory", "heap", "leak", "jvm", "oom", "garbage", "collection", "gc"],
        "summary": "Mitigation steps for escalating heap utilization and ConcurrentMarkSweep / G1GC thread stalls.",
        "steps": [
            "1. Capture heap dump snapshot before OOM termination.",
            "2. Gracefully cycle degraded service pods to shed un-evicted cache items.",
            "3. If recent deployment introduced unbounded cache growth, initiate immediate rollback.",
        ],
        "recommended_action": "ROLLBACK_AND_RESTART_PODS",
    },
    {
        "id": 3,
        "title": "Runbook: Auth Service CPU Spike & BCrypt Thread Starvation",
        "category": "security",
        "keywords": ["cpu", "bcrypt", "auth", "starvation", "hash", "thread", "token"],
        "summary": "Actions when authentication processing causes CPU saturation and thread pool starvation.",
        "steps": [
            "1. Enable edge rate-limiting on /api/v1/auth/tokens to mitigate credential credential stuffing.",
            "2. Horizontally scale Auth Service replica count from 3 to 8.",
            "3. Verify CPU drops below 60% and token issue latency normalizes.",
        ],
        "recommended_action": "SCALE_AUTH_REPLICAS_AND_RATE_LIMIT",
    },
    {
        "id": 4,
        "title": "Runbook: Deployment Regression & Code Rollback",
        "category": "deployment",
        "keywords": ["deployment", "regression", "nullpointer", "error", "exception", "rollback"],
        "summary": "Rapid response protocol for 500 error escalation following a new release rollout.",
        "steps": [
            "1. Check deployment git tag and change log diff.",
            "2. Verify error spike coincides with deployment rollout timestamp.",
            "3. Trigger automated blue/green rollback to previous stable artifact.",
            "4. Mark release as blocked in CI/CD pipeline.",
        ],
        "recommended_action": "EXECUTE_IMMEDIATE_ROLLBACK",
    },
]


class ToolRegistry:
    def __init__(self):
        self.tool_schemas = self._build_schemas()

    def _build_schemas(self) -> Dict[str, Any]:
        return {
            "get_service_health": {
                "name": "get_service_health",
                "description": "Returns current operational status, p95 latency, error rate, CPU, and risk score for a service.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "service_name": {"type": "string", "description": "Microservice identifier"}
                    },
                    "required": ["service_name"],
                },
            },
            "get_metrics": {
                "name": "get_metrics",
                "description": "Fetches time-series telemetry data points for a specific service and metric.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "service_name": {"type": "string"},
                        "metric_name": {"type": "string", "enum": ["latency_p95", "error_rate", "cpu_percent", "memory_percent", "db_connections", "throughput"]},
                        "time_range_minutes": {"type": "integer", "default": 30},
                    },
                    "required": ["service_name", "metric_name"],
                },
            },
            "get_logs": {
                "name": "get_logs",
                "description": "Retrieves recent structured logs for a service filtered by minimum severity level.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "service_name": {"type": "string"},
                        "severity": {"type": "string", "enum": ["ALL", "INFO", "WARN", "ERROR", "FATAL"], "default": "WARN"},
                        "limit": {"type": "integer", "default": 20},
                    },
                    "required": ["service_name"],
                },
            },
            "get_recent_deployments": {
                "name": "get_recent_deployments",
                "description": "Retrieves recent release versions, timestamps, and commit messages for a service.",
                "parameters": {
                    "type": "object",
                    "properties": {"service_name": {"type": "string"}},
                    "required": ["service_name"],
                },
            },
            "search_runbook": {
                "name": "search_runbook",
                "description": "Executes semantic/keyword search against operational runbooks.",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
            "calculate_blast_radius": {
                "name": "calculate_blast_radius",
                "description": "Analyzes dependency topology to calculate downstream services, impacted users, and estimated revenue impact.",
                "parameters": {
                    "type": "object",
                    "properties": {"service_name": {"type": "string"}},
                    "required": ["service_name"],
                },
            },
            "propose_remediation": {
                "name": "propose_remediation",
                "description": "Synthesizes an approval-gated operational remediation plan.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "incident_id": {"type": "string"},
                        "root_cause": {"type": "string"},
                        "target_service": {"type": "string"},
                    },
                    "required": ["incident_id", "root_cause", "target_service"],
                },
            },
        }

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executes tool safely with execution timing, parameter validation, and audit tracking."""
        start_time = time.time()
        logger.info(f"Tool Execution: {tool_name} with args {arguments}")

        try:
            if tool_name == "get_service_health":
                s_name = arguments.get("service_name")
                sim_state = simulator.step()
                svc_data = sim_state["services"].get(s_name)
                if not svc_data:
                    return {"success": False, "error": f"Service '{s_name}' not found"}
                return {"success": True, "data": svc_data}

            elif tool_name == "get_metrics":
                s_name = arguments.get("service_name")
                m_name = arguments.get("metric_name")
                sim_state = simulator.step()
                current_val = sim_state["services"].get(s_name, {}).get(m_name, 0.0)
                # Generate realistic 15-point historical progression
                history = []
                now = datetime.utcnow()
                for i in range(15, 0, -1):
                    history.append({
                        "timestamp": (now - timedelta(minutes=i)).isoformat(),
                        "value": round(current_val * (0.6 + 0.4 * (15 - i) / 15.0), 2),
                    })
                return {"success": True, "service": s_name, "metric": m_name, "history": history}

            elif tool_name == "get_logs":
                s_name = arguments.get("service_name")
                min_sev = arguments.get("severity", "WARN")
                filtered = [
                    l for l in simulator.recent_logs
                    if (s_name == "all" or l.get("service_name") == s_name)
                    and (min_sev == "ALL" or l.get("level") in [min_sev, "ERROR", "FATAL"])
                ]
                return {"success": True, "logs": filtered[-15:]}

            elif tool_name == "get_recent_deployments":
                s_name = arguments.get("service_name")
                return {
                    "success": True,
                    "deployments": [
                        {
                            "version": "v2.4.1",
                            "deployed_at": (datetime.utcnow() - timedelta(minutes=24)).isoformat(),
                            "commit": "8f4d92a",
                            "author": "dev-team-lead@aegisops.io",
                            "change_summary": "Optimized connection pool parameters and checkout payload validator",
                        },
                        {
                            "version": "v2.4.0",
                            "deployed_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                            "commit": "3c91e7b",
                            "author": "release-bot@aegisops.io",
                            "change_summary": "Stable milestone build",
                        },
                    ],
                }

            elif tool_name == "search_runbook":
                query = arguments.get("query", "").lower()
                results = []
                for rb in RUNBOOKS_DATABASE:
                    score = 0.0
                    for kw in rb["keywords"]:
                        if kw in query:
                            score += 0.25
                    if score > 0:
                        results.append({**rb, "relevance_score": min(0.98, score + 0.35)})
                if not results:
                    results = [{**RUNBOOKS_DATABASE[0], "relevance_score": 0.65}]
                results.sort(key=lambda x: x["relevance_score"], reverse=True)
                return {"success": True, "results": results[:2]}

            elif tool_name == "calculate_blast_radius":
                s_name = arguments.get("service_name")
                # Downstream dependency traversal
                downstream = {
                    "payment-service": ["api-gateway"],
                    "database-cluster": ["payment-service", "user-service", "auth-service", "api-gateway"],
                    "auth-service": ["api-gateway"],
                    "cache-redis": ["auth-service", "recommendation-service", "user-service"],
                }.get(s_name, ["api-gateway"])

                sim_state = simulator.step()
                throughput = sim_state["services"].get(s_name, {}).get("throughput", 150.0)
                affected_users = int(throughput * 60 * 1.8)
                revenue_loss_per_min = round(affected_users * 0.18, 2)

                return {
                    "success": True,
                    "target_service": s_name,
                    "downstream_services": downstream,
                    "estimated_affected_users": affected_users,
                    "estimated_revenue_loss_per_minute_usd": revenue_loss_per_min,
                    "risk_tier": "CRITICAL" if revenue_loss_per_min > 2000 else "HIGH",
                }

            elif tool_name == "propose_remediation":
                inc_id = arguments.get("incident_id")
                target = arguments.get("target_service", "payment-service")
                rc = arguments.get("root_cause", "")

                action = {
                    "id": f"REM-{int(time.time())}",
                    "incident_id": inc_id,
                    "action_type": "RECYCLE_CONNECTION_POOL_AND_SCALE",
                    "description": f"Recycle active pool connections on '{target}' and increase pool capacity by 40%",
                    "risk_level": "MEDIUM",
                    "target_service": target,
                    "parameters": {"max_connections": 140, "graceful_timeout_seconds": 20},
                    "approval_required": True,
                }
                return {"success": True, "remediation": action}

            else:
                return {"success": False, "error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            dur_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Tool {tool_name} completed in {dur_ms}ms")


tool_registry = ToolRegistry()
