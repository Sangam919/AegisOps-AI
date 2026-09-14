# AegisOps AI — Implementation Plan
## Autonomous AI Operations & Reliability Platform

### Executive Summary
AegisOps AI is a full-stack, enterprise-grade autonomous AIOps platform that unifies real-time telemetry simulation, machine learning anomaly detection, predictive risk modeling, multi-agent AI incident investigation (DeepSeek-powered with fallback), RAG knowledge retrieval, human-in-the-loop remediation, and interactive topology/time-travel observability.

---

## Architecture Overview

```
Frontend (Next.js 14 App Router, TypeScript, Tailwind, Framer Motion, Lucide, Recharts)
  │
  ▼
Backend (FastAPI, Async SQLAlchemy, SQLite/PostgreSQL, Background Tasks, Pydantic v2)
  ├── Telemetry Simulator (Multi-service normal/failure modes, traffic variation)
  ├── ML Engine (Z-Score, Rolling Window, Isolation Forest, Anomaly Scoring, Risk Predictor)
  ├── AI Orchestrator (DeepSeek API + Deterministic Fallback Mode, Token & Cost Tracking)
  │     ├── Planner Agent
  │     ├── Investigator Agent
  │     ├── Root Cause Agent
  │     ├── Knowledge Agent
  │     ├── Risk Agent
  │     ├── Remediation Agent
  │     └── Report Agent
  ├── Tool Execution Layer (Service health, logs, metrics, deployments, runbooks, remediation)
  ├── RAG Knowledge Base (Vector similarity search, runbooks, postmortems, ingestion pipeline)
  ├── Security & RBAC Guardrails (Prompt injection defense, JWT auth, tool permissions, audit logging)
  └── Standout Capabilities:
        ├── 🗺️ Live Service Topology & Traffic Particle Visualizer
        ├── ⏪ Time-Travel Infrastructure Debugger
        ├── 💥 Automated Blast Radius & Financial Impact Engine
        ├── 📊 AI Confidence Calibration & Brier Score Tracking
        ├── 📝 Automated Google-SRE Style Postmortem Generator
        ├── 🧬 Incident DNA Fingerprinting & Cosine Similarity Matcher
        └── 🗣️ NL2Metrics Infrastructure Natural Language Query
```

---

## Detailed Phased Execution

### Phase 1: Repository Foundation & Core Architecture
- Root structure (`backend/`, `frontend/`, `docs/`, config files, `.env.example`, `.gitignore`).
- Python virtual environment with 3.10 and dependency baseline.
- Next.js 14 App Router frontend initialization with Tailwind CSS and icons.

### Phase 2: Backend Architecture & Database Engine
- FastAPI application entry point with CORS, structured logging, request ID tracking, error handling.
- SQLAlchemy async database layer supporting SQLite (portable zero-config local) with seamless PostgreSQL switch.
- Relational models: `users`, `services`, `metrics`, `logs`, `incidents`, `alerts`, `deployments`, `anomalies`, `agent_runs`, `agent_steps`, `tool_calls`, `knowledge_documents`, `knowledge_chunks`, `remediation_actions`, `audit_logs`, `predictions`, `postmortems`.
- Database initialization and deterministic seed fixtures.

### Phase 3: Realistic Telemetry & Distributed Simulator
- High-fidelity time-series telemetry generator for 8 microservices:
  1. API Gateway
  2. Auth Service
  3. Payment Service
  4. User Service
  5. Recommendation Service
  6. Database Cluster
  7. Distributed Cache (Redis)
  8. Message Queue (Kafka/RabbitMQ)
- Generates CPU, Memory, Latency (p50/p95/p99), Error Rate, RPS, DB Connections, Queue Depth.
- Correlated structured log stream with log levels (`INFO`, `WARN`, `ERROR`, `FATAL`).
- 8 failure scenario injection modes:
  - Database Connection Pool Saturation
  - Memory Leak (Payment Service)
  - CPU Spike / Runaway Thread (Auth Service)
  - Upstream Gateway Latency Spike
  - Traffic Surge (5x Black Friday peak)
  - Faulty Deployment Code Regression
  - Cache Eviction Storm
  - Cascading Microservice Failure
- Background ticker running realistic simulation loops with manual one-click controls.

### Phase 4: Machine Learning Engine & Incident DNA
- Statistical Anomaly Detection: rolling z-score, dynamic EWMA baselining.
- ML Anomaly Detection: `scikit-learn` Isolation Forest trained over rolling telemetry.
- Multi-signal Anomaly Fusion: Normalizes anomaly scores across latency, errors, CPU, and DB connections into a [0.0 - 1.0] unified severity indicator.
- Incident Predictive Risk Modeling: 30-minute degradation probability calculator using trend slopes, resource headroom, and warning signals.
- ⭐ **Incident DNA Fingerprinting**: extracts normalized feature vector signatures for incidents and runs cosine similarity against historical incident database.

