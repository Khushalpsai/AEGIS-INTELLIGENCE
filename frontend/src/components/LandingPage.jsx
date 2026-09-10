import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  Fingerprint, 
  Activity, 
  ArrowRight, 
  Database, 
  Network, 
  Lock, 
  Sparkles,
  Zap,
  Globe,
  Binary,
  Radio,
  Eye,
  Crosshair
} from 'lucide-react';

export default function LandingPage({ onEnterDashboard }) {
  return (
    <div className="relative min-h-screen w-full bg-[#030704] text-gray-100 overflow-x-hidden font-sans select-none flex flex-col justify-between">
      {/* Fullscreen Matrix Skull Background with Cyber Vignette */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat bg-cover pointer-events-none opacity-65 filter contrast-125 brightness-105 saturate-125"
        style={{
          backgroundImage: `url('/matrix-skull.png')`,
        }}
      />

      {/* Matrix Green Scanlines & Radial Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030704]/70 via-[#030704]/35 to-[#030704]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,7,4,0.75)_100%)] pointer-events-none" />
      
      {/* Matrix Grid Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #22c55e 1px, transparent 1px), linear-gradient(to bottom, #22c55e 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Cyber Navigation Bar */}
      <header className="relative z-20 h-16 border-b border-emerald-900/40 bg-[#040905]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-mono text-emerald-400 font-bold tracking-widest text-sm flex items-center gap-2 bg-emerald-950/40 px-4 py-2 rounded-lg border border-emerald-900/50">
             <Terminal className="w-4 h-4" />
             Team name: LeaveLeave
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Radar Live Feed removed as requested */}

          <button
            onClick={onEnterDashboard}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>LAUNCH PLATFORM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 flex flex-col items-center justify-center text-center">
        {/* Centered Heading Element removed as requested */}

        {/* Brand Name Headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono leading-none">
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
              AEGIS-INTELLIGENCE
            </span>
          </h1>
          <p className="text-sm sm:text-base font-mono text-emerald-400/90 font-semibold tracking-widest mt-2 uppercase">
            Dark-Web Threat Actor Identity Resolution Platform
          </p>
        </motion.div>

        {/* Lead Narrative */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base text-gray-300 max-w-2xl font-normal leading-relaxed mb-8 backdrop-blur-sm bg-black/40 p-4 rounded-xl border border-emerald-900/40 shadow-xl"
        >
          Autonomous stylometric vector correlation and multi-alias threat actor de-anonymization. Ingests unindexed posts across subterranean markets, computing linguistic cadence, shared n-grams, and interactive cluster graphs.
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-14"
        >
          <button
            onClick={onEnterDashboard}
            className="group relative px-9 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm tracking-wider rounded-xl transition-all duration-300 active:scale-95 flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform" />
            <Terminal className="w-4 h-4 text-black" />
            <span>ENTER AEGIS RESOLUTION MATRIX</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </motion.div>

        {/* 3 Green Matrix Feature Pillar Cards removed as requested */}
      </main>

      {/* Bottom Subtle Terminal Output to fill empty space */}
      <footer className="relative z-20 pb-12 px-6 md:px-12 flex flex-col items-center justify-center text-xs font-mono text-emerald-700/50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="flex flex-col items-center gap-2"
        >
          <Binary className="w-5 h-5 mb-1" />
          <span>[ SYSTEM STANDBY ]</span>
          <span>AWAITING ANALYST INITIALIZATION SEQUENCE...</span>
        </motion.div>
      </footer>
    </div>
  );
}
