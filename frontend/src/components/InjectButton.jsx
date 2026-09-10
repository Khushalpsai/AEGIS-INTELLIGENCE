import React, { useState } from 'react';
import { Zap, RotateCcw, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InjectButton({ stagedAliases = [], isInjecting = false, onInject, onReset }) {
  const [notification, setNotification] = useState(null);

  const push = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), type === 'success' ? 4000 : 3000);
  };

  const handleInject = async () => {
    if (stagedAliases.length === 0) {
      push('warning', 'All staged aliases already injected.');
      return;
    }
    try {
      const res = await onInject();
      if (res?.injected_alias_id) {
        push('success', `Injected ${res.injected_alias_id} — ${res.resolved_edges?.length ?? 0} edge(s) resolved`);
      }
    } catch (err) {
      push('error', err.message || 'Injection failed');
    }
  };

  const handleReset = async () => {
    try {
      await onReset();
      push('success', 'Environment reset to initial state.');
    } catch {
      push('error', 'Reset failed.');
    }
  };

  const hasStaged = stagedAliases.length > 0;

  const NOTIF_STYLES = {
    success: {
      wrap: 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />,
    },
    warning: {
      wrap: 'bg-amber-950/50 border-amber-500/30 text-amber-300',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />,
    },
    error: {
      wrap: 'bg-rose-950/50 border-rose-500/30 text-rose-300',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />,
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Inject button */}
        <button
          onClick={handleInject}
          disabled={isInjecting || !hasStaged}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
            hasStaged
              ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.97]'
              : 'bg-[#1a1720] border border-[#2a2535] text-[#5a5568] cursor-not-allowed'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${hasStaged ? 'fill-current' : ''}`} />
          {isInjecting ? 'Injecting...' : 'Inject Staged Alias'}
          <span className={`px-1.5 rounded text-[10px] font-bold ${
            hasStaged ? 'bg-black/20 text-black' : 'text-[#5a5568]'
          }`}>
            {stagedAliases.length}
          </span>
        </button>

        {/* Reset button */}
        <button
          onClick={handleReset}
          title="Reset demo state"
          className="p-2 bg-[#141218] hover:bg-[#1a1720] border border-[#2a2535] hover:border-[#3d3850] text-[#9d98aa] hover:text-[#eae6f0] rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[11px] font-mono ${NOTIF_STYLES[notification.type].wrap}`}
          >
            {NOTIF_STYLES[notification.type].icon}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
