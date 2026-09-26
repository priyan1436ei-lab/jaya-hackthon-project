import React from 'react';
import { useFinFam } from '../context/FinFamContext';
import { FinancialEngine } from '../lib/financialEngine';
import { GoalFeasibilityCard } from '../components/goalPlanning/GoalFeasibilityCard';
import { GoalConflictHeatmap } from '../components/goalPlanning/GoalConflictHeatmap';
import { GoalItem } from '../types/goalPlanning';
import {
  Target,
  Plus,
  Network,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Calendar
} from 'lucide-react';

interface GoalPortfolioDashboardScreenProps {
  onNavigate: (route: string) => void;
  onOpenAddGoal: () => void;
  onSelectGoalForTopUp: (goal: GoalItem) => void;
}

export const GoalPortfolioDashboardScreen: React.FC<GoalPortfolioDashboardScreenProps> = ({
  onNavigate,
  onOpenAddGoal,
  onSelectGoalForTopUp
}) => {
  const {
    goals,
    householdProfile,
    goalFeasibilities,
    sharedTimeline,
    goalConflicts,
    isDemoMode,
    loadJudgeDemoScenario,
    resetJudgeDemoScenario
  } = useFinFam();

  const activeGoals = goals.filter((g) => !g.archived);
  const totalRequiredMonthly = Object.values(goalFeasibilities).reduce(
    (sum, f) => sum + f.requiredMonthlyContribution,
    0
  );
  const availableCapacity = Math.max(householdProfile.monthlyNetIncome - (householdProfile.essentialMonthlyExpenses + householdProfile.activeEmiMonthlyTotal + householdProfile.discretionaryMonthlyExpenses), 0);
  const monthlyShortfall = Math.max(totalRequiredMonthly - availableCapacity, 0);

  const achievableCount = Object.values(goalFeasibilities).filter(
    (f) => f.status === 'ON_TRACK' || f.isCompleted
  ).length;
  const atRiskCount = Object.values(goalFeasibilities).filter(
    (f) => f.status === 'AT_RISK' || f.status === 'CONFLICT'
  ).length;

  const avgFeasibility =
    Object.values(goalFeasibilities).length > 0
      ? Math.round(
          Object.values(goalFeasibilities).reduce((sum, f) => sum + f.feasibilityScore, 0) /
            Object.values(goalFeasibilities).length
        )
      : 100;

  return (
    <div className="space-y-6 pb-28">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Multi-Goal Portfolio Engine
            </span>
            {isDemoMode && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Hackathon Judge Demo Loaded
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Family Milestone Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyzes all family goals together against limited cashflow to detect competition and funding deficits.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isDemoMode ? (
            <button
              onClick={resetJudgeDemoScenario}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Demo
            </button>
          ) : (
            <button
              onClick={loadJudgeDemoScenario}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Load Judge Demo
            </button>
          )}

          <button
            onClick={onOpenAddGoal}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Goal
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Total Goals</span>
          <div className="text-xl font-black text-white font-mono mt-1">
            {activeGoals.length}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
            {achievableCount} on track
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Monthly Goal Flow</span>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">
            {FinancialEngine.formatINR(availableCapacity)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Net disposable capacity</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Total Demand</span>
          <div className="text-xl font-black text-purple-400 font-mono mt-1">
            {FinancialEngine.formatINR(totalRequiredMonthly)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Required for 100% funding</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Monthly Shortfall</span>
          <div
            className={`text-xl font-black font-mono mt-1 ${
              monthlyShortfall > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {monthlyShortfall > 0
              ? `-${FinancialEngine.formatINR(monthlyShortfall)}`
              : '₹0'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {monthlyShortfall > 0 ? 'Monthly deficit' : 'Surplus capacity'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Portfolio Health</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {avgFeasibility}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Weighted Feasibility</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Active Conflicts</span>
          <div
            className={`text-xl font-black font-mono mt-1 ${
              goalConflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {goalConflicts.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {goalConflicts.length > 0 ? `${atRiskCount} goals at risk` : 'All clear'}
          </div>
        </div>
      </div>

      {/* Conflict Alert Banner with Quick Navigation */}
      {goalConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Funding Conflict Alert: {goalConflicts[0].title}
              </h4>
              <p className="text-xs text-rose-200 mt-0.5 leading-relaxed max-w-2xl">
                {goalConflicts[0].reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onNavigate('goal_interference')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-all"
            >
              <Network className="w-3.5 h-3.5" /> Interference Map
            </button>
            <button
              onClick={() => onNavigate('resolution_lab')}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> Resolve Conflicts
            </button>
          </div>
        </div>
      )}

      {/* Goal Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Active Household Milestones ({activeGoals.length})
          </h3>
          <span className="text-xs text-slate-400">
            Protected Critical Goals: {activeGoals.filter((g) => g.priority === 1).length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.map((goal) => {
            const feas = goalFeasibilities[goal.id];
            if (!feas) return null;
            return (
              <GoalFeasibilityCard
                key={goal.id}
                goal={goal}
                feasibility={feas}
                onTopUp={onSelectGoalForTopUp}
                onSimulateRipple={() => onNavigate('ripple_simulator')}
                onViewInterference={() => onNavigate('goal_interference')}
              />
            );
          })}
        </div>
      </div>

      {/* Monthly Timeline Heatmap */}
      {sharedTimeline && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Multi-Year Monthly Cashflow Simulation Horizon
            </h3>
            <button
              onClick={() => onNavigate('goal_timeline')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
            >
              Detailed Horizon View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <GoalConflictHeatmap timeline={sharedTimeline.timeline} />
        </div>
      )}
    </div>
  );
};
