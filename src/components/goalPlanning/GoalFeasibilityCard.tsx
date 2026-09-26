import React from 'react';
import { GoalItem, GoalFeasibilityResult } from '../../types/goalPlanning';
import { FinancialEngine } from '../../lib/financialEngine';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Network,
  TrendingUp,
  Plus
} from 'lucide-react';

interface GoalFeasibilityCardProps {
  goal: GoalItem;
  feasibility: GoalFeasibilityResult;
  onTopUp?: (goal: GoalItem) => void;
  onSimulateRipple?: (goal: GoalItem) => void;
  onViewInterference?: (goal: GoalItem) => void;
  onEditGoal?: (goal: GoalItem) => void;
}

export const GoalFeasibilityCard: React.FC<GoalFeasibilityCardProps> = ({
  goal,
  feasibility,
  onTopUp,
  onSimulateRipple,
  onViewInterference,
  onEditGoal
}) => {
  const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const isCompleted = feasibility.isCompleted;

  const statusBadge =
    feasibility.status === 'COMPLETED'
      ? { text: 'COMPLETED', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
      : feasibility.status === 'CONFLICT'
      ? { text: 'CONFLICT', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
      : feasibility.status === 'AT_RISK'
      ? { text: 'AT RISK', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
      : { text: 'ON TRACK', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };

  const priorityBadge =
    goal.priorityLabel === 'CRITICAL'
      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      : goal.priorityLabel === 'HIGH'
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      : goal.priorityLabel === 'MEDIUM'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-slate-800 text-slate-400 border-white/5';

  return (
    <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all relative overflow-hidden group">
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1.5 rounded-xl bg-white/5">{goal.emoji}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{goal.name}</h3>
                {goal.hardDeadline ? (
                  <span title="Locked Hard Deadline (Non-negotiable)" className="text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span title="Flexible Deadline" className="text-slate-500">
                    <Unlock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Target: {goal.targetDate} • {goal.category}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${statusBadge.bg}`}>
              {statusBadge.text}
            </span>
            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${priorityBadge}`}>
              {goal.priorityLabel}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 font-bold">
              {FinancialEngine.formatINR(goal.currentAmount)}
            </span>
            <span className="text-slate-400 font-medium">
              Goal: {FinancialEngine.formatINR(goal.targetAmount)} ({pct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
            <span className="text-[10px] text-slate-400">Required Monthly</span>
            <div className="font-mono font-bold text-white text-xs mt-0.5">
              {FinancialEngine.formatINR(feasibility.requiredMonthlyContribution)}/mo
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
            <span className="text-[10px] text-slate-400">Assigned Allocation</span>
            <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">
              {FinancialEngine.formatINR(goal.monthlyAllocation || 0)}/mo
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
            <span className="text-[10px] text-slate-400">Monthly Gap</span>
            <div
              className={`font-mono font-bold text-xs mt-0.5 ${
                feasibility.monthlyShortfall > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {feasibility.monthlyShortfall > 0
                ? `-${FinancialEngine.formatINR(feasibility.monthlyShortfall)}`
                : 'Fully Funded'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
            <span className="text-[10px] text-slate-400">Predicted Finish</span>
            <div className="font-mono font-bold text-slate-200 text-xs mt-0.5 truncate">
              {feasibility.projectedCompletionDate}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
        {onTopUp && (
          <button
            onClick={() => onTopUp(goal)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center justify-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Top Up
          </button>
        )}
        {onSimulateRipple && (
          <button
            onClick={() => onSimulateRipple(goal)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30 flex items-center justify-center gap-1 transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> Ripple
          </button>
        )}
        {onViewInterference && (
          <button
            onClick={() => onViewInterference(goal)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1 transition-all"
            title="Inspect Resource Competition"
          >
            <Network className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
