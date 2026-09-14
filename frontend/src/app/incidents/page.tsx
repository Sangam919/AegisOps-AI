"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldCheck, ArrowRight, Filter, Search, Plus } from "lucide-react";
import { api } from "@/lib/api";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.getIncidents().then((data) => setIncidents(data || [])).catch(console.error);
    const interval = setInterval(() => {
      api.getIncidents().then((data) => setIncidents(data || [])).catch(console.error);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== "ALL" && inc.severity !== filterSeverity) return false;
    if (
      searchQuery &&
      !inc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inc.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Autonomous Incident Management
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Full lifecycle incident tracking, ML root cause synthesis & verified operational remediation
          </p>
        </div>

        <Link
          href="/simulations"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0e1422] border border-[#1e293b] hover:border-cyan-500/40 text-xs font-mono text-cyan-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Inject Incident Scenario</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0a0e18] border border-[#1e293b]">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Incident ID, Title, or Root Cause..."
            className="w-full bg-transparent text-xs font-mono text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Severity:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                filterSeverity === sev
                  ? "bg-cyan-500 text-black"
                  : "text-slate-400 hover:text-white bg-slate-800/40"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table / Cards */}
      <div className="space-y-3">
        {filtered.map((inc) => {
          const isResolved = inc.status === "RESOLVED";
          const isAwaiting = inc.status === "AWAITING_APPROVAL";

          return (
            <div
              key={inc.id}
              className="cyber-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      inc.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                        : inc.severity === "HIGH"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {inc.id}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    • {inc.affected_service}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isResolved
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : isAwaiting
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold animate-pulse"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>

                <h3 className="text-sm font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {inc.title}
                </h3>

                <p className="text-xs text-slate-400 font-sans line-clamp-1">
                  {inc.suspected_root_cause || inc.symptoms || "Autonomous investigation pending."}
                </p>
              </div>

              {/* Confidence & Action */}
              <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1e293b]">
                {inc.confidence > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">
                      AI Confidence
                    </span>
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      {Math.round(inc.confidence * 100)}%
                    </span>
                  </div>
                )}

                <Link
                  href={`/incidents/${inc.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all group-hover:scale-105"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
