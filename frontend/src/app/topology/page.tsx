"use client";

import React, { useState, useEffect } from "react";
import TopologyMap from "@/components/dashboard/TopologyMap";
import { api } from "@/lib/api";
import { Network, Activity, ShieldAlert, Cpu } from "lucide-react";

export default function TopologyPage() {
  const [topology, setTopology] = useState<any>(null);

  useEffect(() => {
    api.getTopology().then(setTopology).catch(console.error);
    const interval = setInterval(() => {
      api.getTopology().then(setTopology).catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Distributed Mesh Topology & Dynamic Traffic Particles
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time directed microservices dependency graph with animated particle throughput and cascading blast radius
          </p>
        </div>
      </div>

      <TopologyMap topologyData={topology} />

      {/* Topology Architecture Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card p-4">
          <h3 className="text-xs font-mono font-bold text-white mb-1.5 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Edge Traffic Particles
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Particle speed and density scale with request throughput (req/s). When an edge encounters HTTP 5xx errors, particles transform to glowing red warnings.
          </p>
        </div>

        <div className="cyber-card p-4">
          <h3 className="text-xs font-mono font-bold text-white mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Cascading Blast Radius
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Degraded nodes emit expanding circular auras. Downstream dependents (e.g. API Gateway and User Service) dynamically flag transitive exposure.
          </p>
        </div>

        <div className="cyber-card p-4">
          <h3 className="text-xs font-mono font-bold text-white mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" /> Distributed Architecture
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Spans 8 tier-isolated microservices: Ingress Edge, Auth Pods, Checkout Pipeline, User Database, Redis Cache, and Kafka Event Queue.
          </p>
        </div>
      </div>
    </div>
  );
}
