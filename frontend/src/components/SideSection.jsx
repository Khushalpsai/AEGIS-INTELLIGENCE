import React, { useState } from 'react';

export default function SideSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1e252e]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-[#0e1012] transition-colors group"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3 h-3 text-[#00d4aa]" />}
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5a6a7a] group-hover:text-[#8899aa] transition-colors">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#2a3340]">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
