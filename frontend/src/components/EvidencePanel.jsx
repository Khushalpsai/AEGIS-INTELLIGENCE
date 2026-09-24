import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint } from 'lucide-react';
import AliasDetail from './AliasDetail';
import { fetchExplanation } from '../api/client';

const SIGNAL_COLORS = ['#00d4aa','#38bdf8','#a78bfa','#fbbf24','#fb923c'];

function confLabel(conf) {
  if (conf >= 0.8)  return { text: 'HIGH CONFIDENCE',  color: '#00d4aa' };
  if (conf >= 0.65) return { text: 'PROBABLE MATCH',   color: '#38bdf8' };
  if (conf >= 0.4)  return { text: 'POSSIBLE MATCH',   color: '#fbbf24' };
  return                   { text: 'WEAK SIGNAL',      color: '#f43f5e' };
}

function Bar({ label, value, color }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="space-y-1 py-1.5 border-b border-[#1e252e]">
      <div className="flex justify-between">
        <span className="font-mono text-[10px] text-[#5a6a7a] capitalize">{label}</span>
        <span className="font-mono text-[10px] font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-px bg-[#1e252e] relative">
        <div className="h-px bar-fill absolute left-0 top-0" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Section({ label, accent = '#5a6a7a', children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3 flex-shrink-0" style={{ backgroundColor: accent }} />
        <span className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: accent }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function EvidencePanel({ isOpen, mode = 'node', selectedNodeData, selectedNodeResolution, selectedEdgeData, onClose, onSelectAlias }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edge' && selectedEdgeData) {
      setLoading(true); setExplanation(null);
      const a = selectedEdgeData.source?.id || selectedEdgeData.source;
      const b = selectedEdgeData.target?.id || selectedEdgeData.target;
      fetchExplanation(a, b)
        .then(d => { setExplanation(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else setExplanation(null);
  }, [mode, selectedEdgeData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ep"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
        className="absolute top-0 right-0 h-full w-[380px] max-w-[90vw] bg-[#0e1012] border-l border-[#1e252e] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e252e] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#00d4aa]" />
            <div>
              <div className="font-mono text-[11px] font-bold text-[#cdd6e0] uppercase tracking-wider">
                {mode === 'edge' ? 'LINK FORENSICS' : 'ALIAS DOSSIER'}
              </div>
              <div className="font-mono text-[9px] text-[#2a3340]">
                {mode === 'edge' ? 'Pairwise evidence analysis' : 'Threat actor profile'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center border border-[#1e252e] hover:border-[#2a3340] text-[#5a6a7a] hover:text-[#cdd6e0] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">

          {mode === 'node' && (
            <AliasDetail alias={selectedNodeData} resolution={selectedNodeResolution} onSelectMatch={onSelectAlias} />
          )}

          {mode === 'edge' && (
            <>
              {loading || !explanation ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#00d4aa]/50">
                  <Fingerprint className="w-7 h-7 animate-pulse" />
                  <span className="font-mono text-[10px]">ANALYZING VECTORS...</span>
                </div>
              ) : (
                <div>
                  {/* Pair + confidence */}
                  <Section label="Correlated Pair" accent="#00d4aa">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 border border-[#1e252e] p-2 text-center">
                        <div className="font-mono text-sm font-bold text-[#00d4aa]">{explanation.alias_a}</div>
                        <div className="font-mono text-[9px] text-[#5a6a7a]">ALIAS A</div>
                      </div>
                      <div className="font-mono text-xs text-[#2a3340]">⟷</div>
                      <div className="flex-1 border border-[#1e252e] p-2 text-center">
                        <div className="font-mono text-sm font-bold text-[#00d4aa]">{explanation.alias_b}</div>
                        <div className="font-mono text-[9px] text-[#5a6a7a]">ALIAS B</div>
                      </div>
                    </div>

                    {/* Classification + confidence */}
                    {(() => {
                      const cl = confLabel(explanation.overall_confidence);
                      const pct = (explanation.overall_confidence * 100).toFixed(1);
                      return (
                        <div className="border border-[#1e252e] p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold" style={{ color: cl.color }}>{cl.text}</span>
                            <span className="font-mono text-[11px] font-bold text-[#cdd6e0]">{pct}%</span>
                          </div>
                          <div className="h-px bg-[#1e252e] relative">
                            <div className="h-px bar-fill absolute left-0 top-0" style={{ width: `${pct}%`, backgroundColor: cl.color }} />
                          </div>
                          <div className="font-mono text-[9px] text-[#5a6a7a]">{explanation.classification?.toUpperCase()}</div>
                        </div>
                      );
                    })()}
                  </Section>

                  {/* Signal breakdown */}
                  <Section label="Signal Breakdown" accent="#38bdf8">
                    {Object.entries(explanation.signals).map(([key, val], i) => (
                      <Bar key={key} label={`${key} similarity`} value={val} color={SIGNAL_COLORS[i % SIGNAL_COLORS.length]} />
                    ))}
                  </Section>

                  {/* Supporting */}
                  <Section label="Supporting Evidence" accent="#00d4aa">
                    {explanation.supporting_evidence.map((text, i) => (
                      <div key={i} className="flex gap-2 border-b border-[#1e252e] py-1.5">
                        <span className="text-[#00d4aa] text-[10px] mt-0.5 flex-shrink-0">✓</span>
                        <span className="font-mono text-[10px] text-[#8899aa] leading-relaxed">{text}</span>
                      </div>
                    ))}
                  </Section>

                  {/* Contradictory */}
                  <Section label="Contradictory Evidence" accent="#fbbf24">
                    {explanation.contradictory_evidence.map((text, i) => (
                      <div key={i} className="flex gap-2 border-b border-[#1e252e] py-1.5">
                        <span className="text-[#fbbf24] text-[10px] mt-0.5 flex-shrink-0">!</span>
                        <span className="font-mono text-[10px] text-[#8899aa] leading-relaxed">{text}</span>
                      </div>
                    ))}
                  </Section>

                  {/* Pairwise stats */}
                  <Section label="Pairwise Stats" accent="#5a6a7a">
                    <table className="w-full font-mono text-[10px]">
                      <thead>
                        <tr className="border-b border-[#1e252e]">
                          <th className="text-left text-[#2a3340] py-1 font-normal">METRIC</th>
                          <th className="text-center text-[#00d4aa]/60 py-1 font-normal">{explanation.alias_a}</th>
                          <th className="text-center text-[#00d4aa]/60 py-1 font-normal">{explanation.alias_b}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Sent Len', 'avg_sentence_length'],
                          ['Posts',    'post_count'],
                          ['Window',  'active_window'],
                        ].map(([lbl, key]) => (
                          <tr key={key} className="border-b border-[#1e252e]">
                            <td className="text-[#5a6a7a] py-1.5">{lbl}</td>
                            <td className="text-center text-[#8899aa] py-1.5">{explanation.pairwise_stats?.['Alias A']?.[key] ?? '—'}</td>
                            <td className="text-center text-[#8899aa] py-1.5">{explanation.pairwise_stats?.['Alias B']?.[key] ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Section>

                  {/* Shared patterns */}
                  {explanation.shared_patterns?.length > 0 && (
                    <Section label="Shared Lexical Patterns" accent="#5a6a7a">
                      <div className="flex flex-wrap gap-1">
                        {explanation.shared_patterns.map((p, i) => (
                          <span key={i} className="font-mono text-[9px] text-[#5a6a7a] border border-[#1e252e] px-1.5 py-0.5 bg-[#0a0b0d]">
                            "{p}"
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Summary */}
                  <div className="border-l-2 border-[#00d4aa]/30 pl-3 mt-2">
                    <p className="font-mono text-[10px] text-[#5a6a7a] leading-relaxed">{explanation.summary}</p>
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
