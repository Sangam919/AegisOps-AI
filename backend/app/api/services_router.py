from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ServiceResponse, TopologyResponse, TopologyNode, TopologyEdge
from app.services.simulator import simulator

router = APIRouter(prefix="/services", tags=["Services & Topology"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_services():
    state = simulator.step()
    return list(state["services"].values())


@router.get("/topology", response_model=TopologyResponse)
async def get_topology():
    state = simulator.step()
    svcs = state["services"]

    nodes: List[TopologyNode] = []
    for s_id, s_data in svcs.items():
        nodes.append(
            TopologyNode(
                id=s_id,
                name=s_id,
                display_name=s_data["display_name"],
                health=s_data["health"],
                tier=s_data["tier"],
                latency_p95=s_data["latency_p95"],
                error_rate=s_data["error_rate"],
                throughput=s_data["throughput"],
                cpu_percent=s_data["cpu_percent"],
                risk_score=s_data["risk_score"],
                is_impacted=s_data["health"] != "healthy",
            )
        )

    # Topology edges with live traffic volume and health status
    edges: List[TopologyEdge] = []
    edge_mappings = [
        ("api-gateway", "auth-service"),
        ("api-gateway", "payment-service"),
        ("api-gateway", "user-service"),
        ("api-gateway", "recommendation-service"),
        ("auth-service", "cache-redis"),
        ("auth-service", "database-cluster"),
        ("payment-service", "database-cluster"),
        ("payment-service", "message-queue"),
        ("user-service", "database-cluster"),
        ("user-service", "cache-redis"),
        ("recommendation-service", "cache-redis"),
    ]

    for src, dst in edge_mappings:
        src_data = svcs.get(src, {})
        dst_data = svcs.get(dst, {})

        traffic = min(src_data.get("throughput", 100), dst_data.get("throughput", 100))
        lat = (src_data.get("latency_p95", 20) + dst_data.get("latency_p95", 20)) / 2.0

        if src_data.get("health") == "critical" or dst_data.get("health") == "critical":
            status = "failed"
        elif src_data.get("health") == "degraded" or dst_data.get("health") == "degraded":
            status = "degraded"
        else:
            status = "normal"

        edges.append(
            TopologyEdge(
                source=src,
                target=dst,
                traffic_volume=round(traffic, 1),
                latency_ms=round(lat, 1),
                status=status,
            )
        )

    return TopologyResponse(
        nodes=nodes,
        edges=edges,
        timestamp=datetime.utcnow(),
        active_incidents=len(state["active_scenarios"]),
    )


@router.get("/{name}", response_model=Dict[str, Any])
async def get_service(name: str):
    state = simulator.step()
    svc = state["services"].get(name)
    if not svc:
        raise HTTPException(status_code=404, detail=f"Service '{name}' not found")
    return svc
