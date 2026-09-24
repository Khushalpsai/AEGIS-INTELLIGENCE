import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide, forceManyBody, forceLink } from 'd3-force';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const CLUSTER_COLORS = [
  '#00d4aa','#38bdf8','#a78bfa','#f43f5e',
  '#fbbf24','#fb923c','#34d399','#e879f9',
  '#8b5cf6','#64748b',
];

export default function Graph({ nodes=[], edges=[], clusters=[], selectedNode=null, selectedEdge=null, highlightCluster=null, injectedNodeId=null, onNodeClick, onEdgeClick, onBackgroundClick }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  useEffect(() => {
    const upd = () => {
      if (containerRef.current) setDims({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force('collide', forceCollide().radius(50).iterations(3));
    fgRef.current.d3Force('charge', forceManyBody().strength(-380).distanceMax(500));
    const lf = fgRef.current.d3Force('link');
    if (lf) lf.distance(90).strength(0.4);
    fgRef.current.d3ReheatSimulation();
  }, [nodes.length, edges.length]);

  const colorMap = useMemo(() => {
    const m = {};
    clusters.forEach((c, i) => { m[c.cluster_id] = CLUSTER_COLORS[i % CLUSTER_COLORS.length]; });
    return m;
  }, [clusters]);

  const graphData = useMemo(() => {
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, { ...n }));
    const links = edges
      .map(e => ({ ...e, source: typeof e.source === 'object' ? e.source.id : e.source, target: typeof e.target === 'object' ? e.target.id : e.target }))
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));
    return { nodes: Array.from(nodeMap.values()), links };
  }, [nodes, edges]);

  const pill = (ctx, text, x, y, fontSize, textColor, bgColor, borderColor) => {
    ctx.font = `500 ${fontSize}px 'JetBrains Mono', monospace`;
    const w = ctx.measureText(text).width + 8;
    const h = fontSize + 4;
    ctx.fillStyle = bgColor;
    ctx.fillRect(x - w/2, y - h/2, w, h);
    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - w/2, y - h/2, w, h);
    }
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  };

  const drawNode = useCallback((node, ctx, gs) => {
    const isSel  = selectedNode?.id === node.id;
    const isHov  = hoveredNode?.id === node.id;
    const isInj  = injectedNodeId === node.id;
    const isHl   = highlightCluster && node.cluster_id === highlightCluster;
    const r      = isSel || isHov ? 12 : 9;
    const color  = colorMap[node.cluster_id] || '#00d4aa';

    // Glow halo
    if (isSel || isHov || isInj || isHl) {
      const g = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 14);
      g.addColorStop(0, `${color}55`);
      g.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 14, 0, 2 * Math.PI);
      ctx.fillStyle = g;
      ctx.fill();

      // dashed ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Core — dark fill, colored border
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0b0d';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = isSel ? 2.5 : 1.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Labels
    const idFs   = Math.max(9 / gs, 8.5);
    const userFs = Math.max(8 / gs, 7.5);
    const platFs = Math.max(7 / gs, 7);

    ctx.font = `700 ${idFs}px 'JetBrains Mono', monospace`;
    pill(ctx, node.id, node.x, node.y - r - 7, idFs, '#cdd6e0', 'rgba(10,11,13,0.94)', `${color}55`);

    ctx.font = `500 ${userFs}px 'JetBrains Mono', monospace`;
    pill(ctx, `@${node.username}`, node.x, node.y + r + 8, userFs, '#8899aa', 'rgba(10,11,13,0.9)', '#1e252e');

    ctx.font = `600 ${platFs}px 'JetBrains Mono', monospace`;
    pill(ctx, `[${node.platform}]`, node.x, node.y + r + 19, platFs, color, 'rgba(10,11,13,0.88)', null);
  }, [selectedNode, hoveredNode, injectedNodeId, highlightCluster, colorMap]);

  const drawLink = useCallback((link, ctx, gs) => {
    const isSel = selectedEdge && (
      (selectedEdge.source === link.source.id && selectedEdge.target === link.target.id) ||
      (selectedEdge.source === link.target.id && selectedEdge.target === link.source.id)
    );
    const isHov = hoveredEdge && (
      (hoveredEdge.source.id === link.source.id && hoveredEdge.target.id === link.target.id) ||
      (hoveredEdge.source.id === link.target.id && hoveredEdge.target.id === link.source.id)
    );

    const score = link.score || 0.6;
    const norm  = Math.max(0, Math.min(1, (score - 0.5) / 0.4));
    const alpha = 0.15 + norm * 0.55;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);

    if (isSel || isHov) {
      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00d4aa';
      ctx.shadowBlur = 6;
    } else {
      ctx.strokeStyle = `rgba(0, 212, 170, ${alpha})`;
      ctx.lineWidth = 1 + norm * 1.8;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (gs > 1.3 || isSel || isHov) {
      const mx = (link.source.x + link.target.x) / 2;
      const my = (link.source.y + link.target.y) / 2;
      const lf = Math.max(7.5 / gs, 7.5);
      ctx.font = `600 ${lf}px 'JetBrains Mono', monospace`;
      pill(ctx, score.toFixed(2), mx, my, lf,
        isSel || isHov ? '#00d4aa' : '#5a6a7a',
        'rgba(10,11,13,0.92)',
        isSel || isHov ? '#00d4aa55' : '#1e252e'
      );
    }
  }, [selectedEdge, hoveredEdge]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0b0d] overflow-hidden select-none">

      {/* Dot-matrix background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #00d4aa 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <ForceGraph2D
        ref={fgRef}
        width={dims.width}
        height={dims.height}
        graphData={graphData}
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        onNodeClick={onNodeClick}
        onNodeHover={setHoveredNode}
        onLinkClick={onEdgeClick}
        onLinkHover={setHoveredEdge}
        onBackgroundClick={onBackgroundClick}
        enableNodeDrag
        enableZoomInteraction
        cooldownTicks={120}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        warmupTicks={60}
        backgroundColor="transparent"
      />

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col border border-[#1e252e] bg-[#0e1012]">
        {[
          { fn: () => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 250), Icon: ZoomIn,   title: 'Zoom In'  },
          { fn: () => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 250), Icon: ZoomOut,  title: 'Zoom Out' },
          { fn: () => fgRef.current?.zoomToFit(400, 60),                    Icon: Maximize2, title: 'Fit'      },
        ].map(({ fn, Icon, title }) => (
          <button key={title} onClick={fn} title={title}
            className="p-2 text-[#5a6a7a] hover:text-[#00d4aa] hover:bg-[#12151a] border-b border-[#1e252e] last:border-0 transition-colors">
            <Icon className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-[#0e1012] border border-[#1e252e] px-3 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5" style={{ backgroundColor: colorMap[hoveredNode.cluster_id] || '#00d4aa' }} />
            <span className="font-mono text-[11px] font-bold text-[#cdd6e0]">{hoveredNode.id}</span>
            <span className="font-mono text-[11px] text-[#8899aa]">@{hoveredNode.username}</span>
          </div>
          <div className="font-mono text-[9px] text-[#5a6a7a]">
            {hoveredNode.platform} · {hoveredNode.cluster_id}
          </div>
        </div>
      )}
    </div>
  );
}
