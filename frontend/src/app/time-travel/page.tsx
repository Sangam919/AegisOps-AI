"use client";

import React, { useState, useEffect } from "react";
import { History, Play, RotateCcw, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatLatency, formatPercent } from "@/lib/utils";

export default function TimeTravelPage() {
  const [minutesAgo, setMinutesAgo] = useState(5);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchSnapshot = async (min: number) => {
    try {
      const data = await api.getTimeTravel(min);
      setSnapshot(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSnapshot(minutesAgo);
  }, [minutesAgo]);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setMinutesAgo((prev) => {
          if (prev <= 0) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const services = snapshot ? Object.values(snapshot.services || {}) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Time-Travel Infrastructure Debugger
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Scrub continuous timeline to replay infrastructure state, metric anomalies, and log streams before incident inception
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Replay Buffer: 60 Minutes</span>
        </div>
      </div>

      {/* Scrubbing Control Bar */}
      <div className="cyber-card p-5 space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition-all shadow-glow-cyan"
            >
              <Play className={`w-3.5 h-3.5 ${isPlaying ? "fill-current" : ""}`} />
              <span>{isPlaying ? "Pause Replay" : "Play Timeline"}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setMinutesAgo(0);
              }}
              className="p-1.5 rounded bg-[#0e1422] border border-[#1e293b] text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Scrubbed Position:</span>
            <span className="text-base font-bold text-cyan-400">
              T - {minutesAgo} minutes
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={minutesAgo}
            onChange={(e) => {
              setIsPlaying(false);
              setMinutesAgo(parseInt(e.target.value));
            }}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Now (T-0m)</span>
            <span>T-15m (Incident Genesis)</span>
            <span>T-30m (Nominal Baseline)</span>
            <span>T-60m (Past Hour)</span>
          </div>
        </div>
      </div>

      {/* Replayed Infrastructure State Snapshot */}
      <div className="cyber-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <h2 className="text-sm font-mono font-bold text-white">
            Historical State at {snapshot?.target_timestamp ? new Date(snapshot.target_timestamp).toLocaleTimeString() : "Selected Time"}
          </h2>
          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
            {snapshot?.summary}
          </span>
        </div>

        {/* Service grid at this timestamp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {services.map((svc: any) => (
            <div
              key={svc.name}
              className="p-3.5 rounded-lg bg-[#0b101c] border border-[#1e293b] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white truncate">
                  {svc.display_name}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    svc.health === "critical"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : svc.health === "degraded"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}
                >
                  {svc.health}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Latency:</span>
                  <span className="font-bold text-slate-200">
                    {formatLatency(svc.latency_p95)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Error Rate:</span>
                  <span
                    className={`font-bold ${
                      svc.error_rate > 0.05 ? "text-rose-400" : "text-slate-200"
                    }`}
                  >
                    {formatPercent(svc.error_rate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
