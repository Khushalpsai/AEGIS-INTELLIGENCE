import React from 'react';
import { Globe, MessageSquare, Clock, Shield, ArrowUpRight, Terminal, Hash } from 'lucide-react';

function ConfBadge({ score }) {
  const pct = (score * 100).toFixed(1);
  const color =
    score >= 0.8 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
    score >= 0.65 ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
    score >= 0.4  ? 'text-orange-400 bg-orange-500/10 border-orange-500/25' :
                    'text-rose-400 bg-rose-500/10 border-rose-500/25';
  return (
    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${color}`}>
      {pct}%
    </span>
  );
}

export default function AliasDetail({ alias, resolution, onSelectMatch }) {
  if (!alias) return null;

  const posts = alias.posts || [];
  const matches = resolution?.matches || [];
  const aboveThreshold = matches.filter(m => m.is_above_threshold);

  return (
    <div className="space-y-5 text-sm">

      {/* ── Profile card ──────────────────────────── */}
      <div className="bg-[#141218] border border-[#2a2535] rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center font-mono font-bold text-sm text-amber-400 flex-shrink-0">
              {alias.alias_id || alias.id}
            </div>
            <div>
              <h3 className="font-mono font-bold text-[#eae6f0] text-base leading-tight">
                @{alias.username}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9d98aa]">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-amber-500/70" />
                  {alias.platform}
                </span>
                <span className="text-[#2a2535]">|</span>
                <span className="flex items-center gap-1 font-mono">
                  <MessageSquare className="w-3 h-3" />
                  {posts.length} posts
                </span>
              </div>
            </div>
          </div>

          {/* Cluster badge */}
          {resolution?.cluster_id && (
            <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-400 flex-shrink-0">
              {resolution.cluster_id}
            </span>
          )}
        </div>

        {/* Thin divider + threshold note */}
        {aboveThreshold.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#2a2535]">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-[10px] text-[#5a5568]">
              {aboveThreshold.length} correlation{aboveThreshold.length !== 1 ? 's' : ''} above SIM ≥ {resolution?.threshold ?? 0.62}
            </span>
          </div>
        )}
      </div>

      {/* ── Correlated aliases ────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
            Correlated Aliases
          </span>
          <span className="font-mono text-[10px] text-[#5a5568] ml-auto">
            SIM ≥ {resolution?.threshold ?? 0.62}
          </span>
        </div>

        {aboveThreshold.length === 0 ? (
          <div className="px-3 py-4 bg-[#141218] border border-[#2a2535] rounded-xl text-center font-mono text-[11px] text-[#5a5568]">
            No correlations above threshold — singleton cluster.
          </div>
        ) : (
          <div className="space-y-1.5">
            {aboveThreshold.map(m => (
              <button
                key={m.target_alias_id}
                onClick={() => onSelectMatch?.(m.target_alias_id)}
                className="w-full group flex items-center justify-between px-3 py-2.5 bg-[#141218] hover:bg-[#1a1720] border border-[#2a2535] hover:border-amber-500/30 rounded-xl transition-all text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                    {m.target_alias_id}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#eae6f0] truncate">
                      @{m.target_username}
                    </div>
                    <div className="font-mono text-[10px] text-[#5a5568]">
                      {m.target_platform}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <ConfBadge score={m.score} />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#5a5568] group-hover:text-amber-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Post corpus ───────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
            Post Corpus
          </span>
          <span className="font-mono text-[10px] text-[#5a5568] ml-auto">
            {posts.length} entries
          </span>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
          {posts.map((post, idx) => (
            <div
              key={post.post_id || idx}
              className="bg-[#141218] border border-[#2a2535] rounded-xl p-3 space-y-1.5 hover:border-[#3d3850] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-amber-500/70">
                  {post.post_id}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[#5a5568]">
                  <Clock className="w-3 h-3" />
                  {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : '—'}
                </span>
              </div>
              <p className="text-[12px] text-[#9d98aa] leading-relaxed">
                "{post.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
