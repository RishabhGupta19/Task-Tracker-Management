// import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// import type { GraphNode, TaskStatus } from '@/types/task';
// import { useGraphData } from '@/hooks/useTasks';
// import { GraphControls } from './GraphControls';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Network } from 'lucide-react';

// const NODE_WIDTH = 160;
// const NODE_HEIGHT = 70;
// const HORIZONTAL_GAP = 60;
// const VERTICAL_GAP = 100;

// const statusColors: Record<TaskStatus, { fill: string; stroke: string }> = {
//   pending: { fill: '#6b7280', stroke: '#4b5563' },
//   in_progress: { fill: '#3b82f6', stroke: '#2563eb' },
//   completed: { fill: '#22c55e', stroke: '#16a34a' },
//   blocked: { fill: '#ef4444', stroke: '#dc2626' },
// };

// interface LayoutNode extends GraphNode {
//   x: number;
//   y: number;
//   level: number;
// }

// function calculateLayout(nodes: GraphNode[], edges: { from: number; to: number }[]): LayoutNode[] {
//   if (nodes.length === 0) return [];

//   // Build adjacency for incoming edges (dependencies)
//   const inDegree = new Map<number, number>();
//   const dependsOn = new Map<number, number[]>();
  
//   nodes.forEach((n) => {
//     inDegree.set(n.id, 0);
//     dependsOn.set(n.id, []);
//   });

//   edges.forEach((e) => {
//     inDegree.set(e.from, (inDegree.get(e.from) || 0) + 1);
//     dependsOn.get(e.from)?.push(e.to);
//   });

//   // Assign levels (top-down: level 0 = no dependencies)
//   const levels = new Map<number, number>();
//   const queue: number[] = [];

//   // Start with nodes that have no dependencies
//   nodes.forEach((n) => {
//     if (inDegree.get(n.id) === 0) {
//       levels.set(n.id, 0);
//       queue.push(n.id);
//     }
//   });

//   while (queue.length > 0) {
//     const current = queue.shift()!;
//     const currentLevel = levels.get(current) || 0;

//     // Find nodes that depend on current
//     edges.forEach((e) => {
//       if (e.to === current) {
//         const nextLevel = Math.max(levels.get(e.from) || 0, currentLevel + 1);
//         levels.set(e.from, nextLevel);
//         if (!queue.includes(e.from)) {
//           queue.push(e.from);
//         }
//       }
//     });
//   }

//   // Handle any unvisited nodes (cycles or isolated)
//   nodes.forEach((n) => {
//     if (!levels.has(n.id)) {
//       levels.set(n.id, 0);
//     }
//   });

//   // Group by level
//   const levelGroups = new Map<number, GraphNode[]>();
//   nodes.forEach((n) => {
//     const level = levels.get(n.id) || 0;
//     if (!levelGroups.has(level)) {
//       levelGroups.set(level, []);
//     }
//     levelGroups.get(level)!.push(n);
//   });

//   // Calculate positions
//   const layoutNodes: LayoutNode[] = [];
//   const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

//   sortedLevels.forEach((level) => {
//     const group = levelGroups.get(level)!;
//     const totalWidth = group.length * NODE_WIDTH + (group.length - 1) * HORIZONTAL_GAP;
//     const startX = -totalWidth / 2;

//     group.forEach((node, index) => {
//       layoutNodes.push({
//         ...node,
//         x: startX + index * (NODE_WIDTH + HORIZONTAL_GAP),
//         y: level * (NODE_HEIGHT + VERTICAL_GAP),
//         level,
//       });
//     });
//   });

//   return layoutNodes;
// }

// export function DependencyGraph() {
//   const { data: graphData, isLoading, error } = useGraphData();
//   const [zoom, setZoom] = useState(1);
//   const [pan, setPan] = useState({ x: 0, y: 0 });
//   const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
//   const svgRef = useRef<SVGSVGElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   const layoutNodes = useMemo(() => {
//     if (!graphData) return [];
//     return calculateLayout(graphData.nodes, graphData.edges);
//   }, [graphData]);

//   const nodeMap = useMemo(() => {
//     const map = new Map<number, LayoutNode>();
//     layoutNodes.forEach((n) => map.set(n.id, n));
//     return map;
//   }, [layoutNodes]);

//   // Center the graph on mount
//   useEffect(() => {
//     if (layoutNodes.length > 0 && containerRef.current) {
//       const container = containerRef.current;
//       setPan({
//         x: container.clientWidth / 2,
//         y: 50,
//       });
//     }
//   }, [layoutNodes.length]);

//   const handleMouseDown = (e: React.MouseEvent) => {
//     if (e.target === svgRef.current || (e.target as Element).tagName === 'svg') {
//       setIsDragging(true);
//       setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
//     }
//   };

