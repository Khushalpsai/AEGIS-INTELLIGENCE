import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, CheckCircle2, AlertTriangle, GitCommit, Fingerprint, BarChart2 } from 'lucide-react';
import AliasDetail from './AliasDetail';
import { fetchExplanation } from '../api/client';

export default function EvidencePanel({
  isOpen,
  mode = 'node', // 'node' | 'edge'
  selectedNodeData = null,
  selectedNodeResolution = null,
  selectedEdgeData = null,
  onClose,
  onSelectAlias
}) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edge' && selectedEdgeData) {
      setLoading(true);
      const aliasA = selectedEdgeData.source?.id || selectedEdgeData.source;
      const aliasB = selectedEdgeData.target?.id || selectedEdgeData.target;
      fetchExplanation(aliasA, aliasB).then(data => {
        setExplanation(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setExplanation(null);
    }
  }, [mode, selectedEdgeData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-[#0c0c14]/95 backdrop-blur-xl border-l border-[#1e1e2f] z-50 shadow-2xl flex flex-col"
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-[#1e1e2f] flex items-center justify-between bg-[#10101a]">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-200">
              {mode === 'edge' ? 'Pairwise Evidence Analysis' : 'Threat Actor Alias Dossier'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#1f1f30] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {mode === 'edge' && selectedEdgeData ? (
            <div className="space-y-6">
              {loading || !explanation ? (
                <div className="flex flex-col items-center justify-center py-20 text-cyan-500 animate-pulse">
                  <Fingerprint className="w-8 h-8 mb-4" />
                  <span className="font-mono text-sm">Analyzing correlation...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pairwise Header */}
                  <div className="bg-[#0f1019] border border-[#1e1e2f] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-gray-400 uppercase">Correlated Pair</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        explanation.overall_confidence >= 0.8 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' :
                        explanation.overall_confidence >= 0.65 ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' :
                        explanation.overall_confidence >= 0.4 ? 'text-amber-400 bg-amber-950/60 border-amber-800/40' :
                        'text-rose-400 bg-rose-950/60 border-rose-800/40'
                      }`}>
                        {explanation.classification.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2">
                      <div className="flex-1 text-center bg-[#151624] p-2.5 rounded-lg border border-[#232338]">
                        <span className="font-mono text-sm font-bold text-cyan-300 block">
                          {explanation.alias_a}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">Alias A</span>
                      </div>
                      <div className="font-mono text-xs text-gray-500 font-bold px-1">⟷</div>
                      <div className="flex-1 text-center bg-[#151624] p-2.5 rounded-lg border border-[#232338]">
                        <span className="font-mono text-sm font-bold text-cyan-300 block">
                          {explanation.alias_b}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">Alias B</span>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-400">Overall Linkage Confidence:</span>
                        <span className="font-bold text-white text-sm">
                          {(explanation.overall_confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#1b1c2b] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${explanation.overall_confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signal Breakdown */}
                  <div>
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-[#1e1e2f] pb-2 mb-3 flex items-center gap-2">
                      <BarChart2 className="w-3.5 h-3.5 text-cyan-400" /> Signal Breakdown
                    </h3>
                    <div className="space-y-3 bg-[#0f1019] border border-[#1e1e2f] p-4 rounded-xl">
                      {Object.entries(explanation.signals).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-300 capitalize">{key} Similarity</span>
                            <span className="font-bold text-cyan-400">{(value * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#1b1c2b] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${value * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Positive Evidence */}
                  <div>
                    <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono border-b border-[#1e1e2f] pb-2 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Supporting Evidence
                    </h3>
                    <div className="space-y-2">
                      {explanation.supporting_evidence.map((text, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-gray-300 bg-[#0a1510] border border-emerald-900/30 p-2.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contradictory Evidence */}
                  <div>
                    <h3 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono border-b border-[#1e1e2f] pb-2 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Contradictory Evidence
                    </h3>
                    <div className="space-y-2">
                      {explanation.contradictory_evidence.map((text, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-gray-300 bg-[#15100a] border border-amber-900/30 p-2.5 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pairwise Comparison */}
                  <div>
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-[#1e1e2f] pb-2 mb-3">
                      Pairwise Comparison
                    </h3>
                    <div className="bg-[#0f1019] border border-[#1e1e2f] rounded-xl overflow-hidden text-xs font-mono">
                      <div className="flex bg-[#151624] border-b border-[#1e1e2f] p-2 text-gray-400 font-bold">
                        <div className="flex-1">Metric</div>
                        <div className="w-24 text-center truncate">{explanation.alias_a}</div>
                        <div className="w-24 text-center truncate">{explanation.alias_b}</div>
                      </div>
                      <div className="flex p-2 border-b border-[#1e1e2f] text-gray-300">
                        <div className="flex-1">Avg Sentence Len</div>
                        <div className="w-24 text-center">{explanation.pairwise_stats['Alias A'].avg_sentence_length}</div>
                        <div className="w-24 text-center">{explanation.pairwise_stats['Alias B'].avg_sentence_length}</div>
                      </div>
                      <div className="flex p-2 border-b border-[#1e1e2f] text-gray-300">
                        <div className="flex-1">Post Frequency</div>
                        <div className="w-24 text-center">{explanation.pairwise_stats['Alias A'].post_count}</div>
                        <div className="w-24 text-center">{explanation.pairwise_stats['Alias B'].post_count}</div>
                      </div>
                      <div className="flex p-2 text-gray-300">
                        <div className="flex-1">Active Window</div>
                        <div className="w-24 text-center text-[9px] flex items-center justify-center">{explanation.pairwise_stats['Alias A'].active_window}</div>
                        <div className="w-24 text-center text-[9px] flex items-center justify-center">{explanation.pairwise_stats['Alias B'].active_window}</div>
                      </div>
                    </div>
                  </div>

                  {/* Shared Linguistic Evidence */}
                  {explanation.shared_patterns && explanation.shared_patterns.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono border-b border-[#1e1e2f] pb-2 mb-3">
                        Shared Lexical Patterns
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {explanation.shared_patterns.map((phrase, idx) => (
                          <span key={idx} className="px-2 py-1 rounded bg-[#161726] border border-[#282942] text-gray-200 font-mono text-xs">
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Explanation Summary */}
                  <div className="mt-6 p-4 bg-[#10101a] border border-cyan-900/50 rounded-xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {explanation.summary}
                    </p>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <AliasDetail
              alias={selectedNodeData}
              resolution={selectedNodeResolution}
              onSelectMatch={onSelectAlias}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
