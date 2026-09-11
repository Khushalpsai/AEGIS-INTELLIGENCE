import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Fingerprint,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Download,
  Terminal,
  Clock,
} from 'lucide-react';
import { resolveAlias, fetchAliasDetail } from '../api/client';
import html2pdf from 'html2pdf.js';

// ── Temporal timeline ────────────────────────────────
function TemporalTimeline({ targetPosts, candidatePosts, targetId, candidateId }) {
  if (!targetPosts?.length || !candidatePosts?.length) return null;

  const allPosts = [...targetPosts, ...candidatePosts];
  const timestamps = allPosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  if (timestamps.length === 0) return null;

  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const pad = (maxTime - minTime) * 0.1 || 86400000 * 7;
  const start = minTime - pad;
  const end = maxTime + pad;
  const range = end - start;

  const getPos = ts => ((new Date(ts).getTime() - start) / range) * 100;

  const targetDates   = targetPosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const candidateDates = candidatePosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const overlapStart  = Math.max(Math.min(...targetDates), Math.min(...candidateDates));
  const overlapEnd    = Math.min(Math.max(...targetDates), Math.max(...candidateDates));
  const hasOverlap    = overlapStart <= overlapEnd;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between font-mono text-[10px] text-[#5a5568]">
        <span>{new Date(start).toLocaleDateString()}</span>
        <span>{new Date(end).toLocaleDateString()}</span>
      </div>

      <div className="relative h-14 bg-[#141218] border border-[#2a2535] rounded-lg overflow-hidden">
        {/* Overlap region */}
        {hasOverlap && (
          <div
            className="absolute top-0 bottom-0 bg-amber-500/10 border-x border-amber-500/25"
            style={{ left: `${getPos(overlapStart)}%`, width: `${getPos(overlapEnd) - getPos(overlapStart)}%` }}
          />
        )}

        {/* Centre divider */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#2a2535]" />

        {/* Target row */}
        <div className="absolute top-0 left-0 right-0 h-1/2">
          <span className="absolute left-2 top-1 font-mono text-[9px] text-amber-500/50">{targetId}</span>
          {targetPosts.map((p, i) => (
            <div
              key={`t-${i}`}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ left: `${getPos(p.timestamp)}%` }}
              title={new Date(p.timestamp).toLocaleDateString()}
            />
          ))}
        </div>

        {/* Candidate row */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2">
          <span className="absolute left-2 bottom-1 font-mono text-[9px] text-rose-500/50">{candidateId}</span>
          {candidatePosts.map((p, i) => (
            <div
              key={`c-${i}`}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-400"
              style={{ left: `${getPos(p.timestamp)}%` }}
              title={new Date(p.timestamp).toLocaleDateString()}
            />
          ))}
        </div>
      </div>

      <div className="text-center">
        {hasOverlap ? (
          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            Concurrent Activity Overlap Detected
          </span>
        ) : (
          <span className="font-mono text-[10px] text-[#9d98aa] bg-[#1a1720] border border-[#2a2535] px-2.5 py-1 rounded-lg">
            Sequential Handover — No Overlap
          </span>
        )}
      </div>
    </div>
  );
}

