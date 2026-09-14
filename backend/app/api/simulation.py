from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter
from app.services.simulator import simulator
from app.core.logging import logger

router = APIRouter(prefix="/simulations", tags=["Simulation & Fault Injection"])


class TrafficRequest(BaseModel):
    level: str  # low, normal, high, extreme


class InjectScenarioRequest(BaseModel):
    scenario: str  # db_exhaustion, memory_leak, cpu_spike, latency_spike, traffic_surge, deployment_regression, cache_eviction_storm, cascading_failure
    target_service: Optional[str] = None


@router.get("/status")
async def get_simulation_status():
    state = simulator.step()
    return {
        "traffic_multiplier": simulator.traffic_multiplier,
        "active_scenarios": simulator.active_scenarios,
        "step_counter": simulator.step_counter,
        "recent_logs_count": len(simulator.recent_logs),
    }


@router.post("/traffic")
async def set_traffic(req: TrafficRequest):
    simulator.set_traffic(req.level)
    return {
        "success": True,
        "traffic_level": req.level,
        "multiplier": simulator.traffic_multiplier,
    }


@router.post("/inject")
async def inject_scenario(req: InjectScenarioRequest):
    res = simulator.inject_scenario(req.scenario, req.target_service)
    return {
        "success": True,
        "injected_scenario": res,
        "message": f"Fault scenario '{req.scenario}' injected. Telemetry anomaly will propagate within 1-2 ticks.",
    }


@router.post("/reset")
async def reset_simulation():
    simulator.clear_all_scenarios()
    simulator.set_traffic("normal")
    return {"success": True, "message": "Simulation cleared. All services restored to nominal baselines."}


@router.post("/launch-demo")
async def launch_demo_incident():
    """
    Centerpiece one-click demo trigger:
    Injects a realistic database connection pool saturation failure on payment-service.
    """
    simulator.clear_all_scenarios()
    scenario_info = simulator.inject_scenario("db_exhaustion", "payment-service")
    # Advance simulator to propagate anomaly
    simulator.step()
    simulator.step()

    logger.info("Demo Mode: Injected 'db_exhaustion' scenario on payment-service")

    return {
        "success": True,
        "incident_id": "INC-2026-0042",
        "affected_service": "payment-service",
        "scenario": scenario_info,
        "message": "Demo incident launched! Payment Service is now experiencing connection pool exhaustion. AegisOps ML Anomaly Engine has flagged the incident.",
    }
