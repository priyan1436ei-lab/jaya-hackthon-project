import React, { useState } from 'react';
import {
  InterferenceNode,
  InterferenceEdge,
  InterferenceMatrixResult
} from '../../types/goalPlanning';
import { FinancialEngine } from '../../lib/financialEngine';
import { Network, Table, Info, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

interface GoalInterferenceGraphProps {
  data: InterferenceMatrixResult;
  onSelectGoal?: (goalId: number) => void;
}

export const GoalInterferenceGraph: React.FC<GoalInterferenceGraphProps> = ({
  data,
  onSelectGoal
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(data.nodes[0]?.goalId ?? null);
  const [selectedEdge, setSelectedEdge] = useState<InterferenceEdge | null>(data.highestInterferenceEdge || null);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  const { nodes, edges } = data;

  // Compute 2D positions for nodes on SVG circular layout
  const width = 600;
  const height = 440;
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const radius = Math.min(width, height) * 0.36;

  const nodePositions: Record<number, { x: number; y: number }> = {};
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1) - Math.PI / 2;
    nodePositions[node.goalId] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const selectedNode = nodes.find((n) => n.goalId === selectedNodeId) || null;

  const getSeverityStroke = (severity: string, isHighlighted: boolean) => {
    if (isHighlighted) return '#EC4899'; // Highlight Pink
    switch (severity) {
      case 'CRITICAL':
        return '#F43F5E'; // Rose 500
      case 'HIGH':
        return '#F97316'; // Orange 500
      case 'MEDIUM':
        return '#FBBF24'; // Amber 400
      default:
        return '#38BDF8'; // Sky 400
    }
  };

  const getSeverityStrokeWidth = (severity: string, isHighlighted: boolean) => {
    if (isHighlighted) return 4.5;
    switch (severity) {
      case 'CRITICAL':
        return 3.5;
      case 'HIGH':
        return 2.5;
      case 'MEDIUM':
        return 1.8;
      default:
        return 1.2;
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Goal Interference & Resource Competition Map</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Counterfactual competition model: Quantifies how funding one milestone reduces surplus for others.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl bg-slate-900 p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'graph' ? 'bg-cyan-500 text-[#050816]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" /> Graph
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-cyan-500 text-[#050816]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Accessible Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Interactive SVG Network */}
          <div className="lg:col-span-8 flex justify-center bg-gradient-to-b from-[#090E1F] to-[#0D152A] rounded-2xl p-3 border border-white/5 relative overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full max-w-[560px] h-auto select-none"
              style={{ filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.08))' }}
            >
              <defs>
                {/* Arrowhead marker */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
                </marker>
                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                </marker>
              </defs>

              {/* Edge lines */}
              {edges.map((edge) => {
                const srcPos = nodePositions[edge.sourceGoalId];
                const tgtPos = nodePositions[edge.targetGoalId];
                if (!srcPos || !tgtPos) return null;

                const isSelected =
                  selectedEdge?.sourceGoalId === edge.sourceGoalId &&
                  selectedEdge?.targetGoalId === edge.targetGoalId;

                const isConnectedToSelectedNode =
                  selectedNodeId === edge.sourceGoalId || selectedNodeId === edge.targetGoalId;

                const strokeColor = getSeverityStroke(edge.severity, isSelected);
                const strokeWidth = getSeverityStrokeWidth(edge.severity, isSelected);
                const opacity = isSelected ? 1 : isConnectedToSelectedNode ? 0.85 : 0.25;

                return (
                  <g key={`${edge.sourceGoalId}_${edge.targetGoalId}`} className="cursor-pointer">
                    <line
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeDasharray={edge.severity === 'CRITICAL' ? '4 2' : 'none'}
                      onClick={() => setSelectedEdge(edge)}
                    />
                  </g>
                );
              })}

              {/* Node Circles */}
              {nodes.map((node) => {
                const pos = nodePositions[node.goalId];
                if (!pos) return null;

                const isSelected = node.goalId === selectedNodeId;
                const nodeColor =
                  node.status === 'COMPLETED'
                    ? '#10B981'
                    : node.status === 'CONFLICT'
                    ? '#F43F5E'
                    : node.status === 'AT_RISK'
                    ? '#F59E0B'
                    : '#06B6D4';

                return (
                  <g
                    key={node.goalId}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedNodeId(node.goalId);
                      if (onSelectGoal) onSelectGoal(node.goalId);
                      const matchingEdge = edges.find((e) => e.sourceGoalId === node.goalId);
                      if (matchingEdge) setSelectedEdge(matchingEdge);
                    }}
                  >
                    {/* Glow ring if selected */}
                    {isSelected && (
                      <circle
                        r="32"
                        fill="none"
                        stroke="#06B6D4"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-spin-slow"
                      />
                    )}

                    {/* Base Node */}
                    <circle
                      r="24"
                      fill="#0E1528"
                      stroke={isSelected ? '#38BDF8' : nodeColor}
                      strokeWidth={isSelected ? '3' : '2'}
                    />

                    {/* Emoji */}
                    <text
                      textAnchor="middle"
                      dy="5"
                      fontSize="16"
                      className="pointer-events-none select-none"
                    >
                      {node.emoji}
                    </text>

                    {/* Goal Label text */}
                    <text
                      textAnchor="middle"
                      dy="38"
                      fill="#F8FAFC"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {node.goalName.length > 15 ? `${node.goalName.slice(0, 13)}..` : node.goalName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Inspection Side Panel */}
          <div className="lg:col-span-4 space-y-4">
            {selectedEdge && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {selectedEdge.severity} Competition
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    Score: {selectedEdge.interferenceScore}/100
                  </span>
                </div>

                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-cyan-400">{selectedEdge.sourceGoalName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-purple-400">{selectedEdge.targetGoalName}</span>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Estimated Monthly Impact:{' '}
                  <span className="font-bold text-white">
                    {FinancialEngine.formatINR(selectedEdge.monthlyImpact)}/mo
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                  {selectedEdge.reason}
                </p>
              </div>
            )}

            {selectedNode && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedNode.emoji}</span>
                    <span className="font-bold text-white truncate max-w-[140px]">
                      {selectedNode.goalName}
                    </span>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {selectedNode.priorityLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Required:</span>
                    <div className="font-mono font-bold text-white">
                      {FinancialEngine.formatINR(selectedNode.requiredMonthly)}/mo
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Alloc:</span>
                    <div className="font-mono font-bold text-slate-200">
                      {FinancialEngine.formatINR(selectedNode.allocatedMonthly)}/mo
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Feasibility:</span>
                    <div className="font-mono font-bold text-emerald-400">
                      {selectedNode.feasibilityScore}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Interference In:</span>
                    <div className="font-mono font-bold text-rose-400">
                      {selectedNode.incomingInterferenceScore}/100
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Accessible Matrix View */
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-900/80 text-slate-400 font-mono border-b border-white/10">
              <tr>
                <th className="px-3 py-2.5">Source Milestone</th>
                <th className="px-3 py-2.5">Impacted Milestone</th>
                <th className="px-3 py-2.5">Severity</th>
                <th className="px-3 py-2.5">Competition Score</th>
                <th className="px-3 py-2.5">Monthly Impact</th>
                <th className="px-3 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {edges.map((e) => (
                <tr key={`${e.sourceGoalId}_${e.targetGoalId}`} className="hover:bg-white/5">
                  <td className="px-3 py-2.5 font-bold text-white">{e.sourceGoalName}</td>
                  <td className="px-3 py-2.5 text-slate-200">{e.targetGoalName}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        e.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : e.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold">{e.interferenceScore}/100</td>
                  <td className="px-3 py-2.5 font-mono text-white">
                    {FinancialEngine.formatINR(e.monthlyImpact)}/mo
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-400 max-w-xs">{e.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
