from datetime import datetime
from typing import Optional, List, Dict, Any
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"


class IncidentSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    ROOT_CAUSE_IDENTIFIED = "ROOT_CAUSE_IDENTIFIED"
    REMEDIATION_PROPOSED = "REMEDIATION_PROPOSED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    REMEDIATING = "REMEDIATING"
    VERIFIED = "VERIFIED"
    RESOLVED = "RESOLVED"


class RemediationRisk(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RemediationStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    tier = Column(String(50), default="tier-1", nullable=False)
    dependencies = Column(JSON, default=list)  # List of service names
    health = Column(String(50), default="healthy", nullable=False)  # healthy, degraded, critical
    latency_p95 = Column(Float, default=45.0)
    error_rate = Column(Float, default=0.01)
    throughput = Column(Float, default=120.0)
    cpu_percent = Column(Float, default=25.0)
    memory_percent = Column(Float, default=35.0)
    db_connections = Column(Integer, default=15)
    queue_depth = Column(Integer, default=0)
    risk_score = Column(Float, default=0.05)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MetricRecord(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    service_name = Column(String(100), index=True, nullable=False)
    metric_name = Column(String(100), index=True, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), default="")
    labels = Column(JSON, default=dict)


class LogRecord(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    service_name = Column(String(100), index=True, nullable=False)
    level = Column(String(20), index=True, nullable=False)  # DEBUG, INFO, WARN, ERROR, FATAL
    trace_id = Column(String(64), index=True, nullable=True)
    path = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)  # e.g. INC-2026-0042
    title = Column(String(255), nullable=False)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.DETECTED, nullable=False)
    affected_service = Column(String(100), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    symptoms = Column(Text, nullable=True)
    suspected_root_cause = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    evidence_json = Column(JSON, default=list)
    alternatives_json = Column(JSON, default=list)
    blast_radius_json = Column(JSON, default=dict)
    recommended_remediation = Column(Text, nullable=True)
    remediation_status = Column(Enum(RemediationStatus), default=RemediationStatus.PROPOSED)

    agent_runs = relationship("AgentRun", back_populates="incident", cascade="all, delete-orphan")
    remediations = relationship("RemediationAction", back_populates="incident", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    service_name = Column(String(100), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    metric_name = Column(String(100), nullable=False)
    threshold = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="active")  # active, acknowledged, resolved


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String(100), index=True, nullable=False)
    version = Column(String(50), nullable=False)
    git_commit = Column(String(40), nullable=False)
    author = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    status = Column(String(50), default="successful")  # successful, failed, rolled_back
    deployed_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AnomalyEvent(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    service_name = Column(String(100), index=True, nullable=False)
    metric_name = Column(String(100), index=True, nullable=False)
    expected_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)  # 0.0 to 1.0
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    detection_strategy = Column(String(50), default="IsolationForest")  # Z-score, IsolationForest, EWMA
    details_json = Column(JSON, default=dict)


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    run_type = Column(String(50), default="incident_investigation")
    status = Column(String(50), default="running")  # running, completed, failed
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    total_duration_ms = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    summary = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="agent_runs")
    steps = relationship("AgentStep", back_populates="agent_run", cascade="all, delete-orphan")


class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(Integer, primary_key=True, index=True)
    agent_run_id = Column(String(64), ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    agent_name = Column(String(50), nullable=False)  # Planner, Investigator, RCA, etc.
    status = Column(String(50), default="completed")  # running, completed, failed
    action_summary = Column(Text, nullable=False)
    tool_called = Column(String(100), nullable=True)
    tool_arguments = Column(JSON, default=dict)
    tool_result = Column(JSON, default=dict)
    evidence_ref = Column(String(255), nullable=True)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    agent_run = relationship("AgentRun", back_populates="steps")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="runbook")  # runbook, postmortem, architecture, guide
    source = Column(String(255), default="manual_upload")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_json = Column(JSON, default=list)  # Stored embedding vector
    metadata_json = Column(JSON, default=dict)

    document = relationship("KnowledgeDocument", back_populates="chunks")


class RemediationAction(Base):
    __tablename__ = "remediation_actions"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    risk_level = Column(Enum(RemediationRisk), default=RemediationRisk.MEDIUM, nullable=False)
    target_service = Column(String(100), nullable=False)
    parameters_json = Column(JSON, default=dict)
    status = Column(Enum(RemediationStatus), default=RemediationStatus.PENDING_APPROVAL, nullable=False)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    before_metrics_json = Column(JSON, default=dict)
    after_metrics_json = Column(JSON, default=dict)

    incident = relationship("Incident", back_populates="remediations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    user_email = Column(String(255), default="system", nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details_json = Column(JSON, default=dict)
    ip_address = Column(String(50), default="127.0.0.1")


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String(100), index=True, nullable=False)
    probability = Column(Float, nullable=False)  # 0.0 to 1.0 (e.g. 0.74 = 74%)
    horizon_minutes = Column(Integer, default=30)
    contributing_signals_json = Column(JSON, default=list)
    risk_tier = Column(String(50), default="MEDIUM")
    predicted_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Postmortem(Base):
    __tablename__ = "postmortems"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="PUBLISHED")
    root_cause_summary = Column(Text, nullable=False)
    impact_summary = Column(Text, nullable=False)
    timeline_json = Column(JSON, default=list)
    what_went_well = Column(JSON, default=list)
    what_went_wrong = Column(JSON, default=list)
    action_items_json = Column(JSON, default=list)
    markdown_content = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
