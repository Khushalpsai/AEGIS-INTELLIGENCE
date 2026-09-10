import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// ── Matrix rain canvas ───────────────────────────────
function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CHARS =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    const FONT_SIZE = 13;
    let cols, drops;

    const init = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols  = Math.floor(canvas.width / FONT_SIZE);
      drops = Array.from({ length: cols }, () => Math.random() * -80);
    };
    init();

    const draw = () => {
      ctx.fillStyle = 'rgba(9, 8, 10, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y = drops[i] * FONT_SIZE;
        // Head character — bright
        ctx.fillStyle = 'rgba(253, 230, 138, 0.9)';
        ctx.fillText(char, i * FONT_SIZE, y);
        // Trail — dim amber
        ctx.fillStyle = `rgba(180, 83, 9, ${0.15 + Math.random() * 0.3})`;
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FONT_SIZE, y - FONT_SIZE * 2);

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.45;
      }
    };

    const interval = setInterval(draw, 50);
    const onResize = () => init();
    window.addEventListener('resize', onResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.35 }}
    />
  );
}

// ── Landing page ─────────────────────────────────────
export default function LandingPage({ onEnterDashboard }) {
  return (
    <div className="relative min-h-screen w-full bg-[#09080a] text-[#eae6f0] overflow-hidden flex flex-col select-none">

      <MatrixRain />

      {/* Deep vignette so center content pops */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(9,8,10,0.75) 100%)' }}
      />

      {/* ── Nav ──────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5">
        {/* Left: wordmark */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-bold text-amber-400 tracking-[0.18em] uppercase">
            Aegis-Intelligence
          </span>
          <span className="font-mono text-[9px] text-[#3d3850] border border-[#2a2535] px-1.5 py-0.5 rounded">
            v1.0
          </span>
        </div>

        {/* Right: team + cta */}
        <div className="flex items-center gap-5">
          <span className="hidden sm:block font-mono text-[11px] text-[#5a5568]">
            Team: LeaveLeave
          </span>
          <button
            onClick={onEnterDashboard}
            className="flex items-center gap-2 px-4 py-2 border border-amber-500/60 hover:border-amber-400 hover:bg-amber-500/8 text-amber-400 hover:text-amber-300 font-mono text-[11px] font-semibold rounded transition-all duration-150"
          >
            Launch <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">

        {/* Overline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[10px] tracking-[0.3em] text-amber-600 uppercase mb-7"
        >
          Dark-Web Threat Intelligence
        </motion.p>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-mono font-black tracking-tighter leading-[0.92] mb-6"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)' }}
        >
          <span className="text-[#eae6f0]">AEGIS</span>
          <span className="text-amber-500">.</span>
          <br className="sm:hidden" />
          <span className="text-[#eae6f0]">INTELLIGENCE</span>
        </motion.h1>

        {/* Descriptor */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-[#5a5568] text-sm font-mono tracking-widest uppercase mb-12 max-w-sm leading-relaxed"
        >
          Stylometric alias correlation &amp; identity resolution
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <button
            onClick={onEnterDashboard}
            className="group relative font-mono font-black tracking-tight leading-none text-amber-400 hover:text-amber-300 transition-colors duration-150 cursor-pointer"
            style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
          >
            {/* Subtle amber glow behind the text */}
            <span
              className="absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
              style={{ background: '#f59e0b' }}
            />
            <span className="relative">
              &gt;_
            </span>
          </button>
          <p className="mt-3 font-mono text-[10px] tracking-[0.25em] text-[#3d3850] uppercase text-center">
            click to enter
          </p>
        </motion.div>

      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="relative z-20 flex items-center justify-between px-8 py-4 border-t border-[#1a1720]">
        <span className="font-mono text-[9px] text-[#3d3850] tracking-widest uppercase">
          Aegis-Intelligence // OSINT Platform
        </span>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="font-mono text-[9px] text-amber-700 tracking-widest"
        >
          ● SYSTEM STANDBY
        </motion.span>
      </footer>
    </div>
  );
}
