import React from 'react';

function Row({ label, value, valueClass = 'text-[#cdd6e0]' }) {
  return (
    <div className="flex items-center border-b border-[#1e252e] py-1.5">
      <span className="font-mono text-[10px] text-[#5a6a7a] w-28 flex-shrink-0">{label}</span>
      <span className={`font-mono text-[11px] ${valueClass}`}>{value}</span>
    </div>
  );
}

function confColor(score) {
  if (score >= 0.8)  return '#00d4aa';
  if (score >= 0.65) return '#38bdf8';
  if (score >= 0.4)  return '#fbbf24';
  return '#f43f5e';
}

export default function AliasDetail({ alias, resolution, onSelectMatch }) {
  if (!alias) return null;
  const posts = alias.posts || [];
  const matches = (resolution?.matches || []).filter(m => m.is_above_threshold);

  return (
    <div className="space-y-0">

      {/* ── Profile ── */}
      <div className="border-b border-[#1e252e] pb-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-[#00d4aa]" />
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#00d4aa] uppercase">Alias Profile</span>
        </div>
        <Row label="ALIAS ID"  value={alias.alias_id || alias.id} valueClass="text-[#00d4aa] font-bold" />
        <Row label="USERNAME"  value={`@${alias.username}`} />
        <Row label="PLATFORM"  value={alias.platform} />
        <Row label="POST COUNT" value={posts.length} />
        {resolution?.cluster_id && (
          <Row label="CLUSTER" value={resolution.cluster_id} valueClass="text-[#a78bfa]" />
        )}
      </div>

      {/* ── Correlations ── */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-[#38bdf8]" />
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#38bdf8] uppercase">
            Correlations
          </span>
          <span className="font-mono text-[9px] text-[#2a3340] ml-auto">
            SIM ≥ {resolution?.threshold ?? 0.55}
          </span>
        </div>

        {matches.length === 0 ? (
          <p className="font-mono text-[10px] text-[#2a3340] py-2 border-b border-[#1e252e]">
            No matches above threshold — singleton.
          </p>
        ) : (
          <div>
            {/* Table header */}
            <div className="flex items-center border-b border-[#1e252e] pb-1 mb-1">
              <span className="font-mono text-[9px] text-[#2a3340] w-12">ID</span>
              <span className="font-mono text-[9px] text-[#2a3340] flex-1">HANDLE</span>
              <span className="font-mono text-[9px] text-[#2a3340] w-16 text-right">SCORE</span>
            </div>
            {matches.map(m => (
              <button
                key={m.target_alias_id}
                onClick={() => onSelectMatch?.(m.target_alias_id)}
                className="w-full flex items-center border-b border-[#1e252e] py-1.5 hover:bg-[#12151a] group transition-colors"
              >
                <span className="font-mono text-[10px] text-[#00d4aa] w-12 group-hover:underline">{m.target_alias_id}</span>
                <span className="font-mono text-[10px] text-[#8899aa] flex-1 text-left">@{m.target_username}</span>
                <span className="font-mono text-[10px] font-bold w-16 text-right" style={{ color: confColor(m.score) }}>
                  {(m.score * 100).toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Posts ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-[#5a6a7a]" />
          <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#5a6a7a] uppercase">
            Post Corpus
          </span>
          <span className="font-mono text-[9px] text-[#2a3340] ml-auto">{posts.length} entries</span>
        </div>
        <div className="space-y-0 max-h-96 overflow-y-auto">
          {posts.map((post, i) => (
            <div key={post.post_id || i} className="border-b border-[#1e252e] py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] text-[#2a3340]">{post.post_id}</span>
                <span className="font-mono text-[9px] text-[#2a3340]">
                  {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : '—'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#8899aa] leading-relaxed">"{post.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
