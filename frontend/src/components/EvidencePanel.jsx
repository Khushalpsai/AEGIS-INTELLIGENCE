import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, CheckCircle2, AlertTriangle, GitCommit, Fingerprint, BarChart2 } from 'lucide-react';
import AliasDetail from './AliasDetail';

export default function EvidencePanel({
  isOpen,
  mode = 'node', // 'node' | 'edge'
  selectedNodeData = null,
  selectedNodeResolution = null,
  selectedEdgeData = null,
  onClose,
  onSelectAlias
}) {
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
              {/* Pairwise Header */}
              <div className="bg-[#0f1019] border border-[#1e1e2f] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400 uppercase">Correlated Pair</span>
                  <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    MATCH CONFIRMED
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 py-2">
                  <div className="flex-1 text-center bg-[#151624] p-2.5 rounded-lg border border-[#232338]">
                    <span className="font-mono text-sm font-bold text-cyan-300 block">
                      {selectedEdgeData.source?.id || selectedEdgeData.source}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Alias Source</span>
                  </div>

                  <div className="font-mono text-xs text-gray-500 font-bold px-1">⟷</div>

                  <div className="flex-1 text-center bg-[#151624] p-2.5 rounded-lg border border-[#232338]">
                    <span className="font-mono text-sm font-bold text-cyan-300 block">
                      {selectedEdgeData.target?.id || selectedEdgeData.target}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Alias Target</span>
                  </div>
                </div>

                {/* Score Meter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-400">Stylometric Similarity:</span>
                    <span className="font-bold text-cyan-400 text-sm">
                      {((selectedEdgeData.score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1b1c2b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedEdgeData.score || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explainable Evidence Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Stylometric Attribution Signals
                </div>

                {/* Top Drivers */}
                <div className="bg-[#0f1019] border border-[#1e1e2f] p-3.5 rounded-xl space-y-2">
                  <span className="text-xs text-gray-400 font-medium">Top Score Drivers:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedEdgeData.evidence?.top_score_drivers || ['vocabulary overlap', 'sentence length cadence']).map((driver, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-700/50 text-cyan-300 font-mono text-[11px] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Shared Phrases / N-Grams */}
                <div className="bg-[#0f1019] border border-[#1e1e2f] p-3.5 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Shared Lexical Collocations (N-grams):</span>
                    <span className="font-mono text-cyan-400 text-[11px]">
                      {selectedEdgeData.evidence?.shared_phrases?.length || 0} detected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(selectedEdgeData.evidence?.shared_phrases || []).map((phrase, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-[#161726] border border-[#282942] text-gray-200 font-mono text-xs"
                      >
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cadence and Syntax Markers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0f1019] border border-[#1e1e2f] p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                      Sentence Length Delta
                    </span>
                    <span className="text-base font-mono font-bold text-gray-200">
                      &plusmn;{selectedEdgeData.evidence?.sentence_length_delta || '2.1'} wds
                    </span>
                    <div className="text-[9px] text-gray-500 mt-1">High structural cadence</div>
                  </div>

                  <div className="bg-[#0f1019] border border-[#1e1e2f] p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                      Punctuation Similarity
                    </span>
                    <span className="text-base font-mono font-bold text-cyan-400">
                      {((selectedEdgeData.evidence?.punctuation_similarity || 0.85) * 100).toFixed(0)}%
                    </span>
                    <div className="text-[9px] text-gray-500 mt-1">Matched syntax profile</div>
                  </div>
                </div>
              </div>
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
