import React from 'react';
import { User, MessageSquare, Clock, Globe, Shield, ArrowUpRight, Hash, Terminal } from 'lucide-react';

export default function AliasDetail({ alias, resolution, onSelectMatch }) {
  if (!alias) return null;

  const posts = alias.posts || [];
  const matches = resolution?.matches || [];
  const aboveThresholdMatches = matches.filter(m => m.is_above_threshold);

  return (
    <div className="space-y-6 text-sm">
      {/* Header Profile Info */}
      <div className="bg-[#0f1019] border border-[#1e1e2f] p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-base shadow-inner">
              {alias.alias_id || alias.id}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                @{alias.username}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  {alias.platform}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <MessageSquare className="w-3 h-3 text-gray-400" />
                  {posts.length} posts
                </span>
              </div>
            </div>
          </div>

          {resolution?.cluster_id && (
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold">
                {resolution.cluster_id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Intra-Cluster Resolved Matches */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Correlated Aliases ({aboveThresholdMatches.length})
          </span>
          <span className="text-[11px] font-mono text-gray-500">
            SIM &ge; {resolution?.threshold || 0.62}
          </span>
        </div>

        {aboveThresholdMatches.length === 0 ? (
          <div className="p-3 bg-[#0d0d14] border border-[#1a1a26] rounded-lg text-xs text-gray-500 font-mono text-center">
            No alias correlations above threshold. Singleton cluster.
          </div>
        ) : (
          <div className="space-y-2">
            {aboveThresholdMatches.map((m) => (
              <div
                key={m.target_alias_id}
                onClick={() => onSelectMatch && onSelectMatch(m.target_alias_id)}
                className="group p-3 bg-[#0f1019] hover:bg-[#151624] border border-[#1e1e2f] hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {m.target_alias_id}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-gray-200 group-hover:text-white">
                      @{m.target_username}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {m.target_platform}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {(m.score * 100).toFixed(1)}%
                    </span>
                    <div className="text-[9px] text-gray-500 font-mono">confidence</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Posts Timeline */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Post Corpus ({posts.length} entries)
          </span>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {posts.map((post, idx) => (
            <div
              key={post.post_id || idx}
              className="p-3 bg-[#0d0d14] border border-[#1c1c2b] rounded-lg space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span className="text-cyan-400/80 font-semibold">{post.post_id}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : '2026-01'}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                "{post.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
