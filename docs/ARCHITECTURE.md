# AegisOps AI — System Architecture & Design

## 1. System Overview

AegisOps AI is an autonomous AI operations platform designed for site reliability engineers (SREs), DevOps teams, and platform operators. It bridges real-time telemetry observation, statistical/machine-learning anomaly detection, multi-agent AI root cause investigation, automated blast radius analysis, and human-in-the-loop remediation.

```mermaid
flowchart TD
    subgraph Client["Presentation Layer (Next.js 14 App Router)"]
        UI_Dash["Command Center Dashboard"]
        UI_Topo["Live Topology & Traffic Map"]
        UI_Inc["Incident Lifecycle & RCA"]
        UI_Time["Time-Travel Debugger"]
        UI_Copilot["AI Copilot & NL2Metrics"]
        UI_RAG["Knowledge Base & Runbooks"]
        UI_Eval["Confidence Calibration & Evals"]
        UI_Sec["Security & Audit Log"]
    end

    subgraph API_Gateway["FastAPI Application Server"]
        Auth_MW["Auth & RBAC Middleware"]
        Sec_MW["Prompt Injection & Security Guard"]
        Router["REST & Event Stream Routers"]
    end

    subgraph Engine_Layer["Core Processing Engines"]
        Sim["Telemetry & Incident Simulator"]
        MLEngine["ML Anomaly & Risk Predictor<br/>(Isolation Forest, EWMA, Z-Score)"]
        DNAEngine["Incident DNA & Cosine Matcher"]
        BlastEngine["Blast Radius & Impact Model"]
    end

    subgraph AI_Orchestration["AI Multi-Agent System"]
        LLM["LLM Service (DeepSeek API + Deterministic Mock)"]
        Planner["Planner Agent"]
        Investigator["Investigator Agent"]
        RCA["Root Cause Agent"]
        KnowledgeAgent["Knowledge Agent"]
        RiskAgent["Risk Agent"]
        RemediationAgent["Remediation Agent"]
        ReportAgent["Report & Postmortem Agent"]
        ToolRunner["Secure Tool Execution Layer"]
    end

    subgraph Data_Layer["Storage & Vector Store"]
        RDBMS[("Relational DB (PostgreSQL / SQLite)")]
        VecStore[("Vector Store (Runbooks & Postmortems)")]
        CacheStore[("Redis / In-Memory Cache")]
    end

    Client <-->|REST / SSE Streaming| API_Gateway
    API_Gateway --> Router
    Router --> Engine_Layer
    Router --> AI_Orchestration
    AI_Orchestration <--> ToolRunner
    ToolRunner <--> Engine_Layer
    ToolRunner <--> Data_Layer
    Engine_Layer <--> Data_Layer
    AI_Orchestration <--> LLM
    KnowledgeAgent <--> VecStore
```

---

## 2. Microservice Topology & Synthetic Infrastructure

AegisOps AI monitors a simulated distributed e-commerce / fintech microservices mesh:

```mermaid
graph LR
    User["Clients / Browsers"] --> Gateway["API Gateway"]
    Gateway --> Auth["Auth Service"]
    Gateway --> UserSvc["User Service"]
    Gateway --> Payment["Payment Service"]
    Gateway --> RecSvc["Recommendation Service"]
    
    Auth --> Cache["Distributed Cache (Redis)"]
    Payment --> DBCluster[("Postgres DB Cluster")]
    UserSvc --> DBCluster
    Payment --> MsgQueue["Message Queue (Kafka)"]
    RecSvc --> Cache
```

Each service emits:
- **Metrics**: CPU utilization (%), Memory (MB & %), Request Throughput (req/s), Latency (p50, p95, p99 in ms), Error Rate (%), Database Connection Pool Saturation (%), Queue Depth.
- **Logs**: High-velocity structured JSON logs containing timestamp, service, level (`DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`), trace ID, request path, and message payload.
- **Deployments**: Version release tags, commit hashes, configuration changes, and rollback points.

---

## 3. Machine Learning & Anomaly Detection Pipeline

```mermaid
flowchart LR
    TelemetryIn["Raw Telemetry Stream"] --> FeatEng["Time-Series Feature Extraction<br/>(Sliding Windows, Differencing, Rolling Mean/Std)"]
    FeatEng --> StatModel["Statistical Engine<br/>(Rolling Z-Score + EWMA)"]
    FeatEng --> MLModel["Isolation Forest Model<br/>(Unsupervised Anomaly Scoring)"]
    StatModel --> Fusion["Multi-Signal Fusion Engine"]
    MLModel --> Fusion
    Fusion --> AnomalyEvent["Unified Anomaly Score (0.0 - 1.0)<br/>Severity: Low | Med | High | Critical"]
    AnomalyEvent --> DNA["Incident DNA Vectorizer"]
    AnomalyEvent --> PredEngine["Degradation Predictor (30m Horizon)"]
```

