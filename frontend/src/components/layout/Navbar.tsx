"use client";

import React, { useState } from "react";
import { Zap, RotateCcw, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function Navbar() {
  const [traffic, setTrafficState] = useState<"low" | "normal" | "high" | "extreme">("normal");
  const [isTriggering, setIsTriggering] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleTrafficChange = async (level: "low" | "normal" | "high" | "extreme") => {
    try {
      setTrafficState(level);
      await api.setTraffic(level);
      showNotice(`Traffic switched to ${level.toUpperCase()}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchDemo = async () => {
    try {
      setIsTriggering(true);
      const res = await api.launchDemo();
      showNotice("⚠️ AI Incident Launched! Payment Service connection pool saturation active.");
      // Redirect or reload window to observe incident propagation
      setTimeout(() => {
        window.location.href = "/incidents/INC-2026-0042";
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setTrafficState("normal");
      showNotice("Simulation reset. All services restored to nominal SLA.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <header className="h-16 pl-64 fixed top-0 left-0 right-0 z-20 bg-[#0a0d15]/90 backdrop-blur-md border-b border-[#1e293b] flex items-center justify-between px-6">
      {/* Left: Environment & Breadcrumb Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>AegisMesh v1.0</span>
        </div>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Region: us-east-1 (Distributed Mesh)
        </span>
      </div>

      {/* Center: Live Notification Toast */}
      {notification && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-fade-in shadow-glow-cyan">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Right: Simulation Controls & Launch Incident Button */}
      <div className="flex items-center gap-3">
        {/* Traffic Selector */}
        <div className="hidden lg:flex items-center rounded-lg bg-[#0e1422] border border-[#1e293b] p-0.5 text-xs font-mono">
          <span className="px-2 text-slate-400 text-[11px]">Traffic:</span>
          {(["low", "normal", "high", "extreme"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleTrafficChange(lvl)}
              className={`px-2 py-0.5 rounded capitalize transition-all ${
                traffic === lvl
                  ? "bg-cyan-500 text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Reset Simulation */}
        <button
          onClick={handleReset}
          title="Reset Simulation to Nominal State"
          className="p-2 rounded-lg bg-[#0e1422] border border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Highlight Demo Launcher */}
        <button
          onClick={handleLaunchDemo}
          disabled={isTriggering}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition-all shadow-glow-rose hover:scale-[1.02] active:scale-[0.98]"
        >
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          <span>{isTriggering ? "Triggering..." : "Launch AI Incident"}</span>
        </button>
      </div>
    </header>
  );
}
