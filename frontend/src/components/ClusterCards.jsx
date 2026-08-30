import React from 'react';
import { ShieldAlert, Users, Percent, Sparkles, Layers } from 'lucide-react';

const CLUSTER_ACCENT_COLORS = [
  '#22d3ee', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export default function ClusterCards({ clusters = [], selectedClusterId = null, onSelectCluster }) {
  if (!clusters || clusters.length === 0) return null;

  return (
    <div className="w-full bg-[#0d0d14]/90 backdrop-blur-md border-t border-[#1e1e2f] px-6 py-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Resolved Threat Actor Identity Clusters
          </span>
          <span className="text-xs font-mono bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40">
            {clusters.length} Groups
          </span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">
          Click a cluster card to highlight members in graph
        </span>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
        {clusters.map((cluster, idx) => {
          const isSelected = selectedClusterId === cluster.cluster_id;
          const color = CLUSTER_ACCENT_COLORS[idx % CLUSTER_ACCENT_COLORS.length];
          const isMulti = cluster.alias_count > 1;

          return (
            <div
              key={cluster.cluster_id}
              onClick={() => onSelectCluster && onSelectCluster(isSelected ? null : cluster.cluster_id)}
              className={`relative flex-shrink-0 w-[240px] p-3 rounded-xl cursor-pointer transition-all duration-200 border-beam-container ${
                isSelected
                  ? 'bg-[#161626] border-2 shadow-lg shadow-cyan-500/20'
                  : 'bg-[#10101a] hover:bg-[#141422] border border-[#1e1e2f] hover:border-[#2e2e46]'
              }`}
              style={{
                borderColor: isSelected ? color : undefined
              }}
            >
              {/* Aceternity Glowing Border Beam for Resolved Multi-Alias Clusters */}
              {isMulti && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none opacity-40 hover:opacity-100 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${color}33 0%, transparent 70%)`
                  }}
                />
              )}

              <div className="relative z-10 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-xs font-bold text-white">
                      {cluster.cluster_id}
                    </span>
                  </div>

                  {isMulti && cluster.confidence_pct != null ? (
                    <div className="flex items-center gap-1 text-[11px] font-mono font-semibold" style={{ color }}>
                      <span>{cluster.confidence_pct}%</span>
                      <span className="text-gray-500 text-[9px]">CONF</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-[#141520] px-1.5 py-0.5 rounded border border-[#202132]">
                      <span>Unmatched</span>
                    </div>
                  )}
                </div>

                {/* Aliases List Pills */}
                <div className="flex flex-wrap gap-1">
                  {cluster.aliases.map((aid) => (
                    <span
                      key={aid}
                      className="px-1.5 py-0.5 rounded bg-[#181928] border border-[#26273e] text-gray-300 font-mono text-[10px] font-medium"
                    >
                      {aid}
                    </span>
                  ))}
                </div>

                {/* Footer Count */}
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-0.5 border-t border-[#1b1c2b]">
                  <span>{cluster.alias_count} {isMulti ? 'Correlated Aliases' : 'Singleton'}</span>
                  {isMulti ? (
                    <span className="text-cyan-400/90 font-semibold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Matched
                    </span>
                  ) : (
                    <span className="text-gray-500 text-[10px]">No correlation</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
