"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Server, ArrowLeft, Activity, Terminal, ShieldAlert, Cpu } from "lucide-react";
import { api } from "@/lib/api";
import { formatLatency, formatPercent } from "@/lib/utils";

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const [service, setService] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getService(serviceId).then(setService).catch(console.error);
    api.getLogs(serviceId, "ALL", 30).then(setLogs).catch(console.error);

    const interval = setInterval(() => {
      api.getService(serviceId).then(setService).catch(console.error);
      api.getLogs(serviceId, "ALL", 30).then(setLogs).catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, [serviceId]);

  if (!service) {
    return (
      <div className="p-8 text-center font-mono text-slate-400 text-xs">
        Loading Service Telemetry...
      </div>
    );
  }

  const isCritical = service.health === "critical";
  const isDegraded = service.health === "degraded";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="p-2 rounded-lg bg-[#0e1422] border border-[#1e293b] text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {service.tier}
              </span>
              <h1 className="text-xl font-mono font-extrabold text-white">
                {service.display_name}
              </h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isCritical
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                    : isDegraded
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                {service.health}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 mt-1 block">
              Identifier: {service.name} • Dependencies: {service.dependencies?.join(", ") || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Readouts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
        <div className="cyber-card p-3.5">
          <span className="text-slate-400 text-[10px] block">p95 Latency</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {formatLatency(service.latency_p95)}
          </span>
        </div>
        <div className="cyber-card p-3.5">
          <span className="text-slate-400 text-[10px] block">Error Rate</span>
          <span
            className={`text-xl font-bold mt-1 block ${
              service.error_rate > 0.05 ? "text-rose-400" : "text-white"
            }`}
          >
            {formatPercent(service.error_rate)}
          </span>
        </div>
        <div className="cyber-card p-3.5">
          <span className="text-slate-400 text-[10px] block">Throughput</span>
          <span className="text-xl font-bold text-cyan-300 mt-1 block">
            {Math.round(service.throughput)} req/s
          </span>
        </div>
        <div className="cyber-card p-3.5">
          <span className="text-slate-400 text-[10px] block">CPU Utilization</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {Math.round(service.cpu_percent)}%
          </span>
        </div>
        <div className="cyber-card p-3.5">
          <span className="text-slate-400 text-[10px] block">Risk Score</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">
            {service.risk_score.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Real-time Structured Logs for this Service */}
      <div className="cyber-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <h2 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Live Tail Logs for {service.name}
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            Filtered stream ({logs.length} events)
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px] max-h-96 overflow-y-auto bg-[#07090e] p-3 rounded-lg border border-slate-900">
          {logs.length > 0 ? (
            logs.map((l, i) => (
              <div key={i} className="flex items-start gap-2 py-1 border-b border-slate-900/60">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                    l.level === "ERROR" || l.level === "FATAL"
                      ? "bg-rose-500/20 text-rose-400"
                      : l.level === "WARN"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-cyan-500/10 text-cyan-400"
                  }`}
                >
                  {l.level}
                </span>
                <span className="text-slate-400 shrink-0">{l.path}</span>
                <span className="text-slate-200">{l.message}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No recent log anomalies recorded for this service.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
