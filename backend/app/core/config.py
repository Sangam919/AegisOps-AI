from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Core System
    PROJECT_NAME: str = "AegisOps AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            if self.CORS_ORIGINS.strip().startswith("[") and self.CORS_ORIGINS.strip().endswith("]"):
                try:
                    import json
                    return json.loads(self.CORS_ORIGINS)
                except Exception:
                    pass
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Security
    SECRET_KEY: str = "aegisops-super-secure-jwt-secret-key-change-in-production-32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./aegisops.db"

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        elif "+aiosqlite" in url:
            url = url.replace("+aiosqlite", "")
        elif "+asyncpg" in url:
            url = url.replace("+asyncpg", "")
        return url
    
    # Redis / Caching
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_IN_MEMORY_CACHE: bool = True

    # DeepSeek / LLM Engine
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    USE_MOCK_LLM: bool = True
    LLM_TIMEOUT_SECONDS: int = 30
    MAX_AGENT_STEPS: int = 8
    MAX_TOOL_CALLS_PER_RUN: int = 15

    # Telemetry Simulator
    SIMULATION_TICK_SECONDS: int = 3
    SIMULATION_DEFAULT_TRAFFIC: str = "normal"
    ENABLE_AUTO_SIMULATION: bool = True

    # ML Anomaly Detection Engine
    ANOMALY_ZSCORE_THRESHOLD: float = 2.5
    ISOLATION_FOREST_CONTAMINATION: float = 0.05
    ANOMALY_FUSION_SENSITIVITY: float = 0.75
    PREDICTION_WINDOW_MINUTES: int = 30


settings = Settings()
