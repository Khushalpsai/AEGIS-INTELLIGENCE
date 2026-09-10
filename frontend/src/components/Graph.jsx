import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide, forceManyBody, forceLink } from 'd3-force';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';

// ── Cluster color palette ────────────────────────────
const CLUSTER_COLORS = [
  '#f59e0b', // Amber
  '#a78bfa', // Violet
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#38bdf8', // Sky
  '#fb923c', // Orange
  '#34d399', // Green
  '#e879f9', // Fuchsia
  '#8b5cf6', // Purple
  '#64748b', // Slate (singleton fallback)
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
  onBackgroundClick,
}) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // ── Resize handler ────────────────────────────────
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // ── D3 force physics ──────────────────────────────
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('collide', forceCollide().radius(48).iterations(3));
      fgRef.current.d3Force('charge', forceManyBody().strength(-350).distanceMax(500));
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(85).strength(0.4);
      }
      fgRef.current.d3ReheatSimulation();
    }
  }, [nodes.length, edges.length]);

  // ── Cluster color map ─────────────────────────────
  const clusterColorMap = useMemo(() => {
    const map = {};
    clusters.forEach((c, idx) => {
      map[c.cluster_id] = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
    });
    return map;
  }, [clusters]);

  // ── Graph data ────────────────────────────────────
  const graphData = useMemo(() => {
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, { ...n }));

    const validLinks = edges
      .map(e => ({
        ...e,
        source: typeof e.source === 'object' ? e.source.id : e.source,
        target: typeof e.target === 'object' ? e.target.id : e.target,
      }))
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));

    return {
      nodes: Array.from(nodeMap.values()),
      links: validLinks,
    };
  }, [nodes, edges]);

  // ── Zoom controls ─────────────────────────────────
  const handleZoomFit = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 60);
  };
  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
  };
  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 300);
  };

  // ── Draw label pill helper ────────────────────────
  const drawLabelPill = (ctx, text, x, y, fontSize, textColor, bgColor, borderColor) => {
    ctx.font = `500 ${fontSize}px 'Inter', sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const paddingX = 4;
    const paddingY = 2;
    const boxW = textWidth + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const boxX = x - boxW / 2;
    const boxY = y - boxH / 2;

    // Pill background
    ctx.fillStyle = bgColor || '#0e0c0f';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.75;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }

    // Text
    ctx.fillStyle = textColor || '#eae6f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  };

  // ── Node rendering ────────────────────────────────
  const drawNode = useCallback(
    (node, ctx, globalScale) => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const isInjected = injectedNodeId === node.id;
      const isHighlighted = highlightCluster && node.cluster_id === highlightCluster;

      const baseRadius = 10;
      const radius = isSelected || isHovered ? baseRadius * 1.35 : baseRadius;
      const color = clusterColorMap[node.cluster_id] || '#f59e0b';

      // 1. Outer glow for highlights
      if (isSelected || isHovered || isInjected || isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, 2 * Math.PI, false);
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          radius,
          node.x,
          node.y,
          radius + 12
        );
        gradient.addColorStop(0, `${color}99`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Pulsing dashed ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Node core
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#0e0c0f';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = color;
      ctx.stroke();

      // 3. Inner pip
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();

      // 4. ID label above node
      const idFontSize = Math.max(9.5 / globalScale, 9);
      ctx.font = `700 ${idFontSize}px 'JetBrains Mono', monospace`;
      drawLabelPill(
        ctx,
        node.id,
        node.x,
        node.y - radius - 7,
        idFontSize,
        '#eae6f0',
        'rgba(14, 12, 15, 0.92)',
        `${color}66`
      );

      // 5. Username label below node
      const userFontSize = Math.max(8.5 / globalScale, 8);
      ctx.font = `500 ${userFontSize}px 'Inter', sans-serif`;
      drawLabelPill(
        ctx,
        `@${node.username}`,
        node.x,
        node.y + radius + 8,
        userFontSize,
        '#9d98aa',
        'rgba(14, 12, 15, 0.94)',
        '#2a2535'
      );

      // 6. Platform label further below
      const platformFontSize = Math.max(7.5 / globalScale, 7);
      ctx.font = `600 ${platformFontSize}px 'JetBrains Mono', monospace`;
      drawLabelPill(
        ctx,
        `[${node.platform}]`,
        node.x,
        node.y + radius + 19,
        platformFontSize,
        color,
        'rgba(14, 12, 15, 0.90)',
        null
      );
    },
    [
      selectedNode,
      hoveredNode,
      injectedNodeId,
      highlightCluster,
      clusterColorMap,
    ]
  );

  // ── Link rendering ────────────────────────────────
  const drawLink = useCallback(
    (link, ctx, globalScale) => {
      const isSelected =
        selectedEdge &&
        ((selectedEdge.source === link.source.id && selectedEdge.target === link.target.id) ||
          (selectedEdge.source === link.target.id && selectedEdge.target === link.source.id));
      const isHovered =
        hoveredEdge &&
        ((hoveredEdge.source.id === link.source.id && hoveredEdge.target.id === link.target.id) ||
          (hoveredEdge.source.id === link.target.id && hoveredEdge.target.id === link.source.id));

      const score = link.score || 0.6;
      const normalizedScore = Math.max(0, Math.min(1, (score - 0.5) / 0.4));
      const baseAlpha = 0.2 + normalizedScore * 0.6;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = `rgba(245, 158, 11, ${baseAlpha})`;
        ctx.lineWidth = 1.2 + normalizedScore * 2;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Edge score label
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
          isSelected || isHovered ? '#f59e0b' : '#9d98aa',
          'rgba(14, 12, 15, 0.90)',
          isSelected || isHovered ? '#f59e0b' : '#2a2535'
        );
      }
    },
    [selectedEdge, hoveredEdge]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#09080a] overflow-hidden select-none"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Force graph canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        onNodeClick={onNodeClick}
        onNodeHover={setHoveredNode}
        onLinkClick={onEdgeClick}
        onLinkHover={setHoveredEdge}
        onBackgroundClick={onBackgroundClick}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        cooldownTicks={120}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        warmupTicks={60}
        backgroundColor="transparent"
      />

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-[#0e0c0f]/90 backdrop-blur-md border border-[#2a2535] p-1 rounded-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-[#9d98aa] hover:text-amber-400 hover:bg-[#1a1720] rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-[#9d98aa] hover:text-amber-400 hover:bg-[#1a1720] rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomFit}
          title="Fit All"
          className="p-1.5 text-[#9d98aa] hover:text-amber-400 hover:bg-[#1a1720] rounded transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none bg-[#0e0c0f]/95 border border-amber-500/30 px-3 py-2 rounded-lg backdrop-blur-md flex items-center gap-3 animate-in fade-in duration-150">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: clusterColorMap[hoveredNode.cluster_id] || '#f59e0b' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#eae6f0]">
                {hoveredNode.id}
              </span>
              <span className="text-xs text-[#9d98aa] font-semibold">
                @{hoveredNode.username}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#5a5568] font-mono">
              <span>
                Platform: <strong className="text-[#9d98aa]">{hoveredNode.platform}</strong>
              </span>
              <span>•</span>
              <span
                className="font-semibold"
                style={{ color: clusterColorMap[hoveredNode.cluster_id] || '#f59e0b' }}
              >
                {hoveredNode.cluster_id}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