// ── Step pill ────────────────────────────────────────
function StepPill({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-[11px] font-bold transition-colors ${
      done  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' :
      active ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
               'border-[#2a2535] text-[#5a5568]'
    }`}>
      {done ? <CheckCircle2 className="w-3 h-3" /> : <span>{n}.</span>}
      {label}
    </div>
  );
}

// ── Metric bar ────────────────────────────────────────
function MetricBar({ label, pct, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-xs">
        <span className="text-[#9d98aa]">{label}</span>
        <span className="font-bold" style={{ color }}>{Math.max(0, Math.min(100, pct)).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-[#1a1720] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bar-fill"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────
export default function InvestigationMode({ allNodes, onExit }) {
  const [step, setStep]                       = useState(1);
  const [selectedAliasId, setSelectedAliasId] = useState(null);
  const [aliasDetail, setAliasDetail]         = useState(null);
  const [candidates, setCandidates]           = useState([]);
  const [isResolving, setIsResolving]         = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');

  const handleSelectAlias = async (nodeId) => {
    setSelectedAliasId(nodeId);
    setSelectedCandidate(null);
    setReportGenerated(false);
    setStep(2);
    setIsResolving(true);
    try {
      const [detail, resolution] = await Promise.all([
        fetchAliasDetail(nodeId),
        resolveAlias(nodeId, 0.0, true),
      ]);
      setAliasDetail(detail);
      const filtered = resolution.matches
        .filter(m => m.score > 0.15)
        .sort((a, b) => b.score - a.score);
      setCandidates(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSelectCandidate = async (candidate) => {
    setIsResolving(true);
    try {
      const detail = await fetchAliasDetail(candidate.target_alias_id);
      setSelectedCandidate({ ...candidate, detail });
      setStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setStep(5);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const opt = {
      margin:      0.5,
      filename:    `AEGIS-Report-${selectedAliasId}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0e0c0f', scrollY: 0 },
      jsPDF:       { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    try {
      await html2pdf().set(opt).from(element).save();
      setReportGenerated(false);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const filteredNodes = allNodes.filter(
    n =>
      n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-[#09080a] z-40 flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#2a2535] bg-[#0e0c0f]">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 bg-[#141218] hover:bg-[#1a1720] border border-[#2a2535] hover:border-[#3d3850] text-[#9d98aa] hover:text-[#eae6f0] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
            <FileSearch className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-[#eae6f0] uppercase tracking-wider">
              Analyst Investigation Mode
            </h2>
            <p className="font-mono text-[10px] text-[#5a5568]">
              Structured Threat Intelligence Workflow
            </p>
          </div>
        </div>

        {/* Step pills */}
        <div className="hidden md:flex items-center gap-2">
          <StepPill n="1" label="Target"     active={step === 1} done={step > 1} />
          <ChevronRight className="w-3.5 h-3.5 text-[#2a2535]" />
          <StepPill n="2" label="Candidates" active={step === 2 || step === 3} done={step > 3} />
          <ChevronRight className="w-3.5 h-3.5 text-[#2a2535]" />
          <StepPill n="3" label="Evidence"   active={step === 4} done={step > 4} />
          <ChevronRight className="w-3.5 h-3.5 text-[#2a2535]" />
          <StepPill n="4" label="Report"     active={step === 5} done={false} />
        </div>
      </div>

      {/* ── Workspace ───────────────────────────── */}
      <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">

        {/* ── Left column: target + candidates ──── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 h-full">

          {/* Target selection */}
          <div className="flex-1 flex flex-col bg-[#0e0c0f] border border-[#2a2535] rounded-xl overflow-hidden min-h-0">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#2a2535] bg-[#141218] flex-shrink-0">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono text-[9px] font-bold text-amber-400 flex-shrink-0">1</span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
                Select Target Alias
              </span>
            </div>

            <div className="p-3 border-b border-[#2a2535] flex-shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5568]" />
                <input
                  type="text"
                  placeholder="Search aliases..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141218] border border-[#2a2535] focus:border-amber-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#eae6f0] placeholder-[#5a5568] font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredNodes.map(n => {
                const isSelected = selectedAliasId === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleSelectAlias(n.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-[#141218] hover:bg-[#1a1720] border-[#2a2535] hover:border-[#3d3850]'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-amber-400">{n.id}</span>
                      <span className="font-mono text-xs text-[#5a5568] ml-1.5">@{n.username}</span>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidates */}
          <div className={`flex-1 flex flex-col bg-[#0e0c0f] border border-[#2a2535] rounded-xl overflow-hidden min-h-0 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#2a2535] bg-[#141218] flex-shrink-0">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono text-[9px] font-bold text-amber-400 flex-shrink-0">2</span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
                System Candidates
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isResolving ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-amber-500">
                  <Fingerprint className="w-7 h-7 animate-pulse" />
                  <span className="font-mono text-xs">Correlating vectors...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {candidates.map(c => {
                    const isSelected = selectedCandidate?.target_alias_id === c.target_alias_id;
                    const confColor =
                      c.confidence_pct >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
                      c.confidence_pct >= 65 ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
                                               'text-rose-400 bg-rose-500/10 border-rose-500/25';
                    return (
                      <button
                        key={c.target_alias_id}
                        onClick={() => handleSelectCandidate(c)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-[#141218] hover:bg-[#1a1720] border-[#2a2535] hover:border-[#3d3850]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono text-xs font-bold text-[#eae6f0]">
                            {c.target_alias_id}
                          </span>
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${confColor}`}>
                            {c.confidence_pct}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5a5568] font-mono">
                          <span>@{c.target_username}</span>
                          <span>{c.confidence_label || (c.confidence_pct >= 80 ? 'High' : c.confidence_pct >= 65 ? 'Probable' : 'Possible')}</span>
                        </div>
                      </button>
                    );
                  })}
                  {candidates.length === 0 && selectedAliasId && (
                    <div className="py-8 text-center font-mono text-xs text-[#5a5568]">
                      No candidates above threshold.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: evidence ───────────── */}
        <div className={`flex-1 flex flex-col bg-[#0e0c0f] border border-[#2a2535] rounded-xl overflow-hidden transition-opacity ${step >= 4 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2535] bg-[#141218] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono text-[9px] font-bold text-amber-400 flex-shrink-0">3</span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
                Evidence Comparison
              </span>
            </div>
            {selectedCandidate && (
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold rounded-lg transition-all active:scale-[0.97]"
              >
                <FileSearch className="w-3 h-3" />
                Generate Report
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {selectedCandidate ? (
              <div className="space-y-6">

                {/* Entity header */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-[#141218] border border-[#2a2535] rounded-xl p-3.5 text-center">
                    <div className="font-mono text-xl font-bold text-amber-400">{selectedAliasId}</div>
                    <div className="font-mono text-xs text-[#5a5568] mt-0.5">@{aliasDetail?.username}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <span className="font-mono text-[10px] text-[#5a5568]">vs</span>
                    <span className="font-mono text-xs font-bold text-[#eae6f0]">{selectedCandidate.confidence_pct}%</span>
                  </div>
                  <div className="flex-1 bg-[#141218] border border-[#2a2535] rounded-xl p-3.5 text-center">
                    <div className="font-mono text-xl font-bold text-rose-400">{selectedCandidate.target_alias_id}</div>
                    <div className="font-mono text-xs text-[#5a5568] mt-0.5">@{selectedCandidate.target_username}</div>
                  </div>
                </div>

                {/* Stylometric vectors */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a5568] border-b border-[#2a2535] pb-2">
                    Stylometric Vectors
                  </h4>
                  <MetricBar
                    label="Semantic Embedding Similarity"
                    pct={selectedCandidate.confidence_pct}
                    color="#f59e0b"
                  />
                  <MetricBar
                    label={`Syntax Match (Sentence Δ ±${selectedCandidate.evidence?.sentence_length_delta ?? 0} wds)`}
                    pct={Math.max(10, 100 - (selectedCandidate.evidence?.sentence_length_delta ?? 0) * 10)}
                    color="#10b981"
                  />
                  <MetricBar
                    label="Punctuation Profile Overlap"
                    pct={(selectedCandidate.evidence?.punctuation_similarity ?? 0) * 100}
                    color="#a78bfa"
                  />
                </div>

                {/* Shared vocabulary */}
                <div>
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a5568] border-b border-[#2a2535] pb-2 mb-3">
                    Shared Vocabulary (N-Grams)
                  </h4>
                  {selectedCandidate.evidence?.shared_phrases?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.evidence.shared_phrases.map((p, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-[#141218] border border-[#2a2535] rounded-lg font-mono text-xs text-[#9d98aa]"
                        >
                          "{p}"
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-[#5a5568] italic">No significant overlap detected.</p>
                  )}
                </div>

                {/* Temporal timeline */}
                <div>
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a5568] border-b border-[#2a2535] pb-2 mb-3">
                    Temporal Activity Timeline
                  </h4>
                  <TemporalTimeline
                    targetPosts={aliasDetail?.posts}
                    candidatePosts={selectedCandidate.detail?.posts}
                    targetId={selectedAliasId}
                    candidateId={selectedCandidate.target_alias_id}
                  />
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-[#5a5568]">
                <Terminal className="w-8 h-8 opacity-30" />
                <span className="font-mono text-xs">Select a candidate from Step 2 to compare evidence.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Report modal ────────────────────────── */}
      <AnimatePresence>
        {reportGenerated && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#09080a]/85 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="bg-[#0e0c0f] border border-amber-500/30 rounded-2xl w-full max-w-xl overflow-hidden"
              id="report-content"
            >
              {/* Report header */}
              <div className="bg-[#141218] border-b border-[#2a2535] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                    <FileSearch className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[#eae6f0]">
                      THREAT INTELLIGENCE REPORT
                    </h3>
                    <p className="font-mono text-[10px] text-[#5a5568]">
                      CASE ID: AEG-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000) + 1000)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setReportGenerated(false); setStep(4); }}
                  data-html2canvas-ignore
                  className="font-mono text-[11px] text-[#5a5568] hover:text-[#eae6f0] px-2.5 py-1 border border-[#2a2535] hover:border-[#3d3850] rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Classification banner */}
                {(() => {
                  const conf = selectedCandidate.confidence_pct;
                  const isHigh = conf >= 80;
                  const color = isHigh ? 'border-rose-500/40 bg-rose-500/10 text-rose-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-400';
                  const label = isHigh ? '⚠ HIGH CONFIDENCE — SAME ACTOR' : conf >= 65 ? '◆ PROBABLE MATCH' : '◇ POSSIBLE MATCH';
                  return (
                    <div className={`font-mono text-xs font-bold text-center py-2.5 rounded-lg border ${color}`}>
                      {label}
                    </div>
                  );
                })()}

                {/* Subjects row */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#141218] border border-[#2a2535] rounded-xl p-3 text-center">
                    <div className="font-mono text-sm font-bold text-amber-400">{selectedAliasId}</div>
                    <div className="font-mono text-[10px] text-[#5a5568] mt-0.5">Subject A</div>
                  </div>
                  <div className="flex-1 bg-[#141218] border border-[#2a2535] rounded-xl p-3 text-center">
                    <div className="font-mono text-sm font-bold text-amber-400">{selectedCandidate.target_alias_id}</div>
                    <div className="font-mono text-[10px] text-[#5a5568] mt-0.5">Subject B</div>
                  </div>
                </div>

                {/* Evidence summary */}
                <div className="bg-[#141218] border border-[#2a2535] rounded-xl p-4 space-y-2.5">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a5568]">Key Findings</h4>

                  {[
                    { label: 'Vector Similarity', value: `${selectedCandidate.confidence_pct}%`, color: '#f59e0b' },
                    { label: 'Sentence Length Δ', value: `±${selectedCandidate.evidence?.sentence_length_delta ?? 0} words`, color: '#10b981' },
                    { label: 'Punctuation Overlap', value: `${((selectedCandidate.evidence?.punctuation_similarity ?? 0) * 100).toFixed(0)}%`, color: '#a78bfa' },
                    { label: 'Shared N-Grams', value: `${selectedCandidate.evidence?.shared_phrases?.length ?? 0} phrases`, color: '#38bdf8' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#9d98aa]">{label}</span>
                      <span className="font-bold" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Shared phrases */}
                {selectedCandidate.evidence?.shared_phrases?.length > 0 && (
                  <div>
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a5568] mb-2">Shared Vocabulary</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.evidence.shared_phrases.slice(0, 8).map((p, i) => (
                        <span key={i} className="font-mono text-[10px] px-2 py-1 bg-[#1a1720] border border-[#2a2535] rounded text-[#9d98aa]">
                          "{p}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2535]">
                  <span className="font-mono text-[10px] text-[#5a5568] flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date().toLocaleString()}
                  </span>
                  <button onClick={handleExportPDF} data-html2canvas-ignore className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141218] hover:bg-[#1a1720] border border-[#2a2535] hover:border-amber-500/30 text-[#9d98aa] hover:text-amber-400 font-mono text-xs rounded-lg transition-colors">
                    <Download className="w-3 h-3" />
                    Export PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
