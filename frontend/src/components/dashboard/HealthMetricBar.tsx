"use client";

import React from "react";
import { Activity, ShieldAlert, Server, Cpu, Zap, TrendingUp } from "lucide-react";

interface Props {
  summary: {
    system_health_score: number;
    overall_risk_score: number;
    active_incidents_count: number;
    monitored_services_count: number;
    anomalies_detected_count: number;
    running_ai_investigations: number;
    prediction_status: string;
  } | null;
}

export default function HealthMetricBar({ summary }: Props) {
  const health = summary?.system_health_score ?? 98.5;
  const risk = summary?.overall_risk_score ?? 0.08;
  const incidents = summary?.active_incidents_count ?? 0;
  const services = summary?.monitored_services_count ?? 8;
  const anomalies = summary?.anomalies_detected_count ?? 0;

  // Determine risk color
  const riskColor =
    risk > 0.6
      ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
      : risk > 0.3
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Overall System Health */}
      <div className="cyber-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>System Health</span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold text-white tracking-tight">
            {health.toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">SLA 99.9%</span>
        </div>
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              health > 90 ? "bg-emerald-500" : health > 75 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, health)}%` }}
          />
        </div>
      </div>

      {/* 2. Unified Risk Score */}
      <div className="cyber-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>Overall Risk</span>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-mono font-bold text-white">
            {risk.toFixed(2)}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-bold ${riskColor}`}>
            {risk > 0.6 ? "Critical" : risk > 0.3 ? "Elevated" : "Nominal"}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-2">
          Multi-signal blast composite
        </div>
      </div>

      {/* 3. Active Incidents */}
      <div className="cyber-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>Active Incidents</span>
          <Zap className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl font-mono font-bold ${
              incidents > 0 ? "text-rose-400 animate-pulse" : "text-slate-100"
            }`}
          >
            {incidents}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {incidents > 0 ? "Under Investigation" : "Zero active"}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-2">
          Autonomous RCA ready
        </div>
      </div>

      {/* 4. Monitored Services */}
      <div className="cyber-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>Services Mesh</span>
          <Server className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold text-white">
            {services}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">nodes online</span>
        </div>
        <div className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
          100% telemetry synced
        </div>
      </div>

      {/* 5. ML Anomalies Detected */}
      <div className="cyber-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>ML Anomalies</span>
          <Cpu className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-white">
            {anomalies}
          </span>
          <span className="text-[10px] text-purple-300 font-mono">Isolation Forest</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-2">
          Multivariate 3-sigma
        </div>
      </div>

      {/* 6. Incident Prediction Horizon */}
      <div className="cyber-card p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>AI Prediction</span>
          <TrendingUp className="w-4 h-4 text-cyber-blue" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm font-mono font-bold text-cyan-300">
            30m Window
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            Probabilistic
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-2 truncate">
          {summary?.prediction_status ?? "STABLE"}
        </div>
      </div>
    </div>
  );
}
