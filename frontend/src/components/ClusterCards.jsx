import React from 'react';
import { Layers, Sparkles, Minus } from 'lucide-react';

const CLUSTER_COLORS = [
  '#f59e0b', // Amber
  '#a78bfa', // Violet
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#38bdf8', // Sky
  '#fb923c', // Orange
  '#34d399', // Green
  '#e879f9', // Fuchsia
];

export default function ClusterCards({ clusters = [], selectedClusterId = null, onSelectCluster }) {
  if (!clusters || clusters.length === 0) return null;

  return (
    <div className="flex-shrink-0 bg-[#0e0c0f] border-t border-[#2a2535]">
      {/* Strip header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#2a2535]">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
            Identity Clusters
          </span>
          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            {clusters.length}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#5a5568]">
          Click to highlight in graph
        </span>
      </div>

      {/* Scrollable row */}
      <div className="flex gap-2.5 overflow-x-auto px-4 py-2.5">
        {clusters.map((cluster, idx) => {
          const isSelected = selectedClusterId === cluster.cluster_id;
          const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
          const isMulti = cluster.alias_count > 1;

          return (
            <button
              key={cluster.cluster_id}
              onClick={() => onSelectCluster && onSelectCluster(isSelected ? null : cluster.cluster_id)}
              className={`flex-shrink-0 w-[220px] text-left p-3 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'bg-[#1a1720] shadow-lg'
                  : 'bg-[#141218] hover:bg-[#1a1720] border-[#2a2535] hover:border-[#3d3850]'
              }`}
              style={{
                borderColor: isSelected ? color : undefined,
                boxShadow: isSelected ? `0 0 16px -4px ${color}55` : undefined,
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-mono text-xs font-bold text-[#eae6f0]">
                    {cluster.cluster_id}
                  </span>
                </div>

                {isMulti && cluster.confidence_pct != null ? (
                  <span className="font-mono text-[10px] font-bold" style={{ color }}>
                    {cluster.confidence_pct}%
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[#5a5568]">—</span>
                )}
              </div>

              {/* Alias pills */}
              <div className="flex flex-wrap gap-1 mb-2">
                {cluster.aliases.map(aid => (
                  <span
                    key={aid}
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#201d28] border border-[#2a2535] text-[#9d98aa]"
                  >
                    {aid}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1.5 border-t border-[#2a2535]">
                <span className="font-mono text-[10px] text-[#5a5568]">
                  {cluster.alias_count} {isMulti ? 'aliases' : 'singleton'}
                </span>
                {isMulti ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] font-semibold" style={{ color }}>
                    <Sparkles className="w-2.5 h-2.5" /> Matched
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-[#5a5568]">
                    <Minus className="w-2.5 h-2.5" /> No link
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
