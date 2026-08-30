import React, { useState, useEffect } from 'react';
import { Sliders, ShieldAlert, Cpu } from 'lucide-react';

export default function ThresholdSlider({ threshold, onChange, totalEdges, totalClusters }) {
  const [localVal, setLocalVal] = useState(threshold);

  useEffect(() => {
    setLocalVal(threshold);
  }, [threshold]);

  const handleChange = (e) => {
    const val = parseFloat(e.target.value);
    setLocalVal(val);
    onChange(val);
  };

  const setPreset = (val) => {
    setLocalVal(val);
    onChange(val);
  };

  return (
    <div className="bg-[#101018]/90 backdrop-blur-md border border-[#1e1e2f] rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Resolution Threshold
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#161622] px-2.5 py-1 rounded-lg border border-[#2a2a40]">
          <span className="text-[10px] text-gray-400 font-mono">SIM &ge;</span>
          <span className="font-mono text-cyan-400 font-bold text-sm">
            {localVal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Main Slider Input */}
      <div className="relative py-2">
        <input
          type="range"
          min="0.30"
          max="0.95"
          step="0.01"
          value={localVal}
          onChange={handleChange}
          className="w-full h-1.5 bg-[#1e1e30] rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
        />
      </div>

      {/* Preset Ticks & Helper Info */}
      <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-3 px-0.5">
        <button
          onClick={() => setPreset(0.50)}
          className={`hover:text-cyan-400 transition-colors ${Math.abs(localVal - 0.50) < 0.02 ? 'text-cyan-400 font-bold' : ''}`}
        >
          0.50 (Loose)
        </button>
        <button
          onClick={() => setPreset(0.62)}
          className={`hover:text-cyan-400 transition-colors ${Math.abs(localVal - 0.62) < 0.02 ? 'text-cyan-400 font-bold underline' : ''}`}
        >
          0.62 (Optimal)
        </button>
        <button
          onClick={() => setPreset(0.75)}
          className={`hover:text-cyan-400 transition-colors ${Math.abs(localVal - 0.75) < 0.02 ? 'text-cyan-400 font-bold' : ''}`}
        >
          0.75 (Strict)
        </button>
        <button
          onClick={() => setPreset(0.85)}
          className={`hover:text-cyan-400 transition-colors ${Math.abs(localVal - 0.85) < 0.02 ? 'text-cyan-400 font-bold' : ''}`}
        >
          0.85 (High)
        </button>
      </div>

      {/* Live Impact Readout */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e1e2f] text-xs">
        <div className="bg-[#0c0c14] px-2.5 py-1.5 rounded border border-[#1a1a28] flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">Filtered Edges:</span>
          <span className="font-mono font-semibold text-cyan-300">{totalEdges}</span>
        </div>
        <div className="bg-[#0c0c14] px-2.5 py-1.5 rounded border border-[#1a1a28] flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">Active Clusters:</span>
          <span className="font-mono font-semibold text-purple-300">{totalClusters}</span>
        </div>
      </div>
    </div>
  );
}
