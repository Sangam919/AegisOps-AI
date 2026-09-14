"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

interface Props {
  incidents: any[];
}

export default function RecentIncidents({ incidents }: Props) {
  return (
    <div className="cyber-card p-4 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-mono font-bold text-white tracking-wide">
            Autonomous Incident Stream
          </h2>
        </div>
        <Link
          href="/incidents"
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
        >
          <span>All Incidents</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {incidents.slice(0, 3).map((inc) => {
          const isResolved = inc.status === "RESOLVED";
          const isAwaiting = inc.status === "AWAITING_APPROVAL";

          return (
            <Link
              key={inc.id}
              href={`/incidents/${inc.id}`}
              className="block p-3 rounded-lg bg-[#0b101c] border border-[#1e293b] hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      inc.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {inc.id}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isResolved
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : isAwaiting
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  {inc.status}
                </span>
              </div>

              <h4 className="text-xs font-medium text-slate-200 line-clamp-1 mb-1">
                {inc.title}
              </h4>

              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">
                  Service: <span className="text-cyan-400">{inc.affected_service}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Confidence: {Math.round(inc.confidence * 100)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
