"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Server,
  Network,
  History,
  Bot,
  BookOpen,
  ShieldCheck,
  Target,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Activity, badge: "Live" },
  { label: "Live Topology", href: "/topology", icon: Network, highlight: true },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle },
  { label: "Services", href: "/services", icon: Server },
  { label: "Time-Travel", href: "/time-travel", icon: History, standout: true },
  { label: "AI Copilot", href: "/ai-copilot", icon: Bot, standout: true },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { label: "AI Calibration", href: "/evaluation", icon: Target, standout: true },
  { label: "Security & Audit", href: "/security", icon: ShieldCheck },
  { label: "Simulation Lab", href: "/simulations", icon: Sliders },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0a0d15] border-r border-[#1e293b] flex flex-col z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center border-b border-[#1e293b] justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-4 h-4 text-black font-bold fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold tracking-wider text-sm text-white group-hover:text-cyan-400 transition-colors">
              AEGISOPS<span className="text-cyan-400 font-extrabold ml-1">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Autonomous SRE Mesh
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
              {item.standout && !item.badge && (
                <Sparkles className="w-3 h-3 text-cyan-400/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-[#1e293b] bg-[#07090e]">
        <div className="px-3 py-2.5 rounded-lg bg-[#0e1422] border border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-slate-300">Telemetry Active</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Tick 3s</span>
        </div>
      </div>
    </aside>
  );
}
