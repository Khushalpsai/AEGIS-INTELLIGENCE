import React, { useState, useEffect, useCallback, useRef } from 'react';
import InvestigationMode from './components/InvestigationMode';
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
  ExternalLink,
  Home,
  ArrowLeft
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Graph from './components/Graph';
import ThresholdSlider from './components/ThresholdSlider';
import EvidencePanel from './components/EvidencePanel';
import ClusterCards from './components/ClusterCards';
import InjectButton from './components/InjectButton';
import { fetchGraph, fetchAliasDetail, resolveAlias, injectAlias, resetDemo } from './api/client';

export default function App() {
  // Navigation State: 'landing' | 'dashboard'
  const [currentView, setCurrentView] = useState('landing');

  // Graph State
  const [threshold, setThreshold] = useState(0.62);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], clusters: [], staged_aliases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection & Panels
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);
  const [selectedNodeResolution, setSelectedNodeResolution] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('node'); // 'node' | 'edge'

  // Highlight & Injection States
  const [highlightClusterId, setHighlightClusterId] = useState(null);
  const [recentlyInjectedId, setRecentlyInjectedId] = useState(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const debounceTimerRef = useRef(null);

  // Load Graph Data
  const loadGraph = useCallback(async (thresh) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGraph(thresh);
      setGraphData(data);
    } catch (err) {
      console.error("Failed to load graph:", err);
      setError(err.message || "Failed to connect to threat resolution backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadGraph(threshold);
  }, [loadGraph]);

  // Debounced Threshold Change
  const handleThresholdChange = (newThreshold) => {
    setThreshold(newThreshold);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      loadGraph(newThreshold);
      // Refresh selected node resolution if open
      if (selectedNode) {
        resolveAlias(selectedNode.id, newThreshold).then(setSelectedNodeResolution);
      }
    }, 150);
  };

  // Node Click Handler
  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setPanelMode('node');
    setIsPanelOpen(true);

    try {
      const [detail, resolution] = await Promise.all([
        fetchAliasDetail(node.id),
        resolveAlias(node.id, threshold)
      ]);
      setSelectedNodeDetail(detail);
      setSelectedNodeResolution(resolution);
    } catch (err) {
      console.error("Failed to fetch node details:", err);
    }
  };

  // Edge Click Handler
  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setPanelMode('edge');
    setIsPanelOpen(true);
  };

  // Background Click Handler
  const handleBackgroundClick = () => {
    setIsPanelOpen(false);
    setSelectedNode(null);
    setSelectedEdge(null);
    setHighlightClusterId(null);
  };

  // Switch to correlated alias from panel
  const handleSelectAliasById = (aliasId) => {
    const node = graphData.nodes.find(n => n.id === aliasId);
    if (node) {
      handleNodeClick(node);
    }
  };

  // Staged Alias Injection Handler
  const handleInject = async () => {
    setIsInjecting(true);
    try {
      const res = await injectAlias();
      if (res?.injected_alias_id) {
        setRecentlyInjectedId(res.injected_alias_id);
        await loadGraph(threshold);

        setTimeout(() => {
          const targetNode = graphData.nodes.find(n => n.id === res.injected_alias_id);
          if (targetNode) {
            handleNodeClick(targetNode);
          }
        }, 300);

        setTimeout(() => setRecentlyInjectedId(null), 5000);
      }
      return res;
    } finally {
      setIsInjecting(false);
    }
  };

  // Reset Demo
  const handleReset = async () => {
    await resetDemo();
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsPanelOpen(false);
    setHighlightClusterId(null);
    await loadGraph(threshold);
  };

  // Filtered nodes for search list
  const filteredNodes = graphData.nodes.filter(n =>
    n.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

// ... (in App component)
  // Render Landing Page if view is 'landing'
  if (currentView === 'landing') {
    return <LandingPage onEnterDashboard={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'investigation') {
    return <InvestigationMode allNodes={graphData.nodes} onExit={() => setCurrentView('dashboard')} />;
  }

  // Otherwise render the full SOC Resolution Dashboard
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0f] text-gray-100 overflow-hidden font-sans">
      {/* Top Threat-Intel Header Bar */}
      <header className="h-14 bg-[#0d0d14] border-b border-[#1e1e2f] px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            title="Return to Home Overview"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151522] hover:bg-[#1f1f32] border border-[#252538] hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 rounded-lg text-xs font-mono transition-colors mr-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
                AEGIS-INTELLIGENCE // THREAT IDENTITY RESOLUTION
              </h1>
              <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40">
                v1.0-MVP
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Stylometric Vector Similarity &bull; Threat Actor Correlation
            </p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center gap-3 md:gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-[#12121e] px-3 py-1.5 rounded-lg border border-[#1e1e2f]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-gray-400 hidden sm:inline">Backend:</span>
            <span className="text-emerald-400 font-semibold">FastAPI Online</span>
          </div>

          <div className="flex items-center gap-2 bg-[#12121e] px-3 py-1.5 rounded-lg border border-[#1e1e2f]">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-400 hidden sm:inline">Active Aliases:</span>
            <span className="text-cyan-400 font-bold">{graphData.nodes.length}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#12121e] px-3 py-1.5 rounded-lg border border-[#1e1e2f]">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-400 hidden sm:inline">Clusters:</span>
            <span className="text-purple-400 font-bold">{graphData.clusters.length}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Control & Search Sidebar */}
        <aside className="w-80 bg-[#0d0d14]/95 border-r border-[#1e1e2f] p-4 flex flex-col gap-4 z-20 flex-shrink-0 overflow-y-auto">
          {/* Threshold Control Slider */}
          <ThresholdSlider
            threshold={threshold}
            onChange={handleThresholdChange}
            totalEdges={graphData.edges.length}
            totalClusters={graphData.clusters.length}
          />

          {/* Staged Alias Injection Demo Flow */}
          <div className="bg-[#101018]/90 border border-[#1e1e2f] p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Staged Alias Injection
              </span>
              <span className="text-[10px] font-mono text-gray-500">Live Demo</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Inject held-back threat aliases into the active graph to observe real-time cluster resolution.
            </p>
            <InjectButton
              stagedAliases={graphData.staged_aliases || []}
              isInjecting={isInjecting}
              onInject={handleInject}
              onReset={handleReset}
            />
          </div>

          {/* Investigation Mode Toggle */}
          <div className="bg-[#101018]/90 border border-[#1e1e2f] p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Analyst Workflow
              </span>
            </div>
            <button 
              onClick={() => setCurrentView('investigation')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#151624] hover:bg-[#1a1b2e] border border-cyan-500/30 hover:border-cyan-400 rounded-lg text-cyan-400 font-mono text-xs font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Search className="w-4 h-4" />
              Start Investigation Mode
            </button>
          </div>

          {/* Search & Alias Directory */}
          <div className="flex-1 flex flex-col bg-[#101018]/90 border border-[#1e1e2f] p-3.5 rounded-xl space-y-3 min-h-[260px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Alias Directory ({filteredNodes.length})
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search handle or platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c0c12] border border-[#202030] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Scrollable Alias List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[300px]">
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`p-2 rounded-lg cursor-pointer transition-all border text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#18192a] border-cyan-500/50 shadow-sm'
                        : 'bg-[#0d0d16] hover:bg-[#141522] border-[#1c1c2b] hover:border-[#2a2a40]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-[11px] bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {node.id}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-200 text-xs">
                          @{node.username}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {node.platform}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-gray-400 bg-[#161724] px-1.5 py-0.5 rounded">
                      {node.cluster_id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Central Dominant Force Graph Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#0a0a0f]">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl max-w-md space-y-2">
                <h3 className="text-sm font-bold text-rose-400 font-mono uppercase">
                  Backend Offline
                </h3>
                <p className="text-xs text-gray-300">
                  {error}
                </p>
                <button
                  onClick={() => loadGraph(threshold)}
                  className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-mono text-xs font-semibold"
                >
                  Retry Connection
                </button>
              </div>
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

          {/* Right Slide-in Evidence Dossier Panel */}
          <EvidencePanel
            isOpen={isPanelOpen}
            mode={panelMode}
            selectedNodeData={selectedNodeDetail}
            selectedNodeResolution={selectedNodeResolution}
            selectedEdgeData={selectedEdge}
            onClose={() => setIsPanelOpen(false)}
            onSelectAlias={handleSelectAliasById}
          />
        </main>
      </div>

      {/* Bottom Resolved Cluster Cards Strip */}
      <footer className="z-20 flex-shrink-0">
        <ClusterCards
          clusters={graphData.clusters}
          selectedClusterId={highlightClusterId}
          onSelectCluster={(cid) => setHighlightClusterId(cid)}
        />
      </footer>
    </div>
  );
}
