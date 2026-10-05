import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { Post, CoordinationResult } from '../types';

interface NetworkGraphProps {
  coordination: CoordinationResult;
  posts: Post[];
}

interface GraphNode {
  id: string;
  val: number;
  color: string;
  label: string;
}

interface GraphLink {
  source: string;
  target: string;
  similarity: number;
}

function countsForNode(username: string, posts: Post[]) {
  return posts.filter(post => post.username === username).length;
}

export default function NetworkGraph({ coordination, posts }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 350 });
  const [ForceGraph, setForceGraph] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Dynamically import react-force-graph-2d to avoid SSR issues
  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setForceGraph(() => mod.default);
    }).catch(() => {
      // If the import fails, we'll show a fallback
      console.warn('react-force-graph-2d not available, using fallback');
    });
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: 350,
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const coordAccountSet = useMemo(() => {
    const set = new Set<string>();
    coordination.clusters.forEach(c => c.accounts.forEach(a => set.add(a)));
    return set;
  }, [coordination]);

  const graphData = useMemo(() => {
    // Count posts per username
    const counts = new Map<string, number>();
    const synthetics = new Set<string>();
    posts.forEach(p => {
      counts.set(p.username, (counts.get(p.username) || 0) + 1);
      if (p._synthetic) synthetics.add(p.username);
    });

    // Top 30 by post count
    const topUsers = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    const nodes: GraphNode[] = topUsers.map(([username, count]) => ({
      id: username,
      val: Math.max(2, Math.min(8, count)),
      color: username === selectedNode || coordination.clusters.some(cluster => cluster.relationships.some(edge => (edge.source === selectedNode && edge.target === username) || (edge.target === selectedNode && edge.source === username))) ? '#1E3A5F' : synthetics.has(username)
        ? '#CBD5E1'
        : coordAccountSet.has(username)
          ? '#B45309'
          : '#0F766E',
      label: username,
    }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const links: GraphLink[] = [];

    coordination.clusters.forEach(cluster => {
      cluster.relationships.forEach(edge => {
        if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) links.push({ source: edge.source, target: edge.target, similarity: edge.similarity });
      });
    });

    return { nodes, links };
  }, [posts, coordAccountSet, coordination, selectedNode]);

  useEffect(() => {
    const charge = graphRef.current?.d3Force('charge');
    const link = graphRef.current?.d3Force('link');
    charge?.strength(-180);
    link?.distance(72);
  }, [ForceGraph, graphData.nodes.length, graphData.links.length]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = node.val || 3;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

  }, []);

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Network Graph</h2>
      <div ref={containerRef} style={{ height: 350, position: 'relative' }}>
        {graphData.nodes.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Waiting for data...</p>
        ) : ForceGraph ? (
          <ForceGraph
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val || 3, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkColor={() => '#CBD5E1'}
            linkWidth={(link: GraphLink) => 0.7 + link.similarity * 1.5}
            linkLabel={(link: GraphLink) => `Text similarity ${Math.round(link.similarity * 100)}%`}
            nodeLabel={(node: GraphNode) => `${node.label} · ${countsForNode(node.id, posts)} posts`}
            onNodeClick={(node: GraphNode) => setSelectedNode(node.id === selectedNode ? null : node.id)}
            warmupTicks={80}
            cooldownTicks={180}
            d3AlphaDecay={0.025}
            d3VelocityDecay={0.35}
            enableZoomInteraction={false}
            backgroundColor="transparent"
          />
        ) : (
          <svg viewBox="0 0 800 350" className="w-full h-full" role="img" aria-label="Account coordination network">
            {graphData.links.map((link, index) => {
              const sourceIndex = graphData.nodes.findIndex(node => node.id === link.source);
              const targetIndex = graphData.nodes.findIndex(node => node.id === link.target);
              const point = (i: number) => ({ x: 400 + 145 * Math.cos((2 * Math.PI * i) / Math.max(graphData.nodes.length, 1)), y: 170 + 125 * Math.sin((2 * Math.PI * i) / Math.max(graphData.nodes.length, 1)) });
              const source = point(sourceIndex), target = point(targetIndex);
              return <line key={`${link.source}-${link.target}-${index}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#CBD5E1" strokeWidth="1.5" />;
            })}
            {graphData.nodes.map((node, index) => {
              const angle = (2 * Math.PI * index) / Math.max(graphData.nodes.length, 1);
              const x = 400 + 145 * Math.cos(angle), y = 170 + 125 * Math.sin(angle);
              return <g key={node.id}><title>{node.label} · {countsForNode(node.id, posts)} posts</title><circle cx={x} cy={y} r="7" fill={node.color} /><text x={x} y={y + 20} textAnchor="middle" fontSize="10" fill="#475569">{node.label.slice(0, 16)}</text></g>;
            })}
          </svg>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Hover over an account to see its name and post count; click to highlight connected accounts.</p>
      {coordAccountSet.size > 0 && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-600" />
            <span className="text-[10px] text-slate-400">Coordinated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[10px] text-slate-400">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[10px] text-slate-400">Synthetic</span>
          </div>
        </div>
      )}
    </div>
  );
}
