import json
import time
from typing import Dict, List, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger

# Token pricing for cost estimation (DeepSeek Chat standard rates: ~$0.14 per 1M input, ~$0.28 per 1M output)
COST_PER_INPUT_TOKEN = 0.00000014
COST_PER_OUTPUT_TOKEN = 0.00000028


class LLMService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.model = settings.DEEPSEEK_MODEL
        self.base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        self.use_mock = settings.USE_MOCK_LLM or not bool(self.api_key)
        self.total_tokens_used = 0
        self.total_cost_usd = 0.0
        self.call_count = 0

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1500,
        response_format_json: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes an LLM chat completion with retry logic and fallback.
        Returns: {
            "content": str,
            "parsed_json": Optional[Dict],
            "tokens_prompt": int,
            "tokens_completion": int,
            "total_tokens": int,
            "cost_usd": float,
            "model": str,
            "duration_ms": int,
            "is_mock": bool
        }
        """
        start_time = time.time()
        self.call_count += 1

        # If mock mode is explicitly enabled or API key is absent, use high-fidelity deterministic engine
        if self.use_mock or not self.api_key:
            return self._generate_mock_response(messages, response_format_json, start_time)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if response_format_json:
            payload["response_format"] = {"type": "json_object"}

        # Retry with exponential backoff
        for attempt in range(1, 3):
            try:
                async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        choice = data["choices"][0]
                        content = choice["message"]["content"]
                        usage = data.get("usage", {})
                        p_tokens = usage.get("prompt_tokens", 450)
                        c_tokens = usage.get("completion_tokens", 350)
                        total_tok = usage.get("total_tokens", p_tokens + c_tokens)

                        cost = (p_tokens * COST_PER_INPUT_TOKEN) + (c_tokens * COST_PER_OUTPUT_TOKEN)
                        self.total_tokens_used += total_tok
                        self.total_cost_usd += cost

                        parsed = None
                        if response_format_json:
                            try:
                                parsed = json.loads(content)
                            except Exception as pe:
                                logger.warning(f"Could not parse JSON response from LLM: {pe}")

                        duration_ms = int((time.time() - start_time) * 1000)
                        return {
                            "content": content,
                            "parsed_json": parsed,
                            "tokens_prompt": p_tokens,
                            "tokens_completion": c_tokens,
                            "total_tokens": total_tok,
                            "cost_usd": round(cost, 6),
                            "model": self.model,
                            "duration_ms": duration_ms,
                            "is_mock": False,
                        }
                    else:
                        logger.warning(
                            f"DeepSeek API attempt {attempt} returned status {resp.status_code}: {resp.text}"
                        )
            except Exception as e:
                logger.warning(f"DeepSeek API call attempt {attempt} failed: {e}")

        logger.info("Falling back to deterministic offline LLM mock engine.")
        return self._generate_mock_response(messages, response_format_json, start_time)

    def _generate_mock_response(
        self,
        messages: List[Dict[str, str]],
        response_format_json: bool,
        start_time: float,
    ) -> Dict[str, Any]:
        """Generates realistic responses based on prompt keywords and intent."""
        user_msg = ""
        system_msg = ""
        for m in messages:
            if m.get("role") == "user":
                user_msg += " " + m.get("content", "")
            elif m.get("role") == "system":
                system_msg += " " + m.get("content", "")

        user_lower = user_msg.lower()
        duration_ms = int((time.time() - start_time) * 1000) + 120

        # Synthesize domain-specific responses based on prompt role
        if "planner" in system_msg.lower():
            parsed = {
                "investigation_plan": [
                    {"step": 1, "action": "Fetch telemetry metrics and SLA breach trends for affected service"},
                    {"step": 2, "action": "Audit recent ERROR and FATAL logs for connection timeouts or thread starvation"},
                    {"step": 3, "action": "Query recent deployments for configuration or code regression diffs"},
                    {"step": 4, "action": "Search RAG knowledge base for matching operational runbooks"},
                    {"step": 5, "action": "Correlate signals to isolate primary root cause and compute blast radius"},
                    {"step": 6, "action": "Synthesize risk assessment and formulate safe remediation proposal"},
                ]
            }
            content = json.dumps(parsed, indent=2)

        elif "root cause" in system_msg.lower():
            if "memory" in user_lower or "jvm" in user_lower or "oom" in user_lower:
                parsed = {
                    "root_cause": "JVM Heap Space Exhaustion / Memory Leak in Payload Cache",
                    "confidence": 0.89,
                    "evidence": [
                        "Memory utilization elevated from nominal 42% to 98.4%",
                        "High frequency of GC pauses exceeding 1800ms",
                        "Transaction timeouts correlating with peak memory thresholds",
                    ],
                    "alternatives": [
                        {"cause": "Database lock contention", "probability": 0.08, "reason": "DB connections remained nominal"},
                        {"cause": "External network degradation", "probability": 0.03, "reason": "No upstream packet loss observed"},
                    ],
                }
            elif "bcrypt" in user_lower or "cpu" in user_lower or "auth" in user_lower:
                parsed = {
                    "root_cause": "CPU Thread Starvation from Synchronous BCrypt Hashing",
                    "confidence": 0.94,
                    "evidence": [
                        "CPU utilization pinned at 99.4% on Auth Service instances",
                        "Auth token endpoint latency degraded from 35ms to 920ms",
                        "Thread pool capacity exceeded with 42 rejected authentication tasks",
                    ],
                    "alternatives": [
                        {"cause": "Redis cache down", "probability": 0.04, "reason": "Redis ping latency is 2.8ms healthy"},
                        {"cause": "DDoS flood", "probability": 0.02, "reason": "Request throughput did not escalate beyond 20%"},
                    ],
                }
            elif "deploy" in user_lower or "regression" in user_lower or "nullpointer" in user_lower:
                parsed = {
                    "root_cause": "Regression in Deployment v2.4.1 (NullPointerException in Checkout)",
                    "confidence": 0.96,
                    "evidence": [
                        "Error rate spiked immediately following release v2.4.1 git commit 8f4d92a",
                        "Stack traces reveal NullPointerException at V2Engine.validatePayload:142",
                        "Zero error rate observed on previous v2.4.0 release pods",
                    ],
                    "alternatives": [
                        {"cause": "Database connection drop", "probability": 0.02, "reason": "Database health is normal"},
                        {"cause": "Upstream timeout", "probability": 0.02, "reason": "Internal 500 status returned by service"},
                    ],
                }
            else:
                parsed = {
                    "root_cause": "Database Connection Pool Exhaustion (HikariCP Saturation)",
                    "confidence": 0.92,
                    "evidence": [
                        "Connection pool utilization reached 98% (active=98, max=100)",
                        "Payment Service p95 latency increased from 85ms to 950ms",
                        "Log timestamps corroborate ConnectionPoolExhaustedException timeouts",
                        "Similar historical incident INC-HIST-0014 resolved by connection tuning",
                    ],
                    "alternatives": [
                        {"cause": "Network packet congestion", "probability": 0.05, "reason": "No TCP retransmits observed on AWS VPC"},
                        {"cause": "Payment gateway partner downtime", "probability": 0.03, "reason": "External 3rd-party webhook endpoints respond healthy"},
                    ],
                }
            content = json.dumps(parsed, indent=2)

        elif "risk" in system_msg.lower():
            parsed = {
                "risk_level": "HIGH",
                "risk_score": 0.82,
                "blast_radius": {
                    "direct_impact": ["payment-service", "api-gateway"],
                    "transitive_impact": ["user-service"],
                    "estimated_affected_users": 14200,
                    "estimated_revenue_loss_per_minute_usd": 2450.0,
                },
                "rollback_complexity": "LOW",
                "recommended_approval_tier": "OPERATOR_APPROVAL_REQUIRED",
            }
            content = json.dumps(parsed, indent=2)

        elif "remediation" in system_msg.lower():
            parsed = {
                "action_type": "RESTART_CONNECTION_POOL_AND_SCALE",
                "target_service": "payment-service",
                "description": "Recycle idle connection pool instances, increase pool max limit to 140, and spawn +2 service replicas",
                "risk_level": "MEDIUM",
                "parameters": {
                    "pool_name": "PaymentHikariCP",
                    "new_max_connections": 140,
                    "scale_replicas": 2,
                    "graceful_drain_seconds": 15,
                },
                "expected_impact": "Sub-second connection recycling with zero customer session loss. Telemetry expected to return to SLA baseline within 45 seconds.",
                "verification_criteria": "Latency p95 < 120ms and error rate < 0.01 within 60 seconds",
            }
            content = json.dumps(parsed, indent=2)

        elif "postmortem" in system_msg.lower():
            parsed = {
                "title": "Google SRE Postmortem: Database Connection Pool Exhaustion Outage",
                "root_cause_summary": "High query latency caused unclosed transactions to exhaust the HikariCP connection pool on payment-service, resulting in cascaded 504 timeouts.",
                "impact_summary": "14,200 active checkout sessions delayed. Peak error rate reached 28.4% for 14 minutes. Total financial exposure estimated at $34,300.",
                "timeline": [
                    {"time": "T-15m", "event": "Batch reconciliation cron triggered simultaneous DB queries"},
                    {"time": "T-10m", "event": "Connection pool hit 98% capacity; latency breached 500ms threshold"},
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
                    "Batch reconciliation query was not configured with statement timeout",
                    "HikariCP pool size was hardcoded to 100 rather than dynamically auto-scaled",
                ],
                "action_items": [
                    {"action": "Add 3000ms query timeout to all reconciliation repository queries", "owner": "DB-Infra", "priority": "P0"},
                    {"action": "Configure dynamic connection pooling with circuit breakers", "owner": "Payment-Team", "priority": "P1"},
                    {"action": "Add synthetic end-to-end checkout probe to Prometheus alerting", "owner": "SRE-Ops", "priority": "P1"},
                ],
            }
            content = json.dumps(parsed, indent=2)

        else:
            content = (
                "AegisOps AI Copilot: Telemetry monitoring is active across all 8 microservices. "
                "Current system health is nominal with 99.4% SLA adherence. "
                "Database connection pools and CPU utilization are within standard 3-sigma boundaries."
            )
            parsed = {"response": content}

        p_tokens = 320
        c_tokens = 240
        total_tok = p_tokens + c_tokens
        cost = (p_tokens * COST_PER_INPUT_TOKEN) + (c_tokens * COST_PER_OUTPUT_TOKEN)

        self.total_tokens_used += total_tok
        self.total_cost_usd += cost

        return {
            "content": content,
            "parsed_json": parsed if response_format_json else None,
            "tokens_prompt": p_tokens,
            "tokens_completion": c_tokens,
            "total_tokens": total_tok,
            "cost_usd": round(cost, 6),
            "model": f"{self.model} (offline-mock-engine)",
            "duration_ms": duration_ms,
            "is_mock": True,
        }

    def get_usage_metrics(self) -> Dict[str, Any]:
        return {
            "total_calls": self.call_count,
            "total_tokens_used": self.total_tokens_used,
            "total_cost_usd": round(self.total_cost_usd, 5),
            "current_model": self.model,
            "is_mock_mode": self.use_mock,
        }


llm_service = LLMService()
