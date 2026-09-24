import React from 'react';

const COLORS = [
  '#00d4aa','#38bdf8','#a78bfa','#f43f5e',
  '#fbbf24','#fb923c','#34d399','#e879f9',
];

export default function ClusterCards({ clusters = [], selectedClusterId = null, onSelectCluster }) {
  if (!clusters.length) return null;

  return (
    <div className="flex-shrink-0 bg-[#0e1012] border-t border-[#1e252e]">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-[#1e252e]">
        <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase">
          Identity Clusters
        </span>
        <span className="font-mono text-[9px] text-[#2a3340]">{clusters.length} resolved</span>
        <span className="font-mono text-[9px] text-[#2a3340] ml-auto">← scroll →</span>
      </div>

      {/* Scrollable strip */}
      <div className="flex gap-0 overflow-x-auto">
        {clusters.map((cluster, idx) => {
          const isSelected = selectedClusterId === cluster.cluster_id;
          const color = COLORS[idx % COLORS.length];
          const isMulti = cluster.alias_count > 1;

          return (
            <button
              key={cluster.cluster_id}
              onClick={() => onSelectCluster?.(isSelected ? null : cluster.cluster_id)}
              className={`flex-shrink-0 text-left px-3 py-2 border-r border-[#1e252e] transition-colors min-w-[160px] ${
                isSelected ? 'bg-[#12151a]' : 'hover:bg-[#12151a]'
              }`}
              style={{ borderTop: isSelected ? `1px solid ${color}` : '1px solid transparent' }}
            >
              {/* ID row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[10px] font-bold text-[#cdd6e0]">{cluster.cluster_id}</span>
                </div>
                {isMulti && cluster.confidence_pct != null && (
                  <span className="font-mono text-[9px] font-bold" style={{ color }}>{cluster.confidence_pct}%</span>
                )}
              </div>

              {/* Alias IDs */}
              <div className="flex flex-wrap gap-1 mb-1.5">
                {cluster.aliases.map(aid => (
                  <span key={aid} className="font-mono text-[9px] text-[#5a6a7a] bg-[#0a0b0d] px-1 border border-[#1e252e]">
                    {aid}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="font-mono text-[9px] text-[#2a3340]">
                {isMulti
                  ? <span style={{ color: `${color}99` }}>● {cluster.alias_count} aliases matched</span>
                  : <span>— singleton</span>
                }
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