### Phase 5: DeepSeek LLM Service & AI Guardrails
- `LLMService` supporting DeepSeek API (`DEEPSEEK_API_KEY`, configurable `DEEPSEEK_MODEL`).
- Resilient retry logic, timeout controls, structured Pydantic response extraction.
- Deterministic offline mock engine allowing 100% full-feature testing without spending API credits.
- Token consumption tracker & estimated dollar cost analytics.
- Prompt injection & jailbreak detection middleware.

### Phase 6: Multi-Agent Autonomous Orchestration
- Formal multi-agent pipeline with structured inputs/outputs:
  - **Planner Agent**: Decomposes symptom into ordered investigative plan.
  - **Investigator Agent**: Gathers metrics, filters logs, correlates deployment timestamps.
  - **Root Cause Agent**: Identifies primary fault with confidence score and alternative hypotheses.
  - **Knowledge Agent**: Executes semantic search against runbooks and past postmortems.
  - **Risk Agent**: Computes blast radius, customer impact, financial risk, and rollback complexity.
  - **Remediation Agent**: Formulates step-by-step verified action plan with safety tier.
  - **Report Agent**: Compiles executive incident summary and postmortem.
- Strict execution limit guards (max steps, max tool calls) to prevent cost runaway.
- Real-time step telemetry persistence for the Agent Trace UI.

### Phase 7: Tool Calling Framework
- 12 verified safe tools with JSON Schema validation and audit logging:
  - `get_service_health(service_name)`
  - `get_metrics(service_name, metric, time_range)`
  - `get_logs(service_name, severity, limit)`
  - `get_recent_deployments(service_name)`
  - `get_database_health()`
  - `search_runbook(query)`
  - `calculate_blast_radius(service_name)`
  - `calculate_risk(incident_id)`
  - `propose_remediation(incident_id)`
  - `execute_remediation(action_id)`
  - `verify_remediation(action_id)`
  - `query_nl2metrics(natural_language_prompt)`
- Strict execution isolation: NO arbitrary shell execution.

### Phase 8: RAG Knowledge Base & Auto-Postmortem
- Local vector storage with cosine similarity embeddings.
- Ingested operational runbooks (DB connection leak, OOM kill, Redis thrash, DNS timeout, Bad deploy).
- ⭐ **Automated Google-SRE Postmortem Generator**: auto-drafts postmortems from telemetry + agent trace upon incident resolution.
- Source attribution links for all RAG citations.

### Phase 9: Security, Auth & RBAC
- JWT token authentication with bcrypt password hashing.
- Role-based permissions: `ADMIN`, `OPERATOR`, `VIEWER`.
- Enforced route guards on remediation approval and simulation injection.
- Security event audit log dashboard.

### Phase 10: Frontend Command Center & Standout Visualizations
- Dark-first cybernetic design system with Tailwind CSS and Framer Motion.
- Top metrics bar (Health, Risk Score, Active Incidents, Detected Anomalies, Prediction Horizon).
- ⭐ **Live Service Topology Map**: Animated SVG/Canvas nodes, directional traffic particle flow, cascading failure pulsing.
- ⭐ **Time-Travel Debugger**: Scrubbable timeline with replay capability across metrics and logs.
- ⭐ **Blast Radius Visualizer**: Downstream impact zone, estimated affected users and dollar loss per minute.
- ⭐ **AI Confidence Calibration**: Reliability diagrams, Brier score, calibration error visualization.
- ⭐ **NL2Metrics AI Query Bar**: Plain English queries translated to live telemetry charts.
- Full pages:
  - `/dashboard` — Main command center
  - `/incidents` & `/incidents/[id]` — Lifecycle, RCA, Evidence, Agent Trace, Remediation Approval
  - `/services` & `/services/[id]` — Deep service inspection & metrics
  - `/topology` — Interactive distributed system topology map
  - `/time-travel` — Historical timeline scrubber
  - `/ai-copilot` — Chat with tools and NL2Metrics
  - `/knowledge` — Runbook ingestion & vector search
  - `/security` — Audit logs, prompt injection monitor, RBAC
  - `/evaluation` — Model evaluation, RCA accuracy, calibration curves
  - `/simulations` — Failure injection & scenario launcher

### Phase 11: End-to-End Verification, Docker & Documentation
- Comprehensive Pytest test suite covering ML, agents, tools, simulator, security, and API endpoints.
- Single-command `docker-compose.yml` configuration.
- Comprehensive technical documentation, resume bullets, and 40+ interview Q&A guide.
