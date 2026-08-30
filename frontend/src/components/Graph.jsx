import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide, forceManyBody, forceLink } from 'd3-force';
import { ZoomIn, ZoomOut, Maximize2, Shield, Eye, Layers } from 'lucide-react';

// Distinct palette for identity clusters
const CLUSTER_COLORS = [
  '#22d3ee', // Cyan (Primary)
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#8b5cf6', // Indigo
  '#64748b'  // Slate (Singletons)
];

export default function Graph({
  nodes = [],
  edges = [],
  clusters = [],
  selectedNode = null,
  selectedEdge = null,
  highlightCluster = null,
  injectedNodeId = null,
  onNodeClick,
  onEdgeClick,
  onBackgroundClick
}) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Resize handler
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Configure custom D3 forces for collision avoidance and legible node spacing
  useEffect(() => {
    if (fgRef.current) {
      // 1. Collision force: 48px radius ensures nodes and their text labels never collide or overlap
      fgRef.current.d3Force('collide', forceCollide().radius(48).iterations(3));

      // 2. Repulsion charge: tuned to keep clusters distinct with clear visual separation
      fgRef.current.d3Force('charge', forceManyBody().strength(-350).distanceMax(500));

      // 3. Link distance: comfortable separation between strongly-correlated nodes
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(85).strength(0.4);
      }

      // Reheat simulation slightly to settle into collision-free positions
      fgRef.current.d3ReheatSimulation();
    }
  }, [nodes.length, edges.length]);

  // Map cluster_id to color index
  const clusterColorMap = useMemo(() => {
    const map = {};
    clusters.forEach((c, idx) => {
      map[c.cluster_id] = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
    });
    return map;
  }, [clusters]);

  // Format graph data for react-force-graph
  const graphData = useMemo(() => {
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, { ...n }));

    const validLinks = edges.map(e => ({
      ...e,
      source: typeof e.source === 'object' ? e.source.id : e.source,
      target: typeof e.target === 'object' ? e.target.id : e.target
    })).filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));

    return {
      nodes: Array.from(nodeMap.values()),
      links: validLinks
    };
  }, [nodes, edges]);

  // Center/fit graph view
  const handleZoomFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 60);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.3, 300);
    }
  };

  // Helper to draw pill backdrop for labels to guarantee 100% legibility
  const drawLabelPill = (ctx, text, x, y, fontSize, textColor, bgColor, borderColor) => {
    ctx.font = text.font || `500 ${fontSize}px 'Inter', sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const paddingX = 4;
    const paddingY = 2;
    const boxW = textWidth + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const boxX = x - boxW / 2;
    const boxY = y - boxH / 2;

    // Background pill
    ctx.fillStyle = bgColor || 'rgba(10, 10, 16, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.75;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }

    // Text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  };

  // Canvas Node Rendering
  const drawNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const isInjected = injectedNodeId === node.id;
    const isHighlightedInCluster = highlightCluster && node.cluster_id === highlightCluster;

    const baseRadius = 10;
    const radius = isSelected || isHovered ? baseRadius * 1.35 : baseRadius;
    const color = clusterColorMap[node.cluster_id] || '#22d3ee';

    // 1. Aceternity-style Spotlight Outer Glow
    if (isSelected || isHovered || isInjected || isHighlightedInCluster) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 10, 0, 2 * Math.PI, false);
      const gradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius + 12);
      gradient.addColorStop(0, `${color}99`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Pulsing Ring for Injected or Selected Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Node Core Background & Border
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#0d0d15';
    ctx.fill();
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    // 3. Inner Center Pip
    ctx.beginPath();
    ctx.arc(node.x, node.y, 3.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // 4. Node Alias ID Header Label (e.g. "A1") with dedicated dark pill
    const idFontSize = Math.max(9.5 / globalScale, 9);
    ctx.font = `700 ${idFontSize}px 'JetBrains Mono', monospace`;
    drawLabelPill(
      ctx,
      node.id,
      node.x,
      node.y - radius - 7,
      idFontSize,
      '#ffffff',
      'rgba(12, 12, 20, 0.90)',
      `${color}66`
    );

    // 5. Username & Platform Labels with high-contrast background pill
    const userFontSize = Math.max(8.5 / globalScale, 8);
    ctx.font = `500 ${userFontSize}px 'Inter', sans-serif`;
    drawLabelPill(
      ctx,
      `@${node.username}`,
      node.x,
      node.y + radius + 8,
      userFontSize,
      '#e2e8f0',
      'rgba(10, 10, 16, 0.92)',
      '#1e1e30'
    );

    const platformFontSize = Math.max(7.5 / globalScale, 7);
    ctx.font = `600 ${platformFontSize}px 'JetBrains Mono', monospace`;
    drawLabelPill(
      ctx,
      `[${node.platform}]`,
      node.x,
      node.y + radius + 19,
      platformFontSize,
      color,
      'rgba(10, 10, 16, 0.88)',
      null
    );
  }, [selectedNode, hoveredNode, injectedNodeId, highlightCluster, clusterColorMap]);

  // Canvas Link Rendering
  const drawLink = useCallback((link, ctx, globalScale) => {
    const isSelected = selectedEdge && (
      (selectedEdge.source === link.source.id && selectedEdge.target === link.target.id) ||
      (selectedEdge.source === link.target.id && selectedEdge.target === link.source.id)
    );
    const isHovered = hoveredEdge && (
      (hoveredEdge.source.id === link.source.id && hoveredEdge.target.id === link.target.id) ||
      (hoveredEdge.source.id === link.target.id && hoveredEdge.target.id === link.source.id)
    );

    const score = link.score || 0.6;
    const normalizedScore = Math.max(0, Math.min(1, (score - 0.5) / 0.4));
    const baseAlpha = 0.25 + normalizedScore * 0.65;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);

    if (isSelected || isHovered) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = `rgba(34, 211, 238, ${baseAlpha})`;
      ctx.lineWidth = 1.2 + normalizedScore * 2;
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Render edge score label with high-contrast pill
    if (globalScale > 1.2 || isSelected || isHovered) {
      const midX = (link.source.x + link.target.x) / 2;
      const midY = (link.source.y + link.target.y) / 2;
      const labelFontSize = Math.max(8 / globalScale, 8);
      
      ctx.font = `600 ${labelFontSize}px 'JetBrains Mono', monospace`;
      const text = score.toFixed(2);
      drawLabelPill(
        ctx,
        text,
        midX,
        midY,
        labelFontSize,
        isSelected || isHovered ? '#22d3ee' : '#94a3b8',
        'rgba(10, 10, 16, 0.90)',
        isSelected || isHovered ? '#22d3ee' : '#222236'
      );
    }
  }, [selectedEdge, hoveredEdge]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0f] overflow-hidden select-none">
      {/* Background Cyber Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Viewport Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-[#101018]/90 backdrop-blur-md border border-[#1e1e2f] p-1.5 rounded-lg shadow-2xl">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a28] rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a28] rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomFit}
          title="Fit All"
          className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a28] rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div 
          className="absolute top-4 left-4 z-20 pointer-events-none bg-[#12121e]/95 border border-cyan-500/40 px-3 py-2 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in duration-150"
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: clusterColorMap[hoveredNode.cluster_id] || '#22d3ee' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white">{hoveredNode.id}</span>
              <span className="text-xs text-gray-300 font-semibold">@{hoveredNode.username}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
              <span>Platform: <strong className="text-gray-200">{hoveredNode.platform}</strong></span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">{hoveredNode.cluster_id}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2D Force Graph with Collision Protection and Legible Layout */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel=""
        nodeRelSize={10}
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        onNodeClick={(node) => onNodeClick && onNodeClick(node)}
        onLinkClick={(link) => onEdgeClick && onEdgeClick(link)}
        onBackgroundClick={() => onBackgroundClick && onBackgroundClick()}
        onNodeHover={(node) => setHoveredNode(node || null)}
        onLinkHover={(link) => setHoveredEdge(link || null)}
        cooldownTicks={120}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        warmupTicks={60}
      />
    </div>
  );
}