1. **Statistical Baseline**: Computes dynamic bounds using Exponential Weighted Moving Averages (EWMA) and rolling 3-sigma thresholds.
2. **Isolation Forest**: Identifies multidimensional metric anomalies (e.g., normal CPU + normal requests, but anomalous latency and connection ratio).
3. **Anomaly Fusion**: Normalizes metrics into a composite risk score:
   $$\text{Score} = w_{\text{lat}} S_{\text{lat}} + w_{\text{err}} S_{\text{err}} + w_{\text{conn}} S_{\text{conn}} + w_{\text{cpu}} S_{\text{cpu}}$$
4. **Incident DNA**: Extracts an 8-dimensional normalized fingerprint vector based on metric deltas and maps it against known incident clusters via cosine distance.

---

## 4. Multi-Agent AI Orchestration Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Operator as SRE Operator / Trigger
    participant Orchestrator as Multi-Agent Orchestrator
    participant Planner as Planner Agent
    participant Investigator as Investigator Agent
    participant Tools as Tool Execution Layer
    participant Knowledge as Knowledge Agent
    participant RCA as Root Cause Agent
    participant Risk as Risk Agent
    participant Remediation as Remediation Agent

    Operator->>Orchestrator: Trigger Investigation(Incident ID)
    Orchestrator->>Planner: Formulate Investigation Plan
    Planner-->>Orchestrator: Ordered Investigation Steps
    
    Orchestrator->>Investigator: Execute Telemetry & Log Audit
    Investigator->>Tools: get_metrics(), get_logs(), get_deployments()
    Tools-->>Investigator: Correlated Data Evidence
    Investigator-->>Orchestrator: Telemetry & Log Findings

    Orchestrator->>Knowledge: Search Similar Runbooks & Incidents
    Knowledge->>Tools: search_runbook(query)
    Tools-->>Knowledge: Ranked Runbook & Postmortem Chunks
    Knowledge-->>Orchestrator: Runbook Guidance & Citations

    Orchestrator->>RCA: Correlate Findings & Identify Cause
    RCA-->>Orchestrator: Root Cause Hypothesis + Confidence + Alternatives

    Orchestrator->>Risk: Assess Blast Radius & Financial Exposure
    Risk-->>Orchestrator: Blast Radius Map + Risk Tier

    Orchestrator->>Remediation: Propose Action Plan
    Remediation-->>Orchestrator: Remediation Plan + Safety Level (Manual Approval Required)
    Orchestrator-->>Operator: Complete Incident Package (Awaiting Approval)
```

---

## 5. Security Architecture & AI Guardrails

```mermaid
flowchart TD
    Req["Incoming API / Agent Prompt"] --> InjFilter["Prompt Injection & Jailbreak Analyzer"]
    InjFilter -->|Suspicious Payload| SecBlock["Block & Log Security Audit Event"]
    InjFilter -->|Passed| RBAC["Role-Based Access Control (Admin / Operator / Viewer)"]
    RBAC -->|Forbidden Action| AuthDeny["403 Forbidden Response"]
    RBAC -->|Authorized| ToolSandbox["Validated Tool Call Runner"]
    ToolSandbox --> AllowedTools{"Tool Whitelist Check"}
    AllowedTools -->|Not Permitted| ToolReject["Reject Execution"]
    AllowedTools -->|Safe Tool| AuditLogger["Structured Audit Log Record"]
    AuditLogger --> Exec["Execute Safe Operational Function"]
```

- **Deterministic Fallback**: If DeepSeek API is offline, throttled, or without credentials, an enterprise-grade deterministic rule engine activates seamlessly so 100% of workflows execute reliably.
- **Safety Tiers**:
  - `LOW_RISK`: Automated simulated actions (cache warm-up, scale replicas by 1).
  - `MEDIUM_RISK`: Human confirmation recommended.
  - `HIGH_RISK` / `CRITICAL`: Strictly gated behind cryptographic operator signature / UI approval button.

---

## 6. Standout Innovations

1. **Live Service Topology Map**: Real-time canvas/SVG node rendering with animated traffic particles flowing along edges, dynamically recolored based on latency and error conditions.
2. **Time-Travel Infrastructure Debugger**: Timeline scrubbing mechanism that allows operators to review historical metric snapshots, log streams, and system topology states at any second $T_{-n}$.
3. **Blast Radius & Financial Impact Engine**: Graph traversal identifying downstream service dependencies and computing estimated financial loss ($\$ / \text{min}$) based on active user volume.
4. **AI Confidence Calibration Dashboard**: Tracks reliability curves and Brier score across agent predictions to prevent overconfidence in production recommendations.
5. **Automated Google-SRE Postmortem Generator**: Auto-assembles markdown postmortems adhering to Google SRE guidelines upon incident resolution.
6. **Incident DNA Fingerprinting**: Vectorized anomaly signature matching linking active outages to historical resolution runbooks with cosine similarity percentages.
7. **NL2Metrics Query Engine**: Natural language input translated into dynamic time-series charts directly inside the AI Copilot.
