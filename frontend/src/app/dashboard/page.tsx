"use client";

import React, { useState, useEffect } from "react";
import HealthMetricBar from "@/components/dashboard/HealthMetricBar";
import TopologyMap from "@/components/dashboard/TopologyMap";
import TelemetryCharts from "@/components/dashboard/TelemetryCharts";
import ServiceGrid from "@/components/dashboard/ServiceGrid";
import RecentIncidents from "@/components/dashboard/RecentIncidents";
import { api } from "@/lib/api";
import { AlertCircle, TrendingUp, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [topology, setTopology] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sumRes, topRes, metRes, svcRes, incRes, predRes] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getTopology().catch(() => null),
        api.getMetrics().catch(() => null),
        api.getServices().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getPredictions().catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      if (topRes) setTopology(topRes);
      if (metRes) setMetrics(metRes);
      if (svcRes && svcRes.length) setServices(svcRes);
      if (incRes && incRes.length) setIncidents(incRes);
      if (predRes && predRes.length) setPredictions(predRes);
    } catch (err) {
      console.error("Dashboard polling error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds for live sync
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Standout indicators */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1e293b]/60">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white tracking-tight flex items-center gap-2">
            Operations Command Center
            <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              Autonomous Mesh Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time telemetry, machine-learning anomaly detection & multi-agent investigation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span>Live Sync 3s</span>
        </div>
      </div>

      {/* KPI Gauge Bar */}
      <HealthMetricBar summary={summary} />

      {/* Standout Feature 1: Live Interactive Topology Map with Particle Flow */}
      <TopologyMap topologyData={topology} />

      {/* Telemetry Charts and Live Incident Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TelemetryCharts metricsData={metrics} />
        </div>
        <div>
          <RecentIncidents incidents={incidents} />
        </div>
      </div>

      {/* Microservice Mesh Grid */}
      <ServiceGrid services={services} />

      {/* ML 30-Minute Degradation Predictions Bar */}
      <div className="cyber-card p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">
              ML Predictive Degradation Forecast (30-Minute Horizon)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Probabilistic early-warning model
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {predictions.slice(0, 3).map((pred) => {
            const probPct = Math.round(pred.probability * 100);
            const isCritical = pred.probability > 0.65;
            const isElevated = pred.probability > 0.35;

            return (
              <div
                key={pred.service_name}
                className="p-3 rounded-lg bg-[#0b101c] border border-[#1e293b] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {pred.service_name}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isCritical
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : isElevated
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {pred.risk_tier}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-slate-400 font-mono">Degradation Risk:</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {probPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all ${
                      isCritical ? "bg-rose-500" : isElevated ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${probPct}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                  Leading signal: {pred.contributing_signals?.[0]?.signal || "Nominal variance"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
