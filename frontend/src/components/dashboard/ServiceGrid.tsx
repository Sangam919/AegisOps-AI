"use client";

import React from "react";
import Link from "next/link";
import { Server, ArrowUpRight, Cpu, Database, Activity } from "lucide-react";
import { formatLatency, formatPercent } from "@/lib/utils";

interface Props {
  services: any[];
}

export default function ServiceGrid({ services }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold text-white tracking-wide">
            Microservice Mesh Nodes
          </h2>
        </div>
        <Link
          href="/services"
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
        >
          <span>View All Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {services.map((svc) => {
          const isCritical = svc.health === "critical";
          const isDegraded = svc.health === "degraded";

          return (
            <Link
              key={svc.name}
              href={`/services/${svc.name}`}
              className="cyber-card p-3.5 flex flex-col justify-between group hover:border-cyan-500/50"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {svc.tier}
                  </span>
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

                <h3 className="text-sm font-mono font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                  {svc.display_name}
                </h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1e293b] grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Latency (p95)</span>
                  <span className="font-bold text-slate-100">
                    {formatLatency(svc.latency_p95)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Error Rate</span>
                  <span
                    className={`font-bold ${
                      svc.error_rate > 0.05 ? "text-rose-400" : "text-slate-100"
                    }`}
                  >
                    {formatPercent(svc.error_rate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Throughput</span>
                  <span className="font-bold text-cyan-300">
                    {Math.round(svc.throughput)} req/s
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">CPU Usage</span>
                  <span className="font-bold text-slate-100">
                    {Math.round(svc.cpu_percent)}%
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
