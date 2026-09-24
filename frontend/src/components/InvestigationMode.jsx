import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Search, ChevronRight, Fingerprint, ShieldAlert, FileSearch, Terminal, Clock, Download } from 'lucide-react';
import { resolveAlias, fetchAliasDetail } from '../api/client';
import { exportIntelligenceReport } from '../utils/exportPDF';
// ── Temporal Timeline ────────────────────────────────
function TemporalTimeline({ targetPosts, candidatePosts, targetId, candidateId }) {
  if (!targetPosts?.length || !candidatePosts?.length) return null;
  const all = [...targetPosts, ...candidatePosts];
  const ts = all.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  if (!ts.length) return null;
  const min = Math.min(...ts), max = Math.max(...ts);
  const pad = (max - min) * 0.1 || 86400000 * 7;
  const start = min - pad, end = max + pad, range = end - start;
  const pos = t => ((new Date(t).getTime() - start) / range) * 100;

  const td = targetPosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const cd = candidatePosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const os = Math.max(Math.min(...td), Math.min(...cd));
  const oe = Math.min(Math.max(...td), Math.max(...cd));
  const overlap = os <= oe;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between font-mono text-[9px] text-[#2a3340]">
        <span>{new Date(start).toLocaleDateString()}</span>
        <span>{new Date(end).toLocaleDateString()}</span>
      </div>
      <div className="relative h-12 bg-[#0a0b0d] border border-[#1e252e] overflow-hidden">
        {overlap && (
          <div className="absolute top-0 bottom-0 bg-[#00d4aa]/8 border-x border-[#00d4aa]/20"
            style={{ left: `${pos(os)}%`, width: `${pos(oe) - pos(os)}%` }} />
        )}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1e252e]" />
        {/* Target row */}
        <div className="absolute top-0 left-0 right-0 h-1/2">
          <span className="absolute left-1.5 top-0.5 font-mono text-[8px] text-[#00d4aa]/40">{targetId}</span>
          {targetPosts.map((p, i) => (
            <div key={i} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#00d4aa]"
              style={{ left: `${pos(p.timestamp)}%` }} title={new Date(p.timestamp).toLocaleDateString()} />
          ))}
        </div>
        {/* Candidate row */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2">
          <span className="absolute left-1.5 bottom-0.5 font-mono text-[8px] text-[#f43f5e]/40">{candidateId}</span>
          {candidatePosts.map((p, i) => (
            <div key={i} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#f43f5e]"
              style={{ left: `${pos(p.timestamp)}%` }} title={new Date(p.timestamp).toLocaleDateString()} />
          ))}
        </div>
      </div>
      <div className="font-mono text-[9px] text-center">
        {overlap
          ? <span className="text-[#00d4aa] border border-[#00d4aa]/20 bg-[#00d4aa]/5 px-2 py-0.5">● CONCURRENT ACTIVITY OVERLAP DETECTED</span>
          : <span className="text-[#5a6a7a] border border-[#1e252e] px-2 py-0.5">— SEQUENTIAL HANDOVER / NO OVERLAP</span>
        }
      </div>
    </div>
  );
}

// ── Metric bar ───────────────────────────────────────
function MetricBar({ label, pct, color }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div className="py-1.5 border-b border-[#1e252e]">
      <div className="flex justify-between mb-1">
        <span className="font-mono text-[10px] text-[#5a6a7a]">{label}</span>
        <span className="font-mono text-[10px] font-bold" style={{ color }}>{v.toFixed(0)}%</span>
      </div>
      <div className="h-px bg-[#1e252e] relative">
        <div className="h-px bar-fill absolute left-0" style={{ width: `${v}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Step indicator ───────────────────────────────────
function Step({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-1.5 font-mono text-[10px] px-3 py-1 border transition-colors ${
      done   ? 'border-[#00d4aa]/30 text-[#00d4aa]/60 bg-[#00d4aa]/5' :
      active ? 'border-[#00d4aa]/60 text-[#00d4aa]' :
               'border-[#1e252e] text-[#2a3340]'
    }`}>
      {done ? '✓' : n} {label}
    </div>
  );
}

