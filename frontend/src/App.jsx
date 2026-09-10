import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Radio,
  Search,
  Terminal,
  Database,
  Activity,
  RefreshCw,
  Cpu,
  Home,
  ArrowLeft,
  Crosshair,
  Layers,
  Sliders,
  Zap,
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Graph from './components/Graph';
import ThresholdSlider from './components/ThresholdSlider';
import EvidencePanel from './components/EvidencePanel';
import ClusterCards from './components/ClusterCards';
import InjectButton from './components/InjectButton';
import InvestigationMode from './components/InvestigationMode';
import { fetchGraph, fetchAliasDetail, resolveAlias, injectAlias, resetDemo } from './api/client';

import SideSection from './components/SideSection';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');

  // Graph state
  const [threshold, setThreshold] = useState(0.62);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], clusters: [], staged_aliases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection & panel
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);
  const [selectedNodeResolution, setSelectedNodeResolution] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('node');

  // Highlight & injection
  const [highlightClusterId, setHighlightClusterId] = useState(null);
  const [recentlyInjectedId, setRecentlyInjectedId] = useState(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const debounceTimerRef = useRef(null);

  // ── Data loading ─────────────────────────────────────
  const loadGraph = useCallback(async (thresh) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGraph(thresh);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load graph:', err);
      setError(err.message || 'Failed to connect to threat resolution backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGraph(threshold); }, [loadGraph]);

  const handleThresholdChange = (val) => {
    setThreshold(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      loadGraph(val);
      if (selectedNode) resolveAlias(selectedNode.id, val).then(setSelectedNodeResolution);
    }, 150);
  };

  // ── Interaction handlers ─────────────────────────────
  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setPanelMode('node');
    setIsPanelOpen(true);
    try {
      const [detail, resolution] = await Promise.all([
        fetchAliasDetail(node.id),
        resolveAlias(node.id, threshold),
      ]);
      setSelectedNodeDetail(detail);
      setSelectedNodeResolution(resolution);
    } catch (err) {
      console.error('Failed to fetch node details:', err);
    }
  };

  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setPanelMode('edge');
    setIsPanelOpen(true);
  };

  const handleBackgroundClick = () => {
    setIsPanelOpen(false);
    setSelectedNode(null);
    setSelectedEdge(null);
    setHighlightClusterId(null);
  };

  const handleSelectAliasById = (aliasId) => {
    const node = graphData.nodes.find(n => n.id === aliasId);
    if (node) handleNodeClick(node);
  };

  const handleInject = async () => {
    setIsInjecting(true);
    try {
      const res = await injectAlias();
      if (res?.injected_alias_id) {
        setRecentlyInjectedId(res.injected_alias_id);
        await loadGraph(threshold);
        setTimeout(() => {
          const targetNode = graphData.nodes.find(n => n.id === res.injected_alias_id);
          if (targetNode) handleNodeClick(targetNode);
        }, 300);
        setTimeout(() => setRecentlyInjectedId(null), 5000);
      }
      return res;
    } finally {
      setIsInjecting(false);
    }
  };

  const handleReset = async () => {
    await resetDemo();
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsPanelOpen(false);
    setHighlightClusterId(null);
    await loadGraph(threshold);
  };

  const filteredNodes = graphData.nodes.filter(n =>
    n.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Views ────────────────────────────────────────────
  if (currentView === 'landing') {
    return <LandingPage onEnterDashboard={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'investigation') {
    return <InvestigationMode allNodes={graphData.nodes} onExit={() => setCurrentView('dashboard')} />;
  }

  // ── Dashboard ────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen bg-[#09080a] text-[#eae6f0] overflow-hidden">

      {/* ── Header ──────────────────────────────────── */}
      <header className="h-12 flex-shrink-0 bg-[#0e0c0f] border-b border-[#2a2535] px-4 flex items-center justify-between z-30">
        {/* Left: home + brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141218] hover:bg-[#1a1720] border border-[#2a2535] hover:border-[#3d3850] text-[#9d98aa] hover:text-[#eae6f0] rounded-lg text-xs font-mono transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="h-5 w-px bg-[#2a2535]" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <Shield className="w-3 h-3 text-amber-400" />
            </div>
            <span className="font-mono text-xs font-bold text-[#eae6f0] tracking-wider hidden sm:block">
              AEGIS-INTELLIGENCE
            </span>
            <span className="font-mono text-[10px] text-[#5a5568] border border-[#2a2535] px-1.5 py-0.5 rounded">
              THREAT RESOLUTION
            </span>
          </div>
        </div>

        {/* Right: live status badges */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#141218] border border-[#2a2535] rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#9d98aa]">Backend</span>
            <span className="text-emerald-400 font-semibold">Online</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141218] border border-[#2a2535] rounded-lg">
            <Database className="w-3 h-3 text-amber-400" />
            <span className="text-[#9d98aa] hidden sm:inline">Aliases</span>
            <span className="text-amber-400 font-bold">{graphData.nodes.length}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141218] border border-[#2a2535] rounded-lg">
            <Layers className="w-3 h-3 text-violet-400" />
            <span className="text-[#9d98aa] hidden sm:inline">Clusters</span>
            <span className="text-violet-400 font-bold">{graphData.clusters.length}</span>
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141218] border border-amber-500/30 rounded-lg text-amber-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Loading</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Workspace ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">

        {/* ── Left Sidebar ──────────────────────────── */}
        <aside className="w-72 flex-shrink-0 bg-[#0e0c0f] border-r border-[#2a2535] p-3 space-y-3 overflow-y-auto z-20 min-h-0">

          {/* Threshold */}
          <SideSection title="Similarity Threshold" icon={Sliders}>
            <ThresholdSlider
              threshold={threshold}
              onChange={handleThresholdChange}
              totalEdges={graphData.edges.length}
              totalClusters={graphData.clusters.length}
            />
          </SideSection>

          {/* Inject */}
          <SideSection title="Staged Injection" icon={Zap}>
            <p className="text-[11px] text-[#5a5568] font-mono mb-2.5 leading-relaxed">
              Inject held-back aliases to observe real-time cluster resolution.
            </p>
            <InjectButton
              stagedAliases={graphData.staged_aliases || []}
              isInjecting={isInjecting}
              onInject={handleInject}
              onReset={handleReset}
            />
          </SideSection>

          {/* Investigation mode */}
          <SideSection title="Analyst Workflow" icon={Crosshair}>
            <button
              onClick={() => setCurrentView('investigation')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#1a1720] hover:bg-[#201d28] border border-amber-500/25 hover:border-amber-500/60 text-amber-400 font-mono text-xs font-bold rounded-lg transition-all"
            >
              <Terminal className="w-3.5 h-3.5" />
              Start Investigation Mode
            </button>
          </SideSection>

          {/* Alias directory */}
          <SideSection title="Alias Directory" icon={Database} defaultOpen={true}>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5568]" />
              <input
                type="text"
                placeholder="Handle, ID or platform..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#141218] border border-[#2a2535] focus:border-amber-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#eae6f0] placeholder-[#5a5568] font-mono outline-none transition-colors"
              />
            </div>

            <div className="space-y-1 overflow-y-auto pr-0.5">
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-[#141218] hover:bg-[#1a1720] border-[#2a2535] hover:border-[#3d3850]'
                    }`}
                  >
                    <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border flex-shrink-0 ${
                      isSelected
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-[#9d98aa] bg-[#1a1720] border-[#2a2535]'
                    }`}>
                      {node.id}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#eae6f0] truncate">@{node.username}</div>
                      <div className="text-[10px] text-[#5a5568] font-mono">{node.platform}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SideSection>
        </aside>

        {/* ── Graph canvas ──────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#9d98aa] font-mono">
              <Shield className="w-10 h-10 text-[#f43f5e]/40" />
              <p className="text-sm text-[#f43f5e]">Backend connection failed</p>
              <p className="text-xs text-[#5a5568] max-w-xs text-center">{error}</p>
              <button
                onClick={() => loadGraph(threshold)}
                className="mt-2 px-4 py-2 bg-[#141218] border border-[#2a2535] hover:border-amber-500/40 text-amber-400 rounded-lg text-xs font-mono transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : (
            <Graph
              nodes={graphData.nodes}
              edges={graphData.edges}
              clusters={graphData.clusters}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              highlightCluster={highlightClusterId}
              injectedNodeId={recentlyInjectedId}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onBackgroundClick={handleBackgroundClick}
            />
          )}

          {/* Evidence panel */}
          <EvidencePanel
            isOpen={isPanelOpen}
            mode={panelMode}
            selectedNodeData={selectedNodeDetail}
            selectedNodeResolution={selectedNodeResolution}
            selectedEdgeData={selectedEdge}
            onClose={() => { setIsPanelOpen(false); setSelectedNode(null); setSelectedEdge(null); }}
            onSelectAlias={handleSelectAliasById}
          />
        </div>
      </div>

      {/* ── Cluster cards footer ─────────────────────── */}
      <ClusterCards
        clusters={graphData.clusters}
        selectedClusterId={highlightClusterId}
        onSelectCluster={setHighlightClusterId}
      />
    </div>
  );
}
