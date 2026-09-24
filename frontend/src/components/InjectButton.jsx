import React, { useState } from 'react';
import { Zap, RotateCcw } from 'lucide-react';

export default function InjectButton({ stagedAliases = [], isInjecting = false, onInject, onReset }) {
  const [msg, setMsg] = useState(null);

  const push = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), type === 'success' ? 4000 : 3000);
  };

  const handleInject = async () => {
    if (!stagedAliases.length) { push('warn', 'No staged aliases remaining.'); return; }
    try {
      const res = await onInject();
      if (res?.injected_alias_id) push('success', `↑ ${res.injected_alias_id} injected — ${res.resolved_edges?.length ?? 0} edges resolved`);
    } catch (err) { push('error', err.message || 'Injection failed'); }
  };

  const handleReset = async () => {
    try { await onReset(); push('success', 'State reset to initial.'); }
    catch { push('error', 'Reset failed.'); }
  };

  const has = stagedAliases.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <button
          onClick={handleInject}
          disabled={isInjecting || !has}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[11px] font-bold transition-all border ${
            has
              ? 'border-[#00d4aa]/40 text-[#00d4aa] hover:bg-[#00d4aa]/8 hover:border-[#00d4aa] active:scale-[0.98]'
              : 'border-[#1e252e] text-[#2a3340] cursor-not-allowed'
          }`}
        >
          <Zap className="w-3 h-3" />
          {isInjecting ? 'INJECTING...' : `INJECT [${stagedAliases.length}]`}
        </button>
        <button
          onClick={handleReset}
          title="Reset demo"
          className="px-2.5 border border-[#1e252e] text-[#5a6a7a] hover:border-[#2a3340] hover:text-[#cdd6e0] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
      {msg && (
        <div className={`font-mono text-[10px] px-2 py-1.5 border-l-2 ${
          msg.type === 'success' ? 'border-[#00d4aa] text-[#00d4aa] bg-[#00d4aa]/5' :
          msg.type === 'warn'    ? 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/5' :
                                   'border-[#f43f5e] text-[#f43f5e] bg-[#f43f5e]/5'
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