export default function InvestigationMode({ allNodes, onExit }) {
  const [step, setStep] = useState(1);
  const [selectedAliasId, setSelectedAliasId] = useState(null);
  const [aliasDetail, setAliasDetail] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectAlias = async (nodeId) => {
    setSelectedAliasId(nodeId);
    setSelectedCandidate(null);
    setReportOpen(false);
    setStep(2);
    setIsResolving(true);
    try {
      const [detail, res] = await Promise.all([fetchAliasDetail(nodeId), resolveAlias(nodeId, 0.0, true)]);
      setAliasDetail(detail);
      setCandidates(res.matches.filter(m => m.score > 0.15).sort((a, b) => b.score - a.score));
    } catch (e) { console.error(e); }
    finally { setIsResolving(false); }
  };

  const handleSelectCandidate = async (c) => {
    setIsResolving(true);
    try {
      const detail = await fetchAliasDetail(c.target_alias_id);
      setSelectedCandidate({ ...c, detail });
      setStep(4);
    } catch (e) { console.error(e); }
    finally { setIsResolving(false); }
  };

  const handleExportPDF = () => {
    if (!selectedCandidate || !aliasDetail) return;
    const year = new Date().getFullYear();
    const caseId = `AEG-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    exportIntelligenceReport({
      caseId,
      targetId:          selectedAliasId,
      targetUsername:    aliasDetail.username ?? selectedAliasId,
      targetPosts:       aliasDetail.posts ?? [],
      candidateId:       selectedCandidate.target_alias_id,
      candidateUsername: selectedCandidate.target_username ?? selectedCandidate.target_alias_id,
      candidatePosts:    selectedCandidate.detail?.posts ?? [],
      confidence:        selectedCandidate.confidence_pct,
      evidence:          selectedCandidate.evidence ?? {},
    });
  };

  const filtered = allNodes.filter(n =>
    n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confColor = pct => pct >= 80 ? '#00d4aa' : pct >= 65 ? '#38bdf8' : pct >= 40 ? '#fbbf24' : '#f43f5e';

  return (
    <div className="absolute inset-0 bg-[#0a0b0d] z-40 flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-[#1e252e] bg-[#0e1012]">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="font-mono text-[11px] text-[#5a6a7a] hover:text-[#00d4aa] flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3 h-3" /> BACK
          </button>
          <div className="h-4 w-px bg-[#1e252e]" />
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#00d4aa]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-[#00d4aa]">INVESTIGATION MODE</span>
          </div>
        </div>
        {/* Step indicators */}
        <div className="hidden md:flex items-center gap-1">
          <Step n="01" label="TARGET"     active={step === 1} done={step > 1} />
          <span className="text-[#1e252e] font-mono text-[10px]">›</span>
          <Step n="02" label="CANDIDATES" active={step === 2 || step === 3} done={step > 3} />
          <span className="text-[#1e252e] font-mono text-[10px]">›</span>
          <Step n="03" label="EVIDENCE"   active={step === 4} done={step > 4} />
          <span className="text-[#1e252e] font-mono text-[10px]">›</span>
          <Step n="04" label="REPORT"     active={step === 5} done={false} />
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">

        {/* Left column */}
        <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-[#1e252e]">

          {/* Step 1 */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-[#1e252e]">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e252e] bg-[#0e1012] flex-shrink-0">
              <span className="font-mono text-[9px] text-[#00d4aa] border border-[#00d4aa]/30 px-1.5 py-0.5">01</span>
              <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-[#5a6a7a] uppercase">Select Target</span>
            </div>
            <div className="p-2 border-b border-[#1e252e] flex-shrink-0">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#2a3340]" />
                <input
                  type="text" placeholder="search aliases..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-[#1e252e] focus:border-[#00d4aa]/40 pl-7 pr-2 py-1.5 font-mono text-[11px] text-[#cdd6e0] placeholder-[#2a3340] outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(n => {
                const isSel = selectedAliasId === n.id;
                return (
                  <button key={n.id} onClick={() => handleSelectAlias(n.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 border-b border-[#1e252e] font-mono text-[11px] transition-colors ${
                      isSel ? 'bg-[#00d4aa]/8 text-[#00d4aa] border-l-2 border-l-[#00d4aa]' : 'text-[#8899aa] hover:bg-[#12151a] hover:text-[#cdd6e0]'
                    }`}>
                    <span className={`text-[10px] w-8 flex-shrink-0 ${isSel ? 'text-[#00d4aa] font-bold' : 'text-[#5a6a7a]'}`}>{n.id}</span>
                    <span className="truncate">@{n.username}</span>
                    {isSel && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 */}
          <div className={`flex-1 flex flex-col min-h-0 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e252e] bg-[#0e1012] flex-shrink-0">
              <span className="font-mono text-[9px] text-[#38bdf8] border border-[#38bdf8]/30 px-1.5 py-0.5">02</span>
              <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-[#5a6a7a] uppercase">Candidates</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isResolving ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[#00d4aa]/40">
                  <Fingerprint className="w-6 h-6 animate-pulse" />
                  <span className="font-mono text-[9px]">CORRELATING...</span>
                </div>
              ) : candidates.map(c => {
                const isSel = selectedCandidate?.target_alias_id === c.target_alias_id;
                const cc = confColor(c.confidence_pct);
                return (
                  <button key={c.target_alias_id} onClick={() => handleSelectCandidate(c)}
                    className={`w-full text-left px-3 py-2 border-b border-[#1e252e] transition-colors ${
                      isSel ? 'bg-[#00d4aa]/8 border-l-2 border-l-[#00d4aa]' : 'hover:bg-[#12151a]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#cdd6e0]">{c.target_alias_id}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: cc }}>{c.confidence_pct}%</span>
                    </div>
                    <div className="font-mono text-[9px] text-[#5a6a7a] mt-0.5">
                      @{c.target_username} · {c.confidence_pct >= 80 ? 'HIGH' : c.confidence_pct >= 65 ? 'PROBABLE' : 'POSSIBLE'}
                    </div>
                  </button>
                );
              })}
              {candidates.length === 0 && selectedAliasId && !isResolving && (
                <div className="font-mono text-[9px] text-[#2a3340] text-center py-8">NO CANDIDATES</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: evidence */}
        <div className={`flex-1 flex flex-col min-h-0 transition-opacity ${step >= 4 ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e252e] bg-[#0e1012] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-[#a78bfa] border border-[#a78bfa]/30 px-1.5 py-0.5">03</span>
              <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-[#5a6a7a] uppercase">Evidence Comparison</span>
            </div>
            {selectedCandidate && (
              <button onClick={() => { setReportOpen(true); setStep(5); }}
                className="font-mono text-[10px] text-[#00d4aa] border border-[#00d4aa]/40 hover:border-[#00d4aa] hover:bg-[#00d4aa]/5 px-3 py-1 transition-all flex items-center gap-1.5">
                <FileSearch className="w-3 h-3" /> GENERATE REPORT
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedCandidate ? (
              <div className="space-y-4">

                {/* Subjects */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 border border-[#1e252e] p-3">
                    <div className="font-mono text-base font-bold text-[#00d4aa]">{selectedAliasId}</div>
                    <div className="font-mono text-[10px] text-[#5a6a7a]">@{aliasDetail?.username}</div>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-[#f43f5e]/60 mx-auto mb-1" />
                    <div className="font-mono text-[10px] font-bold" style={{ color: confColor(selectedCandidate.confidence_pct) }}>
                      {selectedCandidate.confidence_pct}%
                    </div>
                  </div>
                  <div className="flex-1 border border-[#1e252e] p-3">
                    <div className="font-mono text-base font-bold text-[#f43f5e]">{selectedCandidate.target_alias_id}</div>
                    <div className="font-mono text-[10px] text-[#5a6a7a]">@{selectedCandidate.target_username}</div>
                  </div>
                </div>

                {/* Stylometric vectors */}
                <div>
                  <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase mb-2">Stylometric Vectors</div>
                  <MetricBar label="Semantic Embedding Similarity" pct={selectedCandidate.confidence_pct} color="#00d4aa" />
                  <MetricBar label={`Syntax Match (Sentence Δ ±${selectedCandidate.evidence?.sentence_length_delta ?? 0} wds)`}
                    pct={Math.max(10, 100 - (selectedCandidate.evidence?.sentence_length_delta ?? 0) * 10)} color="#38bdf8" />
                  <MetricBar label="Punctuation Profile Overlap"
                    pct={(selectedCandidate.evidence?.punctuation_similarity ?? 0) * 100} color="#a78bfa" />
                </div>

                {/* N-Grams */}
                <div>
                  <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase mb-2">Shared N-Grams</div>
                  {selectedCandidate.evidence?.shared_phrases?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.evidence.shared_phrases.map((p, i) => (
                        <span key={i} className="font-mono text-[9px] text-[#5a6a7a] bg-[#0a0b0d] border border-[#1e252e] px-1.5 py-0.5">"{p}"</span>
                      ))}
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-[#2a3340]">No significant overlap detected.</span>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase mb-2">Temporal Activity</div>
                  <TemporalTimeline
                    targetPosts={aliasDetail?.posts}
                    candidatePosts={selectedCandidate.detail?.posts}
                    targetId={selectedAliasId}
                    candidateId={selectedCandidate.target_alias_id}
                  />
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Terminal className="w-7 h-7 text-[#1e252e] mx-auto mb-2" />
                  <span className="font-mono text-[10px] text-[#2a3340]">SELECT A CANDIDATE TO COMPARE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Report modal ── */}
      <AnimatePresence>
        {reportOpen && selectedCandidate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0b0d]/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.15 }}
              id="report-content"
              className="bg-[#0e1012] border border-[#1e252e] w-full max-w-lg overflow-hidden">

              {/* Report header */}
              <div className="border-b border-[#1e252e] px-5 py-3 flex items-center justify-between bg-[#12151a]">
                <div>
                  <div className="font-mono text-xs font-bold text-[#cdd6e0] tracking-widest">THREAT INTELLIGENCE REPORT</div>
                  <div className="font-mono text-[9px] text-[#5a6a7a]">
                    CASE / AEG-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000) + 1000)}
                  </div>
                </div>
                <button onClick={() => { setReportOpen(false); setStep(4); }}
                  className="font-mono text-[10px] text-[#5a6a7a] hover:text-[#cdd6e0] border border-[#1e252e] hover:border-[#2a3340] px-2.5 py-1 transition-colors">
                  CLOSE
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Classification */}
                {(() => {
                  const pct = selectedCandidate.confidence_pct;
                  const color = confColor(pct);
                  const label = pct >= 80 ? '⚠ HIGH CONFIDENCE — SAME ACTOR' : pct >= 65 ? '◆ PROBABLE MATCH' : '◇ POSSIBLE MATCH';
                  return (
                    <div className="font-mono text-[11px] font-bold text-center py-2 border" style={{ borderColor: `${color}40`, color, backgroundColor: `${color}08` }}>
                      {label}
                    </div>
                  );
                })()}

                {/* Subjects */}
                <div className="flex gap-3">
                  <div className="flex-1 border border-[#1e252e] p-3">
                    <div className="font-mono text-sm font-bold text-[#00d4aa]">{selectedAliasId}</div>
                    <div className="font-mono text-[9px] text-[#5a6a7a]">SUBJECT A</div>
                  </div>
                  <div className="flex-1 border border-[#1e252e] p-3">
                    <div className="font-mono text-sm font-bold text-[#00d4aa]">{selectedCandidate.target_alias_id}</div>
                    <div className="font-mono text-[9px] text-[#5a6a7a]">SUBJECT B</div>
                  </div>
                </div>

                {/* Visual Evidence (Graphs & Timeline) */}
                <div className="space-y-4">
                  {/* Stylometric vectors */}
                  <div>
                    <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase mb-2">Stylometric Vectors</div>
                    <MetricBar label="Semantic Embedding Similarity" pct={selectedCandidate.confidence_pct} color="#00d4aa" />
                    <MetricBar label={`Syntax Match (Sentence Δ ±${selectedCandidate.evidence?.sentence_length_delta ?? 0} wds)`}
                      pct={Math.max(10, 100 - (selectedCandidate.evidence?.sentence_length_delta ?? 0) * 10)} color="#38bdf8" />
                    <MetricBar label="Punctuation Profile Overlap"
                      pct={(selectedCandidate.evidence?.punctuation_similarity ?? 0) * 100} color="#a78bfa" />
                  </div>

                  {/* N-Grams */}
                  <div>
                    <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase mb-2">Shared N-Grams</div>
                    {selectedCandidate.evidence?.shared_phrases?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.evidence.shared_phrases.map((p, i) => (
                          <span key={i} className="font-mono text-[9px] text-[#5a6a7a] bg-[#0a0b0d] border border-[#1e252e] px-1.5 py-0.5">"{p}"</span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] text-[#2a3340]">No significant overlap detected.</span>
                    )}
                  </div>

                  {/* Timeline */}
                  <div>
                    <div className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a6a7a] uppercase mb-2">Temporal Activity</div>
                    <TemporalTimeline
                      targetPosts={aliasDetail?.posts}
                      candidatePosts={selectedCandidate.detail?.posts}
                      targetId={selectedAliasId}
                      candidateId={selectedCandidate.target_alias_id}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1e252e]">
                  <span className="font-mono text-[9px] text-[#2a3340] flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {new Date().toLocaleString()}
                  </span>
                  <button onClick={handleExportPDF} className="font-mono text-[10px] text-[#5a6a7a] hover:text-[#cdd6e0] border border-[#1e252e] hover:border-[#2a3340] px-3 py-1.5 flex items-center gap-1.5 transition-colors">
                    <Download className="w-3 h-3" /> EXPORT PDF
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
