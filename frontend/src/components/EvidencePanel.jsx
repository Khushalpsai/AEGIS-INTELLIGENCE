import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Fingerprint,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Hash,
  FileText,
} from 'lucide-react';
import AliasDetail from './AliasDetail';
import { fetchExplanation } from '../api/client';

// ── Reusable bar row ─────────────────────────────────
function SignalBar({ label, value, color = '#f59e0b' }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[11px] font-mono">
        <span className="text-[#9d98aa] capitalize">{label}</span>
        <span className="font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-[#1a1720] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bar-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Confidence color helper ──────────────────────────
function classColor(conf) {
  if (conf >= 0.8)  return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  if (conf >= 0.65) return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   };
  if (conf >= 0.4)  return { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30'  };
  return               { text: 'text-rose-400',   bg: 'bg-rose-500/10',    border: 'border-rose-500/30'    };
}

// ── Section heading ──────────────────────────────────
function SectionHead({ icon: Icon, label, color = 'text-[#9d98aa]' }) {
  return (
    <div className={`flex items-center gap-2 pb-2 border-b border-[#2a2535] mb-3 ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function EvidencePanel({
  isOpen,
  mode = 'node',
  selectedNodeData = null,
  selectedNodeResolution = null,
  selectedEdgeData = null,
  onClose,
  onSelectAlias,
}) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edge' && selectedEdgeData) {
      setLoading(true);
      setExplanation(null);
      const aliasA = selectedEdgeData.source?.id || selectedEdgeData.source;
      const aliasB = selectedEdgeData.target?.id || selectedEdgeData.target;
      fetchExplanation(aliasA, aliasB)
        .then(data => { setExplanation(data); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setExplanation(null);
    }
  }, [mode, selectedEdgeData]);

  if (!isOpen) return null;

  const SIGNAL_COLORS = ['#f59e0b', '#a78bfa', '#10b981', '#38bdf8', '#fb923c'];

  return (
    <AnimatePresence>
      <motion.div
        key="evidence-panel"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-[#0e0c0f]/97 backdrop-blur-xl border-l border-[#2a2535] z-50 flex flex-col"
      >
        {/* ── Panel header ──────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2535] bg-[#141218] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#eae6f0]">
                {mode === 'edge' ? 'Pairwise Evidence' : 'Alias Dossier'}
              </h2>
              <p className="font-mono text-[10px] text-[#5a5568]">
                {mode === 'edge' ? 'Forensic link analysis' : 'Threat actor profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a1720] hover:bg-[#201d28] border border-[#2a2535] hover:border-[#3d3850] text-[#9d98aa] hover:text-[#eae6f0] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Panel body ────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {mode === 'node' && (
            <AliasDetail
              alias={selectedNodeData}
              resolution={selectedNodeResolution}
              onSelectMatch={onSelectAlias}
            />
          )}

          {mode === 'edge' && (
            <>
              {loading || !explanation ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-amber-500">
                  <Fingerprint className="w-8 h-8 animate-pulse" />
                  <span className="font-mono text-xs">Analyzing correlation vectors...</span>
                </div>
              ) : (
                <div className="space-y-5">

                  {/* ── Pair header ─────────────────── */}
                  <div className="bg-[#141218] border border-[#2a2535] rounded-xl p-4 space-y-3">
                    {/* Classification badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#5a5568] uppercase tracking-widest">
                        Correlated Pair
                      </span>
                      {(() => {
                        const c = classColor(explanation.overall_confidence);
                        return (
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${c.text} ${c.bg} ${c.border}`}>
                            {explanation.classification?.toUpperCase()}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Alias A ⟷ Alias B */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-center bg-[#0e0c0f] border border-[#2a2535] rounded-lg py-2.5 px-2">
                        <span className="font-mono text-sm font-bold text-amber-400 block">{explanation.alias_a}</span>
                        <span className="font-mono text-[10px] text-[#5a5568]">Alias A</span>
                      </div>
                      <span className="font-mono text-xs text-[#5a5568] font-bold flex-shrink-0">⟷</span>
                      <div className="flex-1 text-center bg-[#0e0c0f] border border-[#2a2535] rounded-lg py-2.5 px-2">
                        <span className="font-mono text-sm font-bold text-amber-400 block">{explanation.alias_b}</span>
                        <span className="font-mono text-[10px] text-[#5a5568]">Alias B</span>
                      </div>
                    </div>

                    {/* Overall confidence bar */}
                    <div className="space-y-1.5 pt-1 border-t border-[#2a2535]">
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="text-[#9d98aa]">Overall Linkage Confidence</span>
                        <span className="font-bold text-[#eae6f0] text-sm">
                          {(explanation.overall_confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#1a1720] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bar-fill"
                          style={{
                            width: `${explanation.overall_confidence * 100}%`,
                            background: 'linear-gradient(90deg, #b45309, #f59e0b)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Signal breakdown ─────────────── */}
                  <div>
                    <SectionHead icon={BarChart2} label="Signal Breakdown" />
                    <div className="bg-[#141218] border border-[#2a2535] rounded-xl p-4 space-y-3">
                      {Object.entries(explanation.signals).map(([key, value], i) => (
                        <SignalBar
                          key={key}
                          label={`${key} similarity`}
                          value={value}
                          color={SIGNAL_COLORS[i % SIGNAL_COLORS.length]}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ── Supporting evidence ──────────── */}
                  <div>
                    <SectionHead icon={CheckCircle2} label="Supporting Evidence" color="text-emerald-400" />
                    <div className="space-y-1.5">
                      {explanation.supporting_evidence.map((text, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2.5 text-xs text-[#9d98aa] bg-emerald-950/20 border border-emerald-500/15 p-2.5 rounded-lg"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Contradictory evidence ───────── */}
                  <div>
                    <SectionHead icon={AlertTriangle} label="Contradictory Evidence" color="text-amber-400" />
                    <div className="space-y-1.5">
                      {explanation.contradictory_evidence.map((text, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2.5 text-xs text-[#9d98aa] bg-amber-950/20 border border-amber-500/15 p-2.5 rounded-lg"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Pairwise stats table ─────────── */}
                  <div>
                    <SectionHead icon={FileText} label="Pairwise Comparison" />
                    <div className="bg-[#141218] border border-[#2a2535] rounded-xl overflow-hidden font-mono text-[11px]">
                      {/* Head */}
                      <div className="flex bg-[#1a1720] border-b border-[#2a2535] px-3 py-2 text-[#5a5568] font-bold">
                        <div className="flex-1">Metric</div>
                        <div className="w-20 text-center truncate text-amber-400/70">{explanation.alias_a}</div>
                        <div className="w-20 text-center truncate text-amber-400/70">{explanation.alias_b}</div>
                      </div>
                      {[
                        ['Avg Sentence Len', 'avg_sentence_length'],
                        ['Post Count',       'post_count'],
                        ['Active Window',    'active_window'],
                      ].map(([label, key], i) => (
                        <div
                          key={key}
                          className={`flex px-3 py-2 text-[#9d98aa] ${i < 2 ? 'border-b border-[#2a2535]' : ''}`}
                        >
                          <div className="flex-1">{label}</div>
                          <div className="w-20 text-center text-[10px]">
                            {explanation.pairwise_stats?.['Alias A']?.[key] ?? '—'}
                          </div>
                          <div className="w-20 text-center text-[10px]">
                            {explanation.pairwise_stats?.['Alias B']?.[key] ?? '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Shared patterns ──────────────── */}
                  {explanation.shared_patterns?.length > 0 && (
                    <div>
                      <SectionHead icon={Hash} label="Shared Lexical Patterns" />
                      <div className="flex flex-wrap gap-1.5">
                        {explanation.shared_patterns.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-lg bg-[#1a1720] border border-[#2a2535] text-[#9d98aa] font-mono text-[11px]"
                          >
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Summary ──────────────────────── */}
                  <div className="relative bg-[#141218] border border-amber-500/20 rounded-xl p-4 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 rounded-l-xl" />
                    <p className="text-xs text-[#9d98aa] leading-relaxed pl-1">{explanation.summary}</p>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
