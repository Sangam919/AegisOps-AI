"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Server, ArrowRight, Activity, Cpu, Database } from "lucide-react";
import { api } from "@/lib/api";
import { formatLatency, formatPercent } from "@/lib/utils";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    api.getServices().then(setServices).catch(console.error);
    const interval = setInterval(() => {
      api.getServices().then(setServices).catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Microservices Mesh Directory
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Operational telemetry and health metrics across all monitored cluster services
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => {
          const isCritical = svc.health === "critical";
          const isDegraded = svc.health === "degraded";

          return (
            <Link
              key={svc.name}
              href={`/services/${svc.name}`}
              className="cyber-card p-5 group hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {svc.tier}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {svc.name}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                        : isDegraded
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {svc.health}
                  </span>
                </div>

                <h3 className="text-base font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {svc.display_name}
                </h3>

                <div className="text-xs font-mono text-slate-400 mt-1">
                  Dependencies: {svc.dependencies?.join(", ") || "None (Base Infra)"}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e293b] grid grid-cols-4 gap-2 text-xs font-mono text-center">
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="font-bold text-white">{formatLatency(svc.latency_p95)}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 block">Error Rate</span>
                  <span className={`font-bold ${svc.error_rate > 0.05 ? "text-rose-400" : "text-white"}`}>
                    {formatPercent(svc.error_rate)}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 block">Throughput</span>
                  <span className="font-bold text-cyan-300">{Math.round(svc.throughput)} req/s</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 block">CPU</span>
                  <span className="font-bold text-white">{Math.round(svc.cpu_percent)}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
