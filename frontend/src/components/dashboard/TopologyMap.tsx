"use client";

import React, { useState, useEffect } from "react";
import { Network, Activity, Zap, Server, ShieldAlert } from "lucide-react";
import { formatLatency, formatPercent } from "@/lib/utils";

interface Node {
  id: string;
  name: string;
  display_name: string;
  health: string;
  tier: string;
  latency_p95: number;
  error_rate: number;
  throughput: number;
  cpu_percent: number;
  risk_score: number;
  is_impacted: boolean;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
  traffic_volume: number;
  latency_ms: number;
  status: string;
}

interface Props {
  topologyData?: {
    nodes: any[];
    edges: any[];
  } | null;
}

// Geometric coordinates for 8 microservices mesh
const NODE_COORDINATES: Record<string, { x: number; y: number }> = {
  "api-gateway": { x: 120, y: 190 },
  "auth-service": { x: 300, y: 90 },
  "payment-service": { x: 300, y: 190 },
  "user-service": { x: 300, y: 290 },
  "recommendation-service": { x: 300, y: 390 },
  "cache-redis": { x: 500, y: 100 },
  "database-cluster": { x: 500, y: 240 },
  "message-queue": { x: 500, y: 380 },
};

export default function TopologyMap({ topologyData }: Props) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  // Animation ticker for traffic flow particles
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick((t) => (t + 1) % 100);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const rawNodes = topologyData?.nodes || [];
  const rawEdges = topologyData?.edges || [];

  const nodes: Node[] = rawNodes.map((n) => ({
    ...n,
    x: NODE_COORDINATES[n.id]?.x || 250,
    y: NODE_COORDINATES[n.id]?.y || 200,
  }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Auto-select degraded node or payment-service for inspection default
  useEffect(() => {
    if (!selectedNode && nodes.length > 0) {
      const degraded = nodes.find((n) => n.health !== "healthy") || nodes.find((n) => n.id === "payment-service") || nodes[0];
      setSelectedNode(degraded);
    }
  }, [nodes, selectedNode]);

  return (
    <div className="cyber-card p-4 relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold text-white tracking-wide">
            Live Service Topology & Traffic Mesh
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            Animated Particles
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-rose-400">Blast Radius</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        <div className="lg:col-span-3 bg-[#06080e] rounded-lg border border-[#1e293b]/60 relative h-[420px] overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

          <svg className="w-full h-full" viewBox="0 0 620 480">
            <defs>
              <linearGradient id="edgeNormal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="edgeDegraded" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Render Edges & Animated Traffic Particles */}
            {rawEdges.map((edge, idx) => {
              const src = nodeMap.get(edge.source);
              const dst = nodeMap.get(edge.target);
              if (!src || !dst) return null;

              const isEdgeDegraded = edge.status !== "normal";
              const strokeColor = isEdgeDegraded ? "#f43f5e" : "#0284c7";
              const strokeWidth = Math.max(1.5, Math.min(4, edge.traffic_volume / 200));

              // Compute particle position along edge
              const particleRatio = ((pulseTick * 2.5 + idx * 25) % 100) / 100;
              const px = src.x + (dst.x - src.x) * particleRatio;
              const py = src.y + (dst.y - src.y) * particleRatio;

              return (
                <g key={`edge-${edge.source}-${edge.target}`}>
                  {/* Connection Line */}
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={dst.x}
                    y2={dst.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={isEdgeDegraded ? 0.8 : 0.4}
                    strokeDasharray={isEdgeDegraded ? "4 3" : undefined}
                  />

                  {/* Animated Particle */}
                  <circle
                    cx={px}
                    cy={py}
                    r={isEdgeDegraded ? 3.5 : 2.5}
                    fill={isEdgeDegraded ? "#f43f5e" : "#38bdf8"}
                    className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
                  />
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isCritical = node.health === "critical";
              const isDegraded = node.health === "degraded";

              let nodeColor = "#10b981"; // healthy emerald
              if (isCritical) nodeColor = "#f43f5e";
              else if (isDegraded) nodeColor = "#f59e0b";

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  {/* Outer Pulsing Aura for Critical/Degraded Nodes */}
                  {(isCritical || isDegraded) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={32}
                      fill={nodeColor}
                      fillOpacity={0.18}
                      className="animate-ping"
                    />
                  )}

                  {/* Node Background Halo */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 25 : 21}
                    fill="#0e1422"
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 3 : 1.8}
                    className="filter drop-shadow-md"
                  />

                  {/* Node Label */}
                  <text
                    x={node.x}
                    y={node.y - 28}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="10.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.display_name.split(" ")[0]}
                  </text>

                  {/* Health Metric Indicator */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {Math.round(node.latency_p95)}ms
                  </text>

                  {/* Subtext Error Rate */}
                  <text
                    x={node.x}
                    y={node.y + 14}
                    textAnchor="middle"
                    fill={isCritical ? "#f43f5e" : "#94a3b8"}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {(node.error_rate * 100).toFixed(1)}% err
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Inspector Drawer */}
        <div className="bg-[#0b101d] rounded-lg border border-[#1e293b] p-4 flex flex-col justify-between h-[420px]">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">
                    {selectedNode.display_name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedNode.id}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    selectedNode.health === "critical"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : selectedNode.health === "degraded"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}
                >
                  {selectedNode.health}
                </span>
              </div>

              {/* Metrics Readouts */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">p95 Latency:</span>
                  <span className="font-bold text-white">
                    {formatLatency(selectedNode.latency_p95)}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">Error Rate:</span>
                  <span
                    className={`font-bold ${
                      selectedNode.error_rate > 0.05 ? "text-rose-400" : "text-white"
                    }`}
                  >
                    {formatPercent(selectedNode.error_rate)}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">Throughput:</span>
                  <span className="font-bold text-cyan-300">
                    {selectedNode.throughput.toFixed(1)} req/s
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">CPU Usage:</span>
                  <span className="font-bold text-white">
                    {selectedNode.cpu_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-bold text-amber-300">
                    {selectedNode.risk_score.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Blast Impact Warning if anomalous */}
              {selectedNode.health !== "healthy" && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/40 text-[11px] font-mono text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Cascading Risk Active</span>
                    Downstream dependency chain impacted. Autonomous RCA recommended.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">
              Click any node in topology to inspect live telemetry and blast radius.
            </div>
          )}

          <div className="text-[10px] text-slate-400 font-mono text-center pt-2 border-t border-[#1e293b]">
            Direct mesh graph rendering • Live SVG
          </div>
        </div>
      </div>
    </div>
  );
}
