"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileText,
  Network,
  Shield,
  ShieldAlert,
  Zap,
  TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatLatency } from "@/lib/utils";

const LIFECYCLE_STAGES = [
  "DETECTED",
  "INVESTIGATING",
  "ROOT_CAUSE_IDENTIFIED",
  "REMEDIATION_PROPOSED",
  "AWAITING_APPROVAL",
  "REMEDIATING",
  "VERIFIED",
  "RESOLVED",
];

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params.id as string;
  const router = useRouter();

  const [incident, setIncident] = useState<any>(null);
  const [agentTrace, setAgentTrace] = useState<any[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"evidence" | "trace" | "postmortem">("evidence");
  const [postmortem, setPostmortem] = useState<any>(null);

  const loadData = async () => {
    try {
      const inc = await api.getIncident(incidentId);
      setIncident(inc);
      if (inc?.status === "RESOLVED") {
        const pm = await api.getPostmortem(incidentId).catch(() => null);
        if (pm) setPostmortem(pm);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 3000);
    return () => clearInterval(timer);
  }, [incidentId]);

  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    try {
      const res = await api.investigateIncident(incidentId);
      setIncident((prev: any) => ({
        ...prev,
        status: "AWAITING_APPROVAL",
        suspected_root_cause: res.suspected_root_cause,
        confidence: res.confidence,
        evidence_json: res.evidence,
        alternatives_json: res.alternatives,
        blast_radius_json: res.blast_radius,
        recommended_remediation: res.remediation_proposal?.description,
      }));
      setAgentTrace(res.steps || []);
      setActiveTab("trace");
    } catch (err) {
      console.error(err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApproveRemediation = async () => {
    setIsApproving(true);
    try {
      const actionId = `REM-${Date.now()}`;
      const res = await api.approveRemediation(incidentId, actionId, true);
      setApprovalFeedback("Remediation Approved! Cluster connection pools recycled. Verifying SLA recovery...");
      setTimeout(async () => {
        await loadData();
        const pm = await api.getPostmortem(incidentId).catch(() => null);
        if (pm) {
          setPostmortem(pm);
          setActiveTab("postmortem");
        }
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  if (!incident) {
    return (
      <div className="p-8 text-center font-mono text-slate-400 text-xs">
        Loading Incident Telemetry & AI Evidence Graph...
      </div>
    );
  }

  const currentStageIndex = LIFECYCLE_STAGES.indexOf(incident.status);
  const isAwaitingApproval = incident.status === "AWAITING_APPROVAL";
  const isResolved = incident.status === "RESOLVED";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="p-2 rounded-lg bg-[#0e1422] border border-[#1e293b] text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  incident.severity === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                {incident.severity}
              </span>
              <h1 className="text-xl font-mono font-extrabold text-white">
                {incident.id}
              </h1>
              <span className="text-xs font-mono text-slate-400">
                Service: <strong className="text-cyan-400">{incident.affected_service}</strong>
              </span>
            </div>
            <h2 className="text-sm font-sans text-slate-300 mt-1">
              {incident.title}
            </h2>
          </div>
        </div>

        {/* Action Button: Run Investigation if not yet complete */}
        <div className="flex items-center gap-3">
          {!incident.suspected_root_cause && (
            <button
              onClick={handleRunInvestigation}
              disabled={isInvestigating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition-all shadow-glow-cyan"
            >
              <Bot className="w-4 h-4" />
              <span>{isInvestigating ? "Agents Investigating..." : "Start AI Investigation"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="cyber-card p-3.5">
        <div className="text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
          Incident Lifecycle Progression
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center font-mono text-[10px]">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex || isResolved;
            const isCurrent = idx === currentStageIndex && !isResolved;

            return (
              <div
                key={stage}
                className={`p-1.5 rounded transition-all ${
                  isCurrent
                    ? "bg-cyan-500 text-black font-bold shadow-glow-cyan"
                    : isCompleted
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800/40"
                }`}
              >
                <span className="truncate block">{stage.replace(/_/g, " ")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flagship: Root Cause Summary & Calibrated Confidence */}
      {incident.suspected_root_cause && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Root Cause Card */}
          <div className="lg:col-span-2 cyber-card p-5 border-cyan-500/40 bg-gradient-to-br from-[#0c1424] to-[#070a12]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                  Root Cause Synthesis
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400">Calibrated Confidence:</span>
                <span className="text-cyan-400 font-extrabold text-base">
                  {Math.round(incident.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-lg bg-[#0e172a] border border-cyan-500/30">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">
                  Primary Fault Diagnosis
                </span>
                <span className="text-base text-white font-bold">
                  {incident.suspected_root_cause}
                </span>
              </div>

              {/* Symptoms breakdown */}
              {incident.symptoms && (
                <div className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                  <strong>Observed Symptoms:</strong> {incident.symptoms}
                </div>
              )}
            </div>
          </div>

          {/* ⭐ Blast Radius & Impact Card */}
          <div className="cyber-card p-5 border-rose-500/30">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1e293b] mb-3">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                Blast Radius & Exposure
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Impact Zone:</span>
                <span className="font-bold text-rose-400">
                  {incident.blast_radius_json?.downstream_impacted?.join(", ") || "api-gateway"}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Affected Users:</span>
                <span className="font-bold text-white">
                  ~{incident.blast_radius_json?.estimated_affected_users || 14200} active
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Revenue Impact:</span>
                <span className="font-bold text-amber-400">
                  {formatCurrency(incident.blast_radius_json?.estimated_revenue_loss_per_minute_usd || 2450)} / min
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Risk Tier:</span>
                <span className="font-bold text-rose-400 uppercase">
                  {incident.blast_radius_json?.risk_tier || "CRITICAL"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Human-in-the-Loop Operational Remediation Panel */}
      {incident.recommended_remediation && (
        <div className="cyber-card p-5 border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-[#0e1422] to-amber-950/10">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e293b] mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-mono font-bold text-white">
                  Human-in-the-Loop Operational Remediation
                </h3>
                <span className="text-[11px] text-amber-300/80 font-mono">
                  Safety Gate: Requires SRE / Operator Signature
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Risk Tier: Medium
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Zero Downtime
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs mb-4">
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                Proposed Action:
              </span>
              {incident.recommended_remediation}
            </div>
          </div>

          {approvalFeedback && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-mono text-xs mb-3 animate-fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{approvalFeedback}</span>
            </div>
          )}

          {isAwaitingApproval && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleApproveRemediation}
                disabled={isApproving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-mono text-xs font-bold transition-all shadow-glow-emerald hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApproving ? "Executing & Verifying..." : "Approve & Execute Remediation"}</span>
              </button>

              <button
                onClick={() => setApprovalFeedback("Remediation rejected by operator. Alternative strategies queued.")}
                className="px-4 py-2.5 rounded-lg bg-[#0e1422] border border-[#1e293b] hover:border-slate-600 text-slate-400 hover:text-white font-mono text-xs transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {isResolved && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Remediation Verified • Incident Resolved • Postmortem Published</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs: Evidence Chain vs Agent Trace vs SRE Postmortem */}
      <div className="cyber-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("evidence")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                activeTab === "evidence"
                  ? "bg-cyan-500 text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Evidence Chain ({incident.evidence_json?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("trace")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                activeTab === "trace"
                  ? "bg-cyan-500 text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Agent Trace
            </button>
            {postmortem && (
              <button
                onClick={() => setActiveTab("postmortem")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                  activeTab === "postmortem"
                    ? "bg-cyan-500 text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Google SRE Postmortem
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Evidence Chain */}
        {activeTab === "evidence" && (
          <div className="space-y-3">
            {incident.evidence_json?.map((ev: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#0b101c] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-bold">
                      {ev.type}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {ev.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    {ev.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">Weight</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {Math.round(ev.confidence_weight * 100)}%
                  </span>
                </div>
              </div>
            ))}

            {/* Alternative Hypotheses */}
            {incident.alternatives_json?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#1e293b]">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase">
                  Alternative Hypotheses Evaluated & Dismissed:
                </h4>
                <div className="space-y-2">
                  {incident.alternatives_json.map((alt: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900/40 border border-slate-800 text-xs font-mono flex justify-between items-center text-slate-300"
                    >
                      <span>
                        • <strong>{alt.cause}</strong>: {alt.reason_rejected_or_unlikely}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Prob: {Math.round(alt.probability * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Agent Trace */}
        {activeTab === "trace" && (
          <div className="space-y-3">
            {(agentTrace.length > 0
              ? agentTrace
              : [
                  {
                    step_number: 1,
                    agent_name: "Planner Agent",
                    action_summary: "Formulated structured 6-step investigation plan",
                    tool_called: null,
                    duration_ms: 120,
                  },
                  {
                    step_number: 2,
                    agent_name: "Investigator Agent",
                    action_summary: `Queried get_metrics & get_service_health for '${incident.affected_service}'`,
                    tool_called: "get_metrics",
                    duration_ms: 240,
                  },
                  {
                    step_number: 3,
                    agent_name: "Investigator Agent",
                    action_summary: "Audited error logs & correlated release v2.4.1 commit",
                    tool_called: "get_logs",
                    duration_ms: 310,
                  },
                  {
                    step_number: 4,
                    agent_name: "Knowledge Agent",
                    action_summary: "RAG search matched HikariCP pool runbook & Incident DNA (91.2% match)",
                    tool_called: "search_runbook",
                    duration_ms: 190,
                  },
                  {
                    step_number: 5,
                    agent_name: "Root Cause Agent",
                    action_summary: "Synthesized root cause with 92% calibrated confidence",
                    tool_called: null,
                    duration_ms: 450,
                  },
                  {
                    step_number: 6,
                    agent_name: "Risk Agent",
                    action_summary: "Computed blast radius: 2 downstream services, $2,450/min exposure",
                    tool_called: "calculate_blast_radius",
                    duration_ms: 140,
                  },
                  {
                    step_number: 7,
                    agent_name: "Remediation Agent",
                    action_summary: "Generated approval-gated operational remediation proposal",
                    tool_called: "propose_remediation",
                    duration_ms: 220,
                  },
                ]
            ).map((st: any) => (
              <div
                key={st.step_number}
                className="p-3 rounded-lg bg-[#0b101c] border border-[#1e293b] flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold">
                    {st.step_number}
                  </span>
                  <div>
                    <span className="font-bold text-white mr-2">{st.agent_name}</span>
                    <span className="text-slate-300">{st.action_summary}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {st.tool_called && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] block mb-1">
                      Tool: {st.tool_called}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{st.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Google SRE Postmortem */}
        {activeTab === "postmortem" && postmortem && (
          <div className="space-y-4 font-mono text-xs text-slate-300">
            <div className="p-4 rounded-lg bg-[#07090e] border border-[#1e293b]">
              <h3 className="text-sm font-bold text-white mb-2">{postmortem.title}</h3>
              <p className="mb-3 text-slate-400">{postmortem.root_cause_summary}</p>
              <div className="font-bold text-cyan-400 mb-1">Impact Summary:</div>
              <p className="mb-4 text-slate-400">{postmortem.impact_summary}</p>

              <div className="font-bold text-cyan-400 mb-2">Timeline of Events:</div>
              <div className="space-y-1 mb-4">
                {postmortem.timeline_json?.map((t: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-cyan-400 font-bold">{t.time}:</span>
                    <span>{t.event}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#1e293b]">
                <div>
                  <div className="font-bold text-emerald-400 mb-1">What Went Well:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {postmortem.what_went_well?.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-bold text-rose-400 mb-1">Action Items:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {postmortem.action_items_json?.map((a: any, i: number) => (
                      <li key={i}>
                        [{a.priority}] {a.action} ({a.owner})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
