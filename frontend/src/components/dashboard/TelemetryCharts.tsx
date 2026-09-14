"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { LineChart as ChartIcon, Zap, Activity, Cpu } from "lucide-react";

interface Props {
  metricsData?: {
    series: any[];
  } | null;
}

export default function TelemetryCharts({ metricsData }: Props) {
  const [activeTab, setActiveTab] = useState<"latency" | "resources" | "errors">("latency");
  const series = metricsData?.series || [];

  return (
    <div className="cyber-card p-4 flex flex-col">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e293b] mb-4 gap-2">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold text-white tracking-wide">
            Infrastructure Telemetry Timeline
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center rounded-lg bg-[#0e1422] border border-[#1e293b] p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab("latency")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "latency"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            p95 Latency & Throughput
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "resources"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            CPU & Memory
          </button>
          <button
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "errors"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Error Rate & DB Conns
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "latency" ? (
            <AreaChart data={series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontStyle="monospace" />
              <YAxis stroke="#64748b" fontSize={11} fontStyle="monospace" unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d131f",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              <ReferenceLine y={200} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "SLA Threshold (200ms)", fill: "#f43f5e", fontSize: 10, position: "top" }} />
              <Area
                type="monotone"
                dataKey="max_latency_p95"
                name="Peak Latency (ms)"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGrad)"
              />
            </AreaChart>
          ) : activeTab === "resources" ? (
            <LineChart data={series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontStyle="monospace" />
              <YAxis stroke="#64748b" fontSize={11} fontStyle="monospace" unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d131f",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              <Line type="monotone" dataKey="cpu_utilization" name="Avg CPU (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory_utilization" name="Avg Memory (%)" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontStyle="monospace" />
              <YAxis stroke="#64748b" fontSize={11} fontStyle="monospace" unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d131f",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              <Area type="monotone" dataKey="error_rate_pct" name="Error Rate (%)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#errorGrad)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-[#1e293b]">
        <span>Aggregated cluster metrics • Live polling</span>
        <span>Resolution: 60s windows</span>
      </div>
    </div>
  );
}
