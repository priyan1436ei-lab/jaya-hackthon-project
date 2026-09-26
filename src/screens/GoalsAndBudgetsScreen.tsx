import React from 'react';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PieChart,
  Network,
  Zap,
  Sliders,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';
import { useFinFam } from '../context/FinFamContext';
import { FinancialEngine } from '../lib/financialEngine';
import { GoalItem } from '../types';
import { GoalFeasibilityEngine } from '../lib/goalPlanning/GoalFeasibilityEngine';

interface GoalsAndBudgetsScreenProps {
  onOpenAddGoal: () => void;
  onOpenAddBudget: () => void;
  onSelectGoalForTopUp: (goal: GoalItem) => void;
  onNavigate?: (route: string) => void;
}

export const GoalsAndBudgetsScreen: React.FC<GoalsAndBudgetsScreenProps> = ({
  onOpenAddGoal,
  onOpenAddBudget,
  onSelectGoalForTopUp,
  onNavigate
}) => {
  const { goals, budgets, deleteGoal, deleteBudget, goalFeasibilities } = useFinFam();

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Goals Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Savings Milestones & Family Goals
              </h2>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('goal_portfolio')}
                  className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Multi-Goal Portfolio Engine <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulate wealth for vehicles, vacations, emergency reserves, and major milestones
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigate && (
              <button
                onClick={() => onNavigate('goal_interference')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <Network className="w-3.5 h-3.5 text-cyan-400" /> Interference Map
              </button>
            )}
            <button
              onClick={onOpenAddGoal}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add Goal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const feas =
              goalFeasibilities[goal.id] || GoalFeasibilityEngine.calculateGoalFeasibility(goal);
            const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            const isDone = pct >= 100;

            const priorityBadge =
              goal.priorityLabel === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : goal.priorityLabel === 'HIGH'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                : goal.priorityLabel === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-white/5';

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.emoji}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${priorityBadge}`}>
                        {goal.priorityLabel || 'HIGH'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          feas.status === 'ON_TRACK' || isDone
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : feas.status === 'CONFLICT'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {feas.status} ({feas.feasibilityScore}%)
                      </span>

                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <h3 className="text-sm font-bold text-white truncate max-w-[170px]">{goal.name}</h3>
                    {goal.hardDeadline ? (
                      <span title="Locked Hard Deadline" className="text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span title="Flexible Deadline" className="text-slate-500">
                        <Unlock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Target: {goal.targetDate}</span>
                    <span>•</span>
                    <span className="text-purple-400 font-semibold">{goal.category}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-mono mt-1.5">
                    <span className="text-slate-200 font-bold">
                      {FinancialEngine.formatINR(goal.currentAmount)}
                    </span>
                    <span className="text-slate-400">
                      Goal: {FinancialEngine.formatINR(goal.targetAmount)} ({pct}%)
                    </span>
                  </div>

                  {/* Multi-goal metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5 text-[11px] font-mono">
                    <div className="p-1.5 rounded-lg bg-black/20">
                      <span className="text-[10px] text-slate-400 block font-sans">Required Monthly</span>
                      <span className="font-bold text-white">
                        {FinancialEngine.formatINR(feas.requiredMonthlyContribution)}/mo
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/20">
                      <span className="text-[10px] text-slate-400 block font-sans">Allocated Monthly</span>
                      <span className="font-bold text-cyan-300">
                        {FinancialEngine.formatINR(goal.monthlyAllocation || 0)}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex gap-1.5">
                  <button
                    onClick={() => onSelectGoalForTopUp(goal)}
                    className="flex-1 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all flex items-center justify-center gap-1"
                  >
                    + Top Up
                  </button>
                  {onNavigate && (
                    <>
                      <button
                        onClick={() => onNavigate('ripple_simulator')}
                        className="py-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-semibold text-xs border border-purple-500/30 transition-all"
                        title="Simulate Ripple Effect"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onNavigate('goal_interference')}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/10 transition-all"
                        title="View Goal Interference"
                      >
                        <Network className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Category Budgets Section */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" />
              Category Spending Caps
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Prevent household overspending with automated alert thresholds
            </p>
          </div>

          <button
            onClick={onOpenAddBudget}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#050816] text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const spentPct = Math.min(Math.round((b.spent / b.monthlyLimit) * 100), 100);
            const isOver = b.spent > b.monthlyLimit;

            return (
              <div
                key={b.id}
                className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isOver ? 'text-rose-400' : spentPct > 85 ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {spentPct}%
                      </span>
                      <button
                        onClick={() => deleteBudget(b.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-rose-500'
                          : spentPct > 85
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-mono mt-2">
                    <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      Spent: {FinancialEngine.formatINR(b.spent)}
                    </span>
                    <span className="text-slate-400">
                      Cap: {FinancialEngine.formatINR(b.monthlyLimit)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400">
                  {isOver ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Budget Exceeded by{' '}
                      {FinancialEngine.formatINR(b.spent - b.monthlyLimit)}
                    </span>
                  ) : (
                    <span>
                      {FinancialEngine.formatINR(b.monthlyLimit - b.spent)} remaining for {b.month}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
