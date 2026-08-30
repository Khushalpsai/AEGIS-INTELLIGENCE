import React, { useState } from 'react';
import { PlusCircle, RotateCcw, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InjectButton({
  stagedAliases = [],
  isInjecting = false,
  onInject,
  onReset
}) {
  const [notification, setNotification] = useState(null);

  const handleInjectClick = async () => {
    if (stagedAliases.length === 0) {
      setNotification({ type: 'warning', text: 'All staged aliases already injected.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const res = await onInject();
      if (res?.injected_alias_id) {
        setNotification({
          type: 'success',
          text: `Injected ${res.injected_alias_id} -> ${res.resolved_edges?.length || 0} edge(s) resolved!`
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Injection failed' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleResetClick = async () => {
    try {
      await onReset();
      setNotification({ type: 'success', text: 'Demo environment reset to initial state.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', text: 'Reset failed' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const hasStaged = stagedAliases.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleInjectClick}
          disabled={isInjecting || !hasStaged}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl font-mono text-xs font-semibold tracking-wide transition-all shadow-lg ${
            hasStaged
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20 active:scale-[0.98]'
              : 'bg-[#151622] text-gray-500 border border-[#222338] cursor-not-allowed'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${hasStaged ? 'fill-current' : ''}`} />
          <span>Inject Staged Alias</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
            hasStaged ? 'bg-black/20 text-black' : 'bg-[#1c1d2e] text-gray-500'
          }`}>
            {stagedAliases.length}
          </span>
        </button>

        <button
          onClick={handleResetClick}
          title="Reset Staged Aliases"
          className="p-2.5 bg-[#101018] hover:bg-[#181826] border border-[#1e1e2f] hover:border-[#2f2f48] text-gray-400 hover:text-white rounded-xl transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Real-time Notification Banner */}
      {notification && (
        <div className={`p-2 rounded-lg text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
          notification.type === 'success'
            ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
            : notification.type === 'warning'
            ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
            : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
          {notification.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
          {notification.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
          <span>{notification.text}</span>
        </div>
      )}
    </div>
  );
}
