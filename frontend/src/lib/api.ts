const getApiBase = () => {
  let base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  base = base.trim().replace(/\/+$/, "");
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return base;
};

const API_BASE = getApiBase();

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`Fetch failed for ${url}:`, err);
    throw err;
  }
}

// Telemetry & Summary
export const api = {
  getSummary: () => fetchApi<any>("/telemetry/summary"),
  getMetrics: (windowMinutes = 15) => fetchApi<any>(`/telemetry/metrics?time_window_minutes=${windowMinutes}`),
  getLogs: (service = "all", level = "ALL", limit = 40) =>
    fetchApi<any[]>(`/telemetry/logs?service_name=${service}&level=${level}&limit=${limit}`),
  getTimeTravel: (minutesAgo = 10) => fetchApi<any>(`/telemetry/time-travel?minutes_ago=${minutesAgo}`),
  getPredictions: () => fetchApi<any[]>("/telemetry/predictions"),

  // Services & Topology
  getServices: () => fetchApi<any[]>("/services"),
  getService: (name: string) => fetchApi<any>(`/services/${name}`),
  getTopology: () => fetchApi<any>("/services/topology"),

  // Incidents
  getIncidents: () => fetchApi<any[]>("/incidents"),
  getIncident: (id: string) => fetchApi<any>(`/incidents/${id}`),
  investigateIncident: (id: string) => fetchApi<any>(`/incidents/${id}/investigate`, { method: "POST" }),
  approveRemediation: (incidentId: string, actionId: string, approved: boolean, notes = "") =>
    fetchApi<any>(`/incidents/${incidentId}/remediation/approve`, {
      method: "POST",
      body: JSON.stringify({ action_id: actionId, approved, notes }),
    }),
  getPostmortem: (id: string) => fetchApi<any>(`/incidents/${id}/postmortem`),

  // Simulation & Demo Controls
  getSimStatus: () => fetchApi<any>("/simulations/status"),
  setTraffic: (level: "low" | "normal" | "high" | "extreme") =>
    fetchApi<any>("/simulations/traffic", { method: "POST", body: JSON.stringify({ level }) }),
  injectScenario: (scenario: string, targetService?: string) =>
    fetchApi<any>("/simulations/inject", { method: "POST", body: JSON.stringify({ scenario, target_service: targetService }) }),
  resetSimulation: () => fetchApi<any>("/simulations/reset", { method: "POST" }),
  launchDemo: () => fetchApi<any>("/simulations/launch-demo", { method: "POST" }),

  // AI Copilot & Evals
  chatCopilot: (message: string, history: any[] = [], serviceContext?: string) =>
    fetchApi<any>("/ai/copilot/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_history: history, service_context: serviceContext }),
    }),
  nl2metrics: (query: string, serviceFilter?: string) =>
    fetchApi<any>("/ai/copilot/nl2metrics", {
      method: "POST",
      body: JSON.stringify({ query, service_filter: serviceFilter }),
    }),
  getAiUsage: () => fetchApi<any>("/ai/usage"),
  getAiCalibration: () => fetchApi<any>("/ai/calibration"),

  // Knowledge Base (RAG)
  getKnowledge: () => fetchApi<any[]>("/knowledge"),
  uploadKnowledge: (title: string, content: string, category = "runbook", source = "manual_upload") =>
    fetchApi<any>("/knowledge/upload", {
      method: "POST",
      body: JSON.stringify({ title, content, category, source }),
    }),
  searchKnowledge: (query: string) => fetchApi<any[]>(`/knowledge/search?query=${encodeURIComponent(query)}`, { method: "POST" }),

  // Security & Audit
  getSecurityEvents: () => fetchApi<any>("/security/events"),
  getAuditLogs: () => fetchApi<any[]>("/security/audit-logs"),

  // Evaluation
  getBenchmarks: () => fetchApi<any>("/evaluation/benchmarks"),
  runEvaluation: () => fetchApi<any>("/evaluation/run", { method: "POST" }),
};
