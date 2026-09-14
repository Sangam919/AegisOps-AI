"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function SecurityPage() {
  const [securityData, setSecurityData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getSecurityEvents().then(setSecurityData).catch(console.error);
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            AI Security Guardrails & Operational Audit Trail
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Prompt injection detection, tool execution sandboxing, and immutable action logging
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>Guardrails Enforcing</span>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Prompt Injection Filter
          </span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-mono font-bold text-white">
              Regex & Semantic Filter Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-2">
            Intercepts jailbreaks, prompt override attempts, and instruction leakage attacks before LLM processing.
          </p>
        </div>

        <div className="cyber-card p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Tool Execution Sandbox
          </span>
          <div className="flex items-center gap-2 mt-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-mono font-bold text-white">
              Hard Restricted Whitelist
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-2">
            Agents execute typed Python functions only. Arbitrary shell, terminal, or bash execution is strictly prohibited.
          </p>
        </div>

        <div className="cyber-card p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Human-in-the-Loop Gating
          </span>
          <div className="flex items-center gap-2 mt-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-mono font-bold text-white">
              SRE Signature Required
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-2">
            High and Critical operational remediations cannot execute autonomously without explicit operator approval.
          </p>
        </div>
      </div>

      {/* Intercepted Threat Events */}
      <div className="cyber-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Intercepted Security & Injection Events
          </h2>
          <span className="text-[10px] font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
            {securityData?.total_blocked_requests || 3} Blocked
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {securityData?.events?.map((ev: any) => (
            <div
              key={ev.id}
              className="p-3 rounded-lg bg-[#0b101c] border border-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase">
                    {ev.event_type}
                  </span>
                  <span className="text-slate-400 text-[11px]">{ev.timestamp}</span>
                </div>
                <div className="text-slate-200 text-xs">{ev.details}</div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {ev.action_taken}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Audit Log Table */}
      <div className="cyber-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Immutable Operational Audit Trail
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            Append-only verification log
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {auditLogs.map((log: any) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-[#0b101c] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-cyan-400 font-bold">{log.action}</span>
                  <span className="text-slate-400 text-[11px]">by {log.user_email}</span>
                  <span className="text-slate-400 text-[11px]">• {log.timestamp}</span>
                </div>
                <div className="text-slate-300 text-xs">{log.details}</div>
              </div>

              <div className="text-slate-400 text-[11px]">
                Target: {log.resource_type} ({log.resource_id})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