//   const handleMouseMove = (e: React.MouseEvent) => {
//     if (isDragging) {
//       setPan({
//         x: e.clientX - dragStart.x,
//         y: e.clientY - dragStart.y,
//       });
//     }
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
//   const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.4));
//   const handleReset = () => {
//     setZoom(1);
//     if (containerRef.current) {
//       setPan({
//         x: containerRef.current.clientWidth / 2,
//         y: 50,
//       });
//     }
//   };

//   const getConnectedNodes = useCallback(
//     (nodeId: number): Set<number> => {
//       if (!graphData) return new Set();
//       const connected = new Set<number>([nodeId]);
      
//       // Add all dependencies (what this node depends on)
//       graphData.edges.forEach((e) => {
//         if (e.from === nodeId) connected.add(e.to);
//         if (e.to === nodeId) connected.add(e.from);
//       });
      
//       return connected;
//     },
//     [graphData]
//   );

//   const connectedNodes = useMemo(
//     () => (selectedNodeId !== null ? getConnectedNodes(selectedNodeId) : null),
//     [selectedNodeId, getConnectedNodes]
//   );

//   if (isLoading) {
//     return <Skeleton className="h-[500px] w-full rounded-lg" />;
//   }

//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-destructive">Error loading graph: {(error as Error).message}</p>
//       </div>
//     );
//   }

//   if (!graphData || graphData.nodes.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//         <h3 className="text-lg font-medium mb-2">No tasks to visualize</h3>
//         <p className="text-muted-foreground">
//           Create some tasks and dependencies to see the graph
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <GraphControls
//         zoom={zoom}
//         onZoomIn={handleZoomIn}
//         onZoomOut={handleZoomOut}
//         onReset={handleReset}
//       />

//       <div className="flex gap-4 text-sm">
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 rounded" style={{ background: statusColors.pending.fill }} />
//           <span>Pending</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 rounded" style={{ background: statusColors.in_progress.fill }} />
//           <span>In Progress</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 rounded" style={{ background: statusColors.completed.fill }} />
//           <span>Completed</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 rounded" style={{ background: statusColors.blocked.fill }} />
//           <span>Blocked</span>
//         </div>
//       </div>

//       <div
//         ref={containerRef}
//         className="relative border rounded-lg bg-muted/20 overflow-hidden"
//         style={{ height: '500px' }}
//       >
//         <svg
//           ref={svgRef}
//           width="100%"
//           height="100%"
//           className="cursor-grab active:cursor-grabbing"
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//         >
//           <defs>
//             <marker
//               id="arrowhead"
//               markerWidth="10"
//               markerHeight="7"
//               refX="9"
//               refY="3.5"
//               orient="auto"
//             >
//               <polygon
//                 points="0 0, 10 3.5, 0 7"
//                 fill="hsl(var(--muted-foreground))"
//               />
//             </marker>
//             <marker
//               id="arrowhead-highlight"
//               markerWidth="10"
//               markerHeight="7"
//               refX="9"
//               refY="3.5"
//               orient="auto"
//             >
//               <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
//             </marker>
//           </defs>

//           <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
//             {/* Edges */}
//             {graphData.edges.map((edge, idx) => {
//               const fromNode = nodeMap.get(edge.from);
//               const toNode = nodeMap.get(edge.to);
//               if (!fromNode || !toNode) return null;

//               const isHighlighted =
//                 selectedNodeId !== null &&
//                 (edge.from === selectedNodeId || edge.to === selectedNodeId);

//               const fromX = fromNode.x + NODE_WIDTH / 2;
//               const fromY = fromNode.y + NODE_HEIGHT;
//               const toX = toNode.x + NODE_WIDTH / 2;
//               const toY = toNode.y;

//               // Curved path
//               const midY = (fromY + toY) / 2;

//               return (
//                 <path
//                   key={idx}
//                   d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
//                   fill="none"
//                   stroke={
//                     isHighlighted
//                       ? 'hsl(var(--primary))'
//                       : 'hsl(var(--muted-foreground))'
//                   }
//                   strokeWidth={isHighlighted ? 2.5 : 1.5}
//                   strokeOpacity={
//                     selectedNodeId === null || isHighlighted ? 1 : 0.3
//                   }
//                   markerEnd={
//                     isHighlighted
//                       ? 'url(#arrowhead-highlight)'
//                       : 'url(#arrowhead)'
//                   }
//                 />
//               );
//             })}

//             {/* Nodes */}
//             {layoutNodes.map((node) => {
//               const colors = statusColors[node.status];
//               const isSelected = node.id === selectedNodeId;
//               const isConnected = connectedNodes?.has(node.id);
//               const opacity =
//                 selectedNodeId === null || isConnected ? 1 : 0.3;

