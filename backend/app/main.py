import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger

# ── API routers
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.telemetry import router as telemetry_router
from app.api.incidents import router as incidents_router
from app.api.services_router import router as services_router
from app.api.ai import router as ai_router
from app.api.simulation import router as simulation_router
from app.api.knowledge import router as knowledge_router
from app.api.security import router as security_router
from app.api.evaluation import router as evaluation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all DB tables exist on startup
    from app.db.session import sync_engine, Base
    from app.models import entities  # noqa: registers all SQLAlchemy models
    Base.metadata.create_all(bind=sync_engine)
    logger.info("AegisOps AI backend started — all DB tables verified.")

    if settings.ENABLE_AUTO_SIMULATION:
        from app.services.simulator import simulator
        asyncio.create_task(simulator.run())
        logger.info("Telemetry simulator task started.")

    yield

    logger.info("AegisOps AI backend shutting down.")


app = FastAPI(
    title="AegisOps AI",
    description="AI-powered autonomous SRE platform with anomaly detection, incident investigation, and human-approved remediation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(telemetry_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(services_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")
app.include_router(security_router, prefix="/api")
app.include_router(evaluation_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    return {"service": "AegisOps AI", "version": "1.0.0", "status": "operational", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True, log_level="info")

