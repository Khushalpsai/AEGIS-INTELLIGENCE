import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function MatrixRain() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF></?\\|[]{}';
    const FS = 12;
    let cols, drops;
    const init = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols  = Math.floor(canvas.width / FS);
      drops = Array.from({ length: cols }, () => Math.random() * -120);
    };
    init();
    const draw = () => {
      ctx.fillStyle = 'rgba(10,11,13,0.14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FS}px 'JetBrains Mono', monospace`;
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * FS;
        // bright head
        ctx.fillStyle = 'rgba(0,212,170,0.92)';
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FS, y);
        // dim trail
        ctx.fillStyle = `rgba(0,180,140,${0.08 + Math.random() * 0.18})`;
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FS, y - FS * 3);
        if (y > canvas.height && Math.random() > 0.974) drops[i] = 0;
        drops[i] += 0.42;
      }
    };
    const id = setInterval(draw, 48);
    const onResize = () => init();
    window.addEventListener('resize', onResize);
    return () => { clearInterval(id); window.removeEventListener('resize', onResize); };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.28 }}
    />
  );
}

export default function LandingPage({ onEnterDashboard }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="scanlines relative min-h-screen w-full bg-[#0a0b0d] overflow-hidden flex flex-col select-none">
      <MatrixRain />

      {/* hard vignette edges */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, rgba(10,11,13,0.88) 100%)' }} />

      {/* ── Nav ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-[#1e252e]">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 bg-[#00d4aa]" />
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#00d4aa] uppercase">
            AEGIS-INTELLIGENCE
          </span>
          <span className="font-mono text-[10px] text-[#2a3340] border border-[#1e252e] px-1.5 py-0.5">
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:block font-mono text-[11px] text-[#5a6a7a]">
            TEAM: LEAVELEAVE
          </span>
          <button
            onClick={onEnterDashboard}
            className="font-mono text-[11px] text-[#00d4aa] border border-[#00d4aa]/40 hover:border-[#00d4aa] hover:bg-[#00d4aa]/5 px-4 py-1.5 transition-all duration-150"
          >
            LAUNCH →
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-[10px] tracking-[0.4em] text-[#5a6a7a] uppercase mb-8"
        >
          DARK-WEB THREAT ACTOR IDENTITY RESOLUTION
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="font-mono font-black tracking-[-0.03em] leading-none mb-3 text-[#cdd6e0]"
          style={{ fontSize: 'clamp(3.2rem, 9vw, 7rem)' }}
        >
          AEGIS
          <span className="text-[#00d4aa]">.</span>
          INT
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="font-mono text-[11px] text-[#5a6a7a] tracking-widest uppercase mb-16 max-w-xs leading-loose"
        >
          Stylometric vector correlation<br />
          Multi-alias threat de-anonymization
        </motion.p>

        {/* >_ prompt CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="flex flex-col items-center gap-3"
        >
          <button
            onClick={onEnterDashboard}
            className="group font-mono font-black text-[#00d4aa] hover:text-white transition-colors duration-150 cursor-pointer leading-none"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
          >
            &gt;_
          </button>
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#2a3340] uppercase">
            CLICK TO ENTER{tick % 2 === 0 ? ' ▮' : '  '}
          </span>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex items-center justify-between px-8 py-3 border-t border-[#1e252e]">
        <span className="font-mono text-[10px] text-[#2a3340] tracking-widest uppercase">
          AEGIS // OSINT PLATFORM
        </span>
        <span className="font-mono text-[10px] text-[#00d4aa]/40 tracking-widest">
          ● SYS READY
        </span>
      </footer>
    </div>
  );
}
