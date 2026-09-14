"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Shield,
  Activity,
  Cpu,
  Network,
  Bot,
  History,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-6xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 shadow-glow-cyan">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Autonomous SRE & Reliability Platform</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl sm:text-6xl font-extrabold font-mono tracking-tight text-white mb-6">
          AI That Understands <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
            Your Infrastructure.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-sans leading-relaxed mb-10">
          Detect anomalies with machine learning. Investigate outages with multi-agent AI.
          Calculate blast radius, retrieve RAG runbooks, and enact verified human-in-the-loop remediation.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-sm transition-all shadow-glow-cyan hover:scale-105"
          >
            <span>Open Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/topology"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0e1422] hover:bg-[#151d30] border border-[#1e293b] text-slate-200 font-mono text-sm transition-all"
          >
            <Network className="w-4 h-4 text-cyan-400" />
            <span>View Live Topology</span>
          </Link>
        </div>

        {/* Interactive Autonomous Pipeline Visualizer */}
        <div className="mt-16 p-6 rounded-xl bg-[#0a0e18]/80 border border-[#1e293b] max-w-4xl mx-auto backdrop-blur-md">
          <div className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider">
            Autonomous Reliability Lifecycle Loop
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <Activity className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
              <span className="font-bold block text-white">Telemetry</span>
              <span className="text-[10px] text-slate-400">Streamed</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-purple-800/40">
              <Cpu className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
              <span className="font-bold block text-purple-200">ML Detect</span>
              <span className="text-[10px] text-purple-400">Isolation Forest</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyan-800/40">
              <Bot className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
              <span className="font-bold block text-cyan-200">Multi-Agent</span>
              <span className="text-[10px] text-cyan-400">7 Specialists</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-amber-800/40">
              <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <span className="font-bold block text-amber-200">Root Cause</span>
              <span className="text-[10px] text-amber-400">92% Calibrated</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-rose-800/40">
              <Zap className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
              <span className="font-bold block text-rose-200">Remediation</span>
              <span className="text-[10px] text-rose-400">Human Approval</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-800/40">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <span className="font-bold block text-emerald-200">Verified</span>
              <span className="text-[10px] text-emerald-400">SLA Restored</span>
            </div>
          </div>
        </div>
      </section>

      {/* Standout Feature Pillars */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-[#1e293b]/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white mb-2">
            Engineered for Enterprise Mission-Critical Ops
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Beyond toy chatbots: genuine time-series ML, formal agent graph, and verifiable guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card p-5">
            <Network className="w-6 h-6 text-cyan-400 mb-3" />
            <h3 className="text-base font-mono font-bold text-white mb-2">
              Live Topology & Blast Radius
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Interactive distributed dependency graph with real-time animated traffic particles.
              Calculates downstream blast radius and financial revenue loss per minute.
            </p>
          </div>

          <div className="cyber-card p-5">
            <History className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="text-base font-mono font-bold text-white mb-2">
              Time-Travel Debugger
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Scrub a continuous time slider to replay infrastructure telemetry, logs, and service health
              at any past second to observe pre-incident failure genesis.
            </p>
          </div>

          <div className="cyber-card p-5">
            <FileText className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-base font-mono font-bold text-white mb-2">
              Automated SRE Postmortems
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Generates blameless Google SRE-style postmortems upon remediation verification,
              auto-assembling timelines, root causes, and P0/P1 preventative action items.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1e293b] text-center text-xs font-mono text-slate-400">
        <p>AegisOps AI • Autonomous AI Operations & Reliability Platform</p>
        <p className="text-[11px] text-slate-400 mt-1">
          FastAPI • Next.js 14 • Scikit-Learn • DeepSeek API • SQLite / PostgreSQL • Docker
        </p>
      </footer>
    </div>
  );
}
