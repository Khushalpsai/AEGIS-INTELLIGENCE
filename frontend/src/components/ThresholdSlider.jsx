import React, { useState, useEffect } from 'react';

const PRESETS = [
  { val: 0.50, label: 'LOOSE' },
  { val: 0.55, label: 'OPT'   },
  { val: 0.70, label: 'STRICT'},
  { val: 0.85, label: 'HIGH'  },
];

export default function ThresholdSlider({ threshold, onChange, totalEdges, totalClusters }) {
  const [local, setLocal] = useState(threshold);
  useEffect(() => setLocal(threshold), [threshold]);

  const pct = ((local - 0.30) / (0.95 - 0.30)) * 100;

  return (
    <div className="space-y-2.5">
      {/* Value */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#5a6a7a]">SIM ≥</span>
        <span className="font-mono text-base font-bold text-[#00d4aa] tabular-nums">{local.toFixed(2)}</span>
      </div>

      {/* Track */}
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-px bg-[#1e252e]" />
        <div className="absolute h-px bg-[#00d4aa] transition-all duration-75 pointer-events-none" style={{ width: `${pct}%` }} />
        <input
          type="range" min="0.30" max="0.95" step="0.01" value={local}
          onChange={e => { const v = parseFloat(e.target.value); setLocal(v); onChange(v); }}
          className="relative w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:bg-[#00d4aa] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:bg-[#00d4aa] [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-1">
        {PRESETS.map(({ val, label }) => {
          const active = Math.abs(local - val) < 0.015;
          return (
            <button
              key={val}
              onClick={() => { setLocal(val); onChange(val); }}
              className={`font-mono text-[9px] py-1 transition-all border ${
                active
                  ? 'border-[#00d4aa]/60 text-[#00d4aa] bg-[#00d4aa]/8'
                  : 'border-[#1e252e] text-[#5a6a7a] hover:border-[#2a3340] hover:text-[#8899aa]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1e252e]">
        <div>
          <div className="font-mono text-[9px] text-[#5a6a7a]">EDGES</div>
          <div className="font-mono text-sm font-bold text-[#cdd6e0] tabular-nums">{totalEdges}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] text-[#5a6a7a]">CLUSTERS</div>
          <div className="font-mono text-sm font-bold text-[#cdd6e0] tabular-nums">{totalClusters}</div>
        </div>
      </div>
    </div>
  );
}
