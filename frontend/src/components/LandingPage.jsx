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
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Crosshair className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold tracking-widest text-emerald-400 uppercase">
                AEGIS-INTELLIGENCE
              </span>
              <span className="font-mono text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE DEFENSE
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 font-mono tracking-wider">
              TACTICAL THREAT IDENTITY RESOLUTION &bull; CLASSIFIED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs text-emerald-500/80 bg-[#061208] px-3 py-1.5 rounded-lg border border-emerald-800/40">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>RADAR: <strong className="text-emerald-300">LIVE FEED</strong></span>
          </div>

          <button
            onClick={onEnterDashboard}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-[0.98] cursor-pointer"
          >
            <span>LAUNCH PLATFORM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 flex flex-col items-center justify-center text-center">
        {/* Centered Heading Element (from user upload) */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#04160d]/90 border-2 border-emerald-400 text-emerald-300 text-xs sm:text-sm font-mono font-bold mb-8 shadow-[0_0_30px_rgba(16,185,129,0.45)] backdrop-blur-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.65)] hover:border-emerald-300 transition-all duration-300 select-none"
        >
          <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 animate-pulse" />
          <span className="tracking-wide">
            AEGIS VECTOR CORRELATION ENGINE &bull; STYLOMETRIC NLP
          </span>
        </motion.div>

        {/* Brand Name Headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono leading-none">
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.6)]">
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
            className="group relative px-9 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] active:scale-95 flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform" />
            <Terminal className="w-4 h-4 text-black" />
            <span>ENTER AEGIS RESOLUTION MATRIX</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </motion.div>

        {/* 3 Green Matrix Feature Pillar Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left"
        >
          {/* Card 1 */}
          <div className="bg-[#050e07]/85 backdrop-blur-md border border-emerald-800/40 hover:border-emerald-500/60 p-5 rounded-xl transition-all duration-300 space-y-2 group shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <Fingerprint className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Stylometric NLP Profiling
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Extracts semantic embeddings, slang n-grams, sentence length delta, and punctuation cadence via <code className="text-emerald-400 font-mono">all-MiniLM-L6-v2</code>.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#050e07]/85 backdrop-blur-md border border-emerald-800/40 hover:border-emerald-500/60 p-5 rounded-xl transition-all duration-300 space-y-2 group shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <Network className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Force-Directed Topology
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Interactive 2D graph with dynamic confidence threshold filtering, collision avoidance, and glowing cluster intelligence cards.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#050e07]/85 backdrop-blur-md border border-emerald-800/40 hover:border-emerald-500/60 p-5 rounded-xl transition-all duration-300 space-y-2 group shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Staged Threat Ingestion
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Simulate live dark-web alias ingestion in real time. Watch rogue handles resolve automatically into their verified threat clusters.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Cyber Threat Intel Footer */}
      <footer className="relative z-20 border-t border-emerald-900/40 bg-[#030804]/90 px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-emerald-600 gap-2">
        <div className="flex items-center gap-4">
          <span>&copy; 2026 AEGIS-INTELLIGENCE &bull; THREAT RECONNAISSANCE SYSTEMS</span>
          <span>&bull;</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SOC LEVEL 4
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-500/80">POWERED BY FASTAPI &bull; REACT &bull; SENTENCE-TRANSFORMERS</span>
        </div>
      </footer>
    </div>
  );
}
