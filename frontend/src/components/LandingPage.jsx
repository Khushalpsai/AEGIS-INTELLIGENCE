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
  Binary
} from 'lucide-react';

export default function LandingPage({ onEnterDashboard }) {
  return (
    <div className="relative min-h-screen w-full bg-[#07070b] text-gray-100 overflow-x-hidden font-sans select-none flex flex-col justify-between">
      {/* Background Matrix Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Cyber Glow Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Cyber Navigation Bar */}
      <header className="relative z-20 h-16 border-b border-[#181826] bg-[#0a0a10]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-white uppercase">
                SHADOW-ID // INTEL
              </span>
              <span className="font-mono text-[10px] bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ONLINE
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              DARK-WEB THREAT ACTOR RESOLUTION PLATFORM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs text-gray-400 bg-[#10101a] px-3 py-1.5 rounded-lg border border-[#1e1e2f]">
            <Binary className="w-3.5 h-3.5 text-cyan-400" />
            <span>PROTOCOL: <strong className="text-cyan-300">STYLOMETRY-V3</strong></span>
          </div>

          <button
            onClick={onEnterDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-mono text-xs font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] cursor-pointer"
          >
            <span>LAUNCH DASHBOARD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Section with Centered Matrix Skull */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col items-center justify-center text-center">
        {/* Top Classified HUD Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121220] border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-6 shadow-sm"
        >
          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
          <span>CYBER THREAT INTELLIGENCE &bull; VECTOR SIMILARITY ENGINE</span>
        </motion.div>

        {/* Matrix Skull Graphic Centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative mb-8 group"
        >
          {/* Cyber HUD Outer Bracket Rings */}
          <div className="absolute -inset-6 rounded-full border border-cyan-500/20 border-dashed animate-spin-slow pointer-events-none" />
          <div className="absolute -inset-10 rounded-full border border-emerald-500/10 pointer-events-none" />

          {/* Matrix Skull Image Container */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-black shadow-2xl shadow-emerald-500/20">
            <img 
              src="/matrix-skull.png" 
              alt="Cyber Threat Intel Matrix Skull" 
              className="w-full h-full object-cover filter contrast-125 hover:scale-105 transition-transform duration-700"
            />
            {/* Scanline CRT Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent pointer-events-none animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
            
            {/* Corner Cyber HUD Accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />
          </div>

          {/* Floating Telemetry Tag */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0c0c16] border border-emerald-500/40 px-3 py-1 rounded-md text-[10px] font-mono text-emerald-400 font-bold tracking-wider shadow-lg">
            [ THREAT ACTOR RADAR: ACTIVE ]
          </div>
        </motion.div>

        {/* Hero Headline & Lead Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight font-mono mb-4"
        >
          DARK-WEB THREAT ACTOR <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            IDENTITY RESOLUTION ENGINE
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm md:text-base text-gray-400 max-w-2xl font-normal leading-relaxed mb-8"
        >
          Ingests unindexed dark-web posts across rogue forums and escrow marketplaces. Uses stylometric vector embeddings, cadence attribution, and interactive force-directed graph topologies to de-anonymize threat actor aliases.
        </motion.p>

        {/* Primary Action Button (Next / Enter) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-14"
        >
          <button
            onClick={onEnterDashboard}
            className="group relative px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-sm tracking-wider rounded-xl transition-all duration-300 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 active:scale-95 flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform" />
            <Terminal className="w-4 h-4 text-black" />
            <span>ENTER RESOLUTION DASHBOARD</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Feature Cards Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left"
        >
          {/* Card 1 */}
          <div className="bg-[#0f101a]/80 backdrop-blur-md border border-[#1e1e30] hover:border-cyan-500/40 p-5 rounded-xl transition-all duration-300 space-y-2 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <Fingerprint className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Stylometric NLP Embeddings
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Extracts semantic patterns, slang n-grams, sentence length delta, and punctuation cadence using <code className="text-cyan-300 font-mono">all-MiniLM-L6-v2</code>.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0f101a]/80 backdrop-blur-md border border-[#1e1e30] hover:border-emerald-500/40 p-5 rounded-xl transition-all duration-300 space-y-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <Network className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Force-Directed Clustering
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Interactive 2D graph with dynamic confidence threshold filtering, collision avoidance, and Aceternity glowing cluster cards.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0f101a]/80 backdrop-blur-md border border-[#1e1e30] hover:border-purple-500/40 p-5 rounded-xl transition-all duration-300 space-y-2 group">
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Live Staged Threat Injection
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Simulate live threat actor ingestion in real time. Watch isolated handles resolve instantly into their ground-truth clusters.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Cyber Threat Intel Footer */}
      <footer className="relative z-20 border-t border-[#181826] bg-[#0a0a10]/90 px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-500 gap-2">
        <div className="flex items-center gap-4">
          <span>&copy; 2026 SHADOW-ID DEFENSE SYSTEMS</span>
          <span>&bull;</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SOC LEVEL 4
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">FASTAPI + REACT + SENTENCE-TRANSFORMERS</span>
        </div>
      </footer>
    </div>
  );
}
