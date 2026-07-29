import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  MarkerType
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { SourceInfo, TargetInfo, TransformationItem } from '../services/analysisEngine';

interface DataFlowGraphProps {
  sources: SourceInfo;
  targets: TargetInfo;
  transformations: TransformationItem[];
}

export const DataFlowGraph: React.FC<DataFlowGraphProps> = ({ sources, targets, transformations }) => {
  
  const { nodes, edges } = useMemo(() => {
    const listNodes: Node[] = [];
    const listEdges: Edge[] = [];

    // 1. Add Source Nodes
    const sourceTables = sources.tables.length > 0 ? sources.tables : ['Raw Input Stream'];
    const sourceYOffset = 100;
    const sourceSpacing = 90;

    sourceTables.forEach((table, index) => {
      listNodes.push({
        id: `source-${index}`,
        position: { x: 50, y: sourceYOffset + (index * sourceSpacing) },
        data: { 
          label: (
            <div className="px-3 py-2 text-left">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Source Table</div>
              <div className="font-mono text-xs font-semibold text-white truncate max-w-[160px]">{table}</div>
              <div className="text-[9px] text-slate-400 truncate max-w-[160px]">Extract Database</div>
            </div>
          )
        },
        style: {
          background: '#0b1f1a',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#fff',
          boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
          width: 180
        }
      });

      // Edge from source to load
      listEdges.push({
        id: `e-source-${index}-load`,
        source: `source-${index}`,
        target: 'load-op',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10b981'
        }
      });
    });

    // Calculate center Y position for core process stages
    const totalSourcesHeight = sourceTables.length * sourceSpacing;
    const centerY = Math.max(150, (sourceYOffset + totalSourcesHeight / 2) - 40);

    // 2. Add Load Node
    listNodes.push({
      id: 'load-op',
      position: { x: 300, y: centerY },
      data: {
        label: (
          <div className="px-3 py-2 text-left">
            <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Load Stage</div>
            <div className="font-semibold text-xs text-white">Ingest & Stage</div>
            <div className="text-[9px] text-slate-400 font-mono">OP: {targets.operation || 'INSERT'}</div>
          </div>
        )
      },
      style: {
        background: '#0c1b35',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        color: '#fff',
        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
        width: 160
      }
    });

    // 3. Add Transform Node
    const transformLabels = transformations.slice(0, 3).map(t => t.type).join(', ') || 'Transforms';
    listNodes.push({
      id: 'transform-op',
      position: { x: 520, y: centerY },
      data: {
        label: (
          <div className="px-3 py-2 text-left">
            <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Transform Stage</div>
            <div className="font-semibold text-xs text-white">Data Processing</div>
            <div className="text-[9px] text-purple-200 truncate max-w-[140px] font-mono">{transformLabels}</div>
          </div>
        )
      },
      style: {
        background: '#1c133a',
        border: '1px solid #a855f7',
        borderRadius: '8px',
        color: '#fff',
        boxShadow: '0 4px 6px -1px rgba(168, 85, 247, 0.1)',
        width: 160
      }
    });

    // Connect Load -> Transform
    listEdges.push({
      id: 'e-load-transform',
      source: 'load-op',
      target: 'transform-op',
      style: { stroke: '#3b82f6', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6'
      }
    });

    // 4. Add Target/Destination Nodes
    const targetTables = targets.tables.length > 0 ? targets.tables : ['analytics_target'];
    targetTables.forEach((table, index) => {
      listNodes.push({
        id: `target-${index}`,
        position: { x: 740, y: centerY + (index * 90) },
        data: {
          label: (
            <div className="px-3 py-2 text-left">
              <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">Target Table</div>
              <div className="font-mono text-xs font-semibold text-white truncate max-w-[160px]">{table}</div>
              <div className="text-[9px] text-slate-400">Data Warehouse</div>
            </div>
          )
        },
        style: {
          background: '#240f1a',
          border: '1px solid #f43f5e',
          borderRadius: '8px',
          color: '#fff',
          boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.1)',
          width: 180
        }
      });

      // Connect Transform -> Target
      listEdges.push({
        id: `e-transform-target-${index}`,
        source: 'transform-op',
        target: `target-${index}`,
        style: { stroke: '#a855f7', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a855f7'
        }
      });
    });

    return { nodes: listNodes, edges: listEdges };
  }, [sources, targets, transformations]);

  return (
    <div className="w-full h-[400px] bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner">
      <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs flex items-center space-x-2">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-300 font-medium">Interactive Data Flow Lineage</span>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="text-white"
        minZoom={0.5}
        maxZoom={1.5}
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#334155" gap={16} size={1} />
        <Controls showInteractive={false} className="!bg-slate-950 !border-slate-800 !text-white [&>button]:!bg-slate-950 [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>svg]:!fill-white hover:[&>button]:!bg-slate-800" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.id.startsWith('source')) return '#10b981';
            if (node.id === 'load-op') return '#3b82f6';
            if (node.id === 'transform-op') return '#a855f7';
            if (node.id.startsWith('target')) return '#f43f5e';
            return '#ccc';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="!bg-slate-950 !border-slate-800"
        />
      </ReactFlow>
    </div>
  );
};