//               return (
//                 <g
//                   key={node.id}
//                   transform={`translate(${node.x}, ${node.y})`}
//                   onClick={() =>
//                     setSelectedNodeId(isSelected ? null : node.id)
//                   }
//                   className="cursor-pointer"
//                   opacity={opacity}
//                 >
//                   <rect
//                     width={NODE_WIDTH}
//                     height={NODE_HEIGHT}
//                     rx={8}
//                     ry={8}
//                     fill={colors.fill}
//                     stroke={isSelected ? 'hsl(var(--primary))' : colors.stroke}
//                     strokeWidth={isSelected ? 3 : 2}
//                   />
//                   <text
//                     x={NODE_WIDTH / 2}
//                     y={NODE_HEIGHT / 2}
//                     textAnchor="middle"
//                     dominantBaseline="middle"
//                     fill="white"
//                     fontSize="12"
//                     fontWeight="500"
//                     className="pointer-events-none"
//                   >
//                     {node.title.length > 18
//                       ? node.title.slice(0, 16) + '...'
//                       : node.title}
//                   </text>
//                 </g>
//               );
//             })}
//           </g>
//         </svg>
//       </div>

//       <p className="text-sm text-muted-foreground text-center">
//         Click on a node to highlight its dependencies. Drag to pan, use controls to zoom.
//       </p>
//     </div>
//   );
// }


import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { GraphNode, TaskStatus } from '@/types/task';
import { useGraphData } from '@/hooks/useTasks';
import { GraphControls } from './GraphControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Network, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 70;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 100;

const statusColors: Record<TaskStatus, { fill: string; stroke: string }> = {
  pending: { fill: '#6b7280', stroke: '#4b5563' },
  in_progress: { fill: '#3b82f6', stroke: '#2563eb' },
  completed: { fill: '#22c55e', stroke: '#16a34a' },
  blocked: { fill: '#ef4444', stroke: '#dc2626' },
};

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  level: number;
}

function calculateLayout(nodes: GraphNode[], edges: { from: number; to: number }[]): LayoutNode[] {
  if (nodes.length === 0) return [];

  // Build adjacency for incoming edges (dependencies)
  const inDegree = new Map<number, number>();
  const dependsOn = new Map<number, number[]>();
  
  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    dependsOn.set(n.id, []);
  });

  edges.forEach((e) => {
    inDegree.set(e.from, (inDegree.get(e.from) || 0) + 1);
    dependsOn.get(e.from)?.push(e.to);
  });

  // Assign levels (top-down: level 0 = no dependencies)
  const levels = new Map<number, number>();
  const queue: number[] = [];

  // Start with nodes that have no dependencies
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;

    // Find nodes that depend on current
    edges.forEach((e) => {
      if (e.to === current) {
        const nextLevel = Math.max(levels.get(e.from) || 0, currentLevel + 1);
        levels.set(e.from, nextLevel);
        if (!queue.includes(e.from)) {
          queue.push(e.from);
        }
      }
    });
  }

  // Handle any unvisited nodes (cycles or isolated)
  nodes.forEach((n) => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  // Group by level
  const levelGroups = new Map<number, GraphNode[]>();
  nodes.forEach((n) => {
    const level = levels.get(n.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(n);
  });

  // Calculate positions
  const layoutNodes: LayoutNode[] = [];
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

  sortedLevels.forEach((level) => {
    const group = levelGroups.get(level)!;
    const totalWidth = group.length * NODE_WIDTH + (group.length - 1) * HORIZONTAL_GAP;
    const startX = -totalWidth / 2;

    group.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        x: startX + index * (NODE_WIDTH + HORIZONTAL_GAP),
        y: level * (NODE_HEIGHT + VERTICAL_GAP),
        level,
      });
    });
  });

  return layoutNodes;
}

