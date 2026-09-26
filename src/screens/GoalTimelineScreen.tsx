import React from 'react';
import { useFinFam } from '../context/FinFamContext';
import { GoalConflictHeatmap } from '../components/goalPlanning/GoalConflictHeatmap';
import { FinancialEngine } from '../lib/financialEngine';
import { GoalFeasibilityEngine } from '../lib/goalPlanning/GoalFeasibilityEngine';
import { Calendar, AlertTriangle, ArrowRight, ShieldCheck, Clock, Network } from 'lucide-react';

interface GoalTimelineScreenProps {
  onNavigate: (route: string) => void;
}

export const GoalTimelineScreen: React.FC<GoalTimelineScreenProps> = ({ onNavigate }) => {
  const { goals, sharedTimeline, goalConflicts } = useFinFam();

  const activeGoals = goals.filter((g) => !g.archived);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Shared Cashflow Timeline Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Milestone Cashflow Horizon
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulates all household commitments on one single financial timeline from now through completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('goal_interference')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <Network className="w-3.5 h-3.5" /> Interference Map
          </button>
        </div>
      </div>

      {/* Goal Horizon Gantt / Span Overview */}
      <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Milestone Funding Horizons & Overlaps
        </h3>

        <div className="space-y-3">
          {activeGoals.map((g) => {
            const monthsRemaining = Math.max(
              GoalFeasibilityEngine.calculateMonthsRemaining(g.targetDate),
              1
            );
            const spanPercent = Math.min((monthsRemaining / 120) * 100, 100);

            return (
              <div key={g.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{g.emoji}</span>
                    <span className="font-bold text-white">{g.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Target: {g.targetDate})
                    </span>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">
                    {monthsRemaining} months runway
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      g.priority === 1
                        ? 'bg-rose-500'
                        : g.priority === 2
                        ? 'bg-purple-500'
                        : g.priority === 3
                        ? 'bg-cyan-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(spanPercent, 8)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Timeline Heatmap */}
      {sharedTimeline && <GoalConflictHeatmap timeline={sharedTimeline.timeline} />}
    </div>
  );
};
