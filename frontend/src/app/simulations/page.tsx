"use client";

import React, { useState, useEffect } from "react";
import { Sliders, AlertTriangle, Play, RotateCcw, CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

const SCENARIOS = [
  {
    id: "db_exhaustion",
    title: "Database Connection Pool Saturation",
    target: "payment-service",
    description: "HikariCP pool hits 98% active capacity. Queries block and p95 latency spikes from 85ms to 950ms.",
    severity: "CRITICAL",
    isCenterpiece: true,
  },
  {
    id: "memory_leak",
    title: "JVM Heap Memory Leak & GC Pause",
    target: "payment-service",
    description: "Un-evicted payload objects exhaust heap old generation. ConcurrentMarkSweep GC pauses exceed 1800ms.",
    severity: "HIGH",
  },
  {
    id: "cpu_spike",
    title: "BCrypt CPU Starvation / Login Burst",
    target: "auth-service",
    description: "CPU hits 99.8% on Auth Service pods due to synchronous token hashing under credential flood.",
    severity: "HIGH",
  },
  {
    id: "deployment_regression",
    title: "Faulty Release v2.4.1 Deployment",
    target: "payment-service",
    description: "Checkout validator throws NullPointerException. HTTP 500 error rate escalates to 28%.",
    severity: "CRITICAL",
  },
  {
    id: "cache_eviction_storm",
    title: "Redis TTL Cache Eviction Storm",
    target: "cache-redis",
    description: "Simultaneous key expiration triggers thundering-herd cache misses directly against PostgreSQL.",
    severity: "MEDIUM",
  },
  {
    id: "cascading_failure",
    title: "Cascading Distributed Failure",
    target: "database-cluster",
    description: "Primary database saturation causes Payment, User, and Gateway services to cascade into timeouts.",
    severity: "CRITICAL",
  },
];

export default function SimulationsPage() {
  const [activeScenarios, setActiveScenarios] = useState<any>({});
  const [traffic, setTraffic] = useState("normal");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const status = await api.getSimStatus();
      setActiveScenarios(status.active_scenarios || {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInject = async (scenarioId: string, target?: string) => {
    try {
      await api.injectScenario(scenarioId, target);
      setActionMsg(`Injected failure scenario '${scenarioId}'! Anomaly will propagate in telemetry.`);
      loadStatus();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTraffic = async (lvl: "low" | "normal" | "high" | "extreme") => {
    try {
      setTraffic(lvl);
      await api.setTraffic(lvl);
      setActionMsg(`Traffic changed to ${lvl.toUpperCase()}`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setTraffic("normal");
      setActionMsg("Simulation reset. All services returned to nominal baseline.");
      loadStatus();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Infrastructure Simulation Lab & Fault Injection
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Inject realistic failure modes to evaluate autonomous anomaly detection and multi-agent incident investigation
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1422] border border-[#1e293b] hover:border-slate-600 text-xs font-mono text-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Nominal</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Traffic Control Panel */}
      <div className="cyber-card p-5 space-y-3">
        <h2 className="text-sm font-mono font-bold text-white">
          Synthetic User Traffic Multiplier
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          {[
            { id: "low", label: "Low Traffic (0.5x)", desc: "Quiet night baseline" },
            { id: "normal", label: "Normal Traffic (1.0x)", desc: "Typical business day" },
            { id: "high", label: "High Traffic (2.5x)", desc: "Peak marketing campaign" },
            { id: "extreme", label: "Extreme Surge (5.0x)", desc: "Black Friday load spike" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleTraffic(t.id as any)}
              className={`p-3 rounded-lg border text-left transition-all ${
                traffic === t.id
                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-glow-cyan"
                  : "bg-[#0b101c] border-[#1e293b] text-slate-400 hover:text-white"
              }`}
            >
              <div className="font-bold text-white mb-1">{t.label}</div>
              <div className="text-[10px] text-slate-400">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Failure Scenarios Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-mono font-bold text-white">
          Fault Injection Scenarios (Choose one to test AegisOps AI)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((sc) => {
            const isActive = !!activeScenarios[sc.id];

            return (
              <div
                key={sc.id}
                className={`cyber-card p-4 flex flex-col justify-between space-y-3 ${
                  sc.isCenterpiece ? "border-cyan-500/40" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        sc.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {sc.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Target: {sc.target}
                    </span>
                  </div>

                  <h3 className="text-sm font-mono font-bold text-white mb-1">
                    {sc.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {sc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
                  {isActive ? (
                    <span className="text-xs font-mono text-rose-400 font-bold animate-pulse flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Anomaly Injected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInject(sc.id, sc.target)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0e1422] hover:bg-cyan-500/20 border border-[#1e293b] hover:border-cyan-500/40 text-xs font-mono text-cyan-400 transition-all"
                    >
                      <Play className="w-3 h-3" />
                      <span>Inject Fault</span>
                    </button>
                  )}

                  <Link
                    href="/dashboard"
                    className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Observe</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
