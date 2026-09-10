import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SideSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#2a2535] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#141218] hover:bg-[#1a1720] transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-amber-500" />}
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#9d98aa]">
            {title}
          </span>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 text-[#5a5568] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && <div className="bg-[#0e0c0f] p-3">{children}</div>}
    </div>
  );
}
