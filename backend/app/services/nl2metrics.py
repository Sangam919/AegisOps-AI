from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import random
from app.services.simulator import simulator
from app.core.logging import logger


class NL2MetricsEngine:
    def parse_and_execute_query(self, query: str, service_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Translates natural language questions into time-series chart data and insights.
        """
        q = query.lower()
        now = datetime.utcnow()
        sim_state = simulator.step()
        services = sim_state["services"]

        # Default parameters
        chart_type = "line"
        time_range_minutes = 30
        target_services = list(services.keys())
        queried_metrics = ["latency_p95"]

        if service_filter and service_filter in services:
            target_services = [service_filter]
        elif "payment" in q:
            target_services = ["payment-service"]
        elif "auth" in q:
            target_services = ["auth-service"]
        elif "gateway" in q:
            target_services = ["api-gateway"]
        elif "database" in q or "db" in q:
            target_services = ["database-cluster"]
        elif "cache" in q or "redis" in q:
            target_services = ["cache-redis"]

        # Metric type detection
        if "cpu" in q:
            queried_metrics = ["cpu_percent"]
            interpreted = "Evaluating CPU Utilization Trends across selected services"
            unit = "%"
        elif "error" in q or "500" in q or "fail" in q:
            queried_metrics = ["error_rate"]
            interpreted = "Analyzing HTTP 5xx Error Rate percentages and SLA violations"
            unit = "%"
        elif "connection" in q or "pool" in q:
            queried_metrics = ["db_connections"]
            interpreted = "Monitoring Database Connection Pool Saturation counts"
            unit = "connections"
        elif "memory" in q or "ram" in q or "heap" in q:
            queried_metrics = ["memory_percent"]
            interpreted = "Tracking JVM and Process Memory Allocation"
            unit = "%"
        elif "throughput" in q or "rps" in q or "traffic" in q:
            queried_metrics = ["throughput"]
            interpreted = "Inspecting Request Throughput (Requests per Second)"
            unit = "req/s"
        else:
            queried_metrics = ["latency_p95"]
            interpreted = "Measuring 95th Percentile API Response Latency (p95)"
            unit = "ms"

        # Generate realistic multi-point chart series
        chart_data = []
        for i in range(12, 0, -1):
            t_point = (now - timedelta(minutes=i * 2.5)).strftime("%H:%M")
            row: Dict[str, Any] = {"time": t_point}
            for s in target_services[:4]:
                base = services[s].get(queried_metrics[0], 40.0)
                # Add historical variance
                val = max(0.0, base * (0.8 + 0.35 * random.random()))
                if "error" in queried_metrics[0]:
                    row[s] = round(val * 100, 2)  # Convert error rate to %
                else:
                    row[s] = round(val, 1)
            chart_data.append(row)

        # AI synthesis insight
        top_svc = target_services[0]
        curr_val = services[top_svc].get(queried_metrics[0], 0)
        if "error" in queried_metrics[0]:
            curr_val_str = f"{curr_val * 100:.2f}%"
        else:
            curr_val_str = f"{curr_val} {unit}"

        insights = (
            f"Query result for '{query}': Telemetry indicates {top_svc} is currently registering "
            f"{curr_val_str} on {queried_metrics[0]}. "
            f"Historical curve demonstrates nominal operational adherence across the sampled 30-minute window."
        )

        return {
            "query": query,
            "interpreted_intent": interpreted,
            "chart_type": chart_type,
            "services": target_services[:4],
            "metrics_queried": queried_metrics,
            "time_range_minutes": time_range_minutes,
            "chart_data": chart_data,
            "ai_insights": insights,
            "sql_or_metric_expression": f"SELECT avg({queried_metrics[0]}) FROM telemetry WHERE service IN ({', '.join(target_services[:4])}) GROUP BY time(2m)",
        }


nl2metrics_engine = NL2MetricsEngine()
