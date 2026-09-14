import time
from fastapi import APIRouter

router = APIRouter()
START_TIME = time.time()


@router.get("/health", summary="Health Check")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "AegisOps AI",
        "uptime_seconds": int(time.time() - START_TIME),
    }