export function DependencyGraph() {
  const { data: graphData, isLoading, error } = useGraphData();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const layoutNodes = useMemo(() => {
    if (!graphData) return [];
    return calculateLayout(graphData.nodes, graphData.edges);
  }, [graphData]);

  const nodeMap = useMemo(() => {
    const map = new Map<number, LayoutNode>();
    layoutNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layoutNodes]);

  // Center the graph on mount
  useEffect(() => {
    if (layoutNodes.length > 0 && containerRef.current) {
      const container = containerRef.current;
      setPan({
        x: container.clientWidth / 2,
        y: 50,
      });
    }
  }, [layoutNodes.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.4));
  const handleReset = () => {
    setZoom(1);
    if (containerRef.current) {
      setPan({
        x: containerRef.current.clientWidth / 2,
        y: 50,
      });
    }
  };

  const handleExportPNG = useCallback(async () => {
    if (!svgRef.current || !containerRef.current) return;

    try {
      const svg = svgRef.current;
      
      // Clone the SVG
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      
      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      layoutNodes.forEach((node) => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + NODE_WIDTH);
        maxY = Math.max(maxY, node.y + NODE_HEIGHT);
      });

      const padding = 40;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      // Update cloned SVG
      clonedSvg.setAttribute('width', String(width));
      clonedSvg.setAttribute('height', String(height));
      clonedSvg.style.background = '#ffffff';

      // Update transform on the g element
      const gElement = clonedSvg.querySelector('g');
      if (gElement) {
        gElement.setAttribute('transform', `translate(${-minX + padding}, ${-minY + padding})`);
      }

      // Convert to data URL
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Create canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2; // 2x for better quality
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0);
          
          // Download
          const link = document.createElement('a');
          link.download = 'dependency-graph.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          toast.success('Graph exported as PNG');
        }
        
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        toast.error('Failed to export graph');
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      toast.error('Failed to export graph');
    }
  }, [layoutNodes]);

  const getConnectedNodes = useCallback(
    (nodeId: number): Set<number> => {
      if (!graphData) return new Set();
      const connected = new Set<number>([nodeId]);
      
      // Add all dependencies (what this node depends on)
      graphData.edges.forEach((e) => {
        if (e.from === nodeId) connected.add(e.to);
        if (e.to === nodeId) connected.add(e.from);
      });
      
      return connected;
    },
    [graphData]
  );

  const connectedNodes = useMemo(
    () => (selectedNodeId !== null ? getConnectedNodes(selectedNodeId) : null),
    [selectedNodeId, getConnectedNodes]
  );

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full rounded-lg" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading graph: {(error as Error).message}</p>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No tasks to visualize</h3>
        <p className="text-muted-foreground">
          Create some tasks and dependencies to see the graph
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <GraphControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
        <Button variant="outline" size="sm" onClick={handleExportPNG}>
          <Download className="h-4 w-4 mr-1" />
          Export PNG
        </Button>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: statusColors.pending.fill }} />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: statusColors.in_progress.fill }} />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: statusColors.completed.fill }} />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: statusColors.blocked.fill }} />
          <span>Blocked</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative border rounded-lg bg-muted/20 overflow-hidden"
        style={{ height: '500px' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--muted-foreground))"
              />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges - Arrow points FROM dependency TO dependent task */}
            {graphData.edges.map((edge, idx) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted =
                selectedNodeId !== null &&
                (edge.from === selectedNodeId || edge.to === selectedNodeId);

              // Arrow goes from toNode (dependency) to fromNode (dependent)
              const startX = toNode.x + NODE_WIDTH / 2;
              const startY = toNode.y + NODE_HEIGHT;
              const endX = fromNode.x + NODE_WIDTH / 2;
              const endY = fromNode.y;

              // Calculate horizontal offset for better curve visibility when nodes are on same level
              const horizontalDiff = endX - startX;
              const verticalDiff = endY - startY;
              
              // For edges going to same node from same level, add curve offset
              const sameLevel = toNode.level === fromNode.level - 1 || Math.abs(verticalDiff) < NODE_HEIGHT + VERTICAL_GAP;
              const curveOffset = sameLevel ? horizontalDiff * 0.3 : 0;
              
              // Curved path with distinct control points for each edge
              const midY = (startY + endY) / 2;
              const controlX1 = startX + curveOffset;
              const controlX2 = endX - curveOffset;

              return (
                <path
                  key={idx}
                  d={`M ${startX} ${startY} C ${controlX1} ${midY}, ${controlX2} ${midY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={
                    isHighlighted
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground))'
                  }
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeOpacity={
                    selectedNodeId === null || isHighlighted ? 1 : 0.3
                  }
                  markerEnd={
                    isHighlighted
                      ? 'url(#arrowhead-highlight)'
                      : 'url(#arrowhead)'
                  }
                />
              );
            })}

            {/* Nodes */}
            {layoutNodes.map((node) => {
              const colors = statusColors[node.status];
              const isSelected = node.id === selectedNodeId;
              const isConnected = connectedNodes?.has(node.id);
              const opacity =
                selectedNodeId === null || isConnected ? 1 : 0.3;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() =>
                    setSelectedNodeId(isSelected ? null : node.id)
                  }
                  className="cursor-pointer"
                  opacity={opacity}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={8}
                    ry={8}
                    fill={colors.fill}
                    stroke={isSelected ? 'hsl(var(--primary))' : colors.stroke}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="500"
                    className="pointer-events-none"
                  >
                    {node.title.length > 18
                      ? node.title.slice(0, 16) + '...'
                      : node.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Click on a node to highlight its dependencies. Drag to pan, use controls to zoom.
      </p>
    </div>
  );
}

