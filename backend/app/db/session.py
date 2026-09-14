from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Engine configuration with pooling
connect_args = {}
if "sqlite" in settings.async_database_url:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

# Synchronous engine for Alembic migrations & initial table verification
from sqlalchemy import create_engine as _create_engine
sync_connect_args = {}
if "sqlite" in settings.sync_database_url:
    sync_connect_args = {"check_same_thread": False}

sync_engine = _create_engine(
    settings.sync_database_url,
    echo=False,
    future=True,
    connect_args=sync_connect_args,
)

# Synchronous engine for Alembic migrations
# Removed redundant sync_engine assignment; using custom sync_engine defined above

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
