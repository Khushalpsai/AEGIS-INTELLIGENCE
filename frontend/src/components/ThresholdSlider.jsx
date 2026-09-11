import React, { useState, useEffect } from 'react';

const PRESETS = [
  { val: 0.50, label: 'Loose'   },
  { val: 0.55, label: 'Optimal' },
  { val: 0.70, label: 'Strict'  },
  { val: 0.85, label: 'High'    },
];

export default function ThresholdSlider({ threshold, onChange, totalEdges, totalClusters }) {
  const [localVal, setLocalVal] = useState(threshold);

  useEffect(() => { setLocalVal(threshold); }, [threshold]);

  const handleChange = (e) => {
    const val = parseFloat(e.target.value);
    setLocalVal(val);
    onChange(val);
  };

  const setPreset = (val) => {
    setLocalVal(val);
    onChange(val);
  };

  // Map 0.30–0.95 to a fill percentage for the track
  const pct = ((localVal - 0.30) / (0.95 - 0.30)) * 100;

  return (
    <div className="space-y-3">
      {/* Value readout */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#5a5568] uppercase tracking-widest">
          SIM ≥
        </span>
        <span className="font-mono text-lg font-bold text-amber-400 tabular-nums leading-none">
          {localVal.toFixed(2)}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-6 flex items-center">
        {/* Filled track */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#2a2535] w-full" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-amber-500 transition-all duration-75 pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min="0.30"
          max="0.95"
          step="0.01"
          value={localVal}
          onChange={handleChange}
          className="relative w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-amber-400
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-[#0e0c0f]
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(245,158,11,0.5)]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-amber-400
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-[#0e0c0f]
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-1">
        {PRESETS.map(({ val, label }) => {
          const active = Math.abs(localVal - val) < 0.015;
          return (
            <button
              key={val}
              onClick={() => setPreset(val)}
              className={`py-1 rounded text-[10px] font-mono font-semibold transition-all border ${
                active
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-[#141218] border-[#2a2535] text-[#5a5568] hover:border-[#3d3850] hover:text-[#9d98aa]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Live readout */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2a2535]">
        <div className="flex flex-col gap-0.5 bg-[#141218] border border-[#2a2535] rounded-lg px-2.5 py-1.5">
          <span className="font-mono text-[10px] text-[#5a5568]">Edges</span>
          <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">{totalEdges}</span>
        </div>
        <div className="flex flex-col gap-0.5 bg-[#141218] border border-[#2a2535] rounded-lg px-2.5 py-1.5">
          <span className="font-mono text-[10px] text-[#5a5568]">Clusters</span>
          <span className="font-mono font-bold text-violet-400 text-sm tabular-nums">{totalClusters}</span>
        </div>
      </div>
    </div>
  );
}
