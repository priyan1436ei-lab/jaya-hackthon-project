import React, { useState } from 'react';
import { useFinFam } from '../context/FinFamContext';
import { ResolutionScenarioCard } from '../components/goalPlanning/ResolutionScenarioCard';
import { ResolutionScenario } from '../types/goalPlanning';
import { FinancialEngine } from '../lib/financialEngine';
import { MultiGoalDecisionAdapter } from '../lib/goalPlanning/MultiGoalDecisionAdapter';
import {
  Sparkles,
  Scale,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Info,
  Sliders,
  Table,
  Columns
} from 'lucide-react';

interface ResolutionLabScreenProps {
  onNavigate: (route: string) => void;
  onRunMCDAOptimization?: (payload: any) => void;
}

export const ResolutionLabScreen: React.FC<ResolutionLabScreenProps> = ({
  onNavigate,
  onRunMCDAOptimization
}) => {
  const {
    goals,
    householdProfile,
    resolutionResult,
    applyResolutionScenario,
    revertLastAppliedPlan,
    previousGoalsSnapshot
  } = useFinFam();

  const [activeTab, setActiveTab] = useState<'cards' | 'comparison'>('cards');
  const [appliedScenarioTitle, setAppliedScenarioTitle] = useState<string | null>(null);

  const { scenarios, recommendedScenarioId, allInfeasible, infeasibilityReason } = resolutionResult;

  const handleApply = (scenario: ResolutionScenario) => {
    applyResolutionScenario(scenario);
    setAppliedScenarioTitle(scenario.title);
    setTimeout(() => setAppliedScenarioTitle(null), 4000);
  };

  const handleOptimizeWithMCDA = (scenario: ResolutionScenario) => {
    const payload = MultiGoalDecisionAdapter.adaptScenariosToOptimizer(
      scenarios,
      goals,
      householdProfile
    );
    if (onRunMCDAOptimization) {
      onRunMCDAOptimization(payload);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Ripple Resolution Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Candidate Resolution Scenarios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Never stops at "insufficient funds." Evaluates timeline staggering, target right-sizing, spending discipline, and hybrid allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {previousGoalsSnapshot && (
            <button
              onClick={revertLastAppliedPlan}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revert to Previous Plan
            </button>
          )}

          <div className="flex rounded-xl bg-slate-900 p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'cards' ? 'bg-cyan-500 text-[#050816]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Scenarios
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'comparison' ? 'bg-cyan-500 text-[#050816]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Matrix
            </button>
          </div>
        </div>
      </div>

      {appliedScenarioTitle && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Successfully applied "{appliedScenarioTitle}" to all financial screens! Revert anytime.
        </div>
      )}

      {/* Infeasibility notice if all options violate constraints */}
      {allInfeasible && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
            <AlertTriangle className="w-4 h-4" />
            No Fully Feasible Plan Under Current Constraints
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">
            {infeasibilityReason ||
              'Every evaluated alternative leaves either a critical goal underfunded or violates the 3-month emergency floor. Showing best partial improvements below.'}
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {scenarios.map((scenario) => (
            <ResolutionScenarioCard
              key={scenario.id}
              scenario={scenario}
              isRecommended={scenario.id === recommendedScenarioId}
              onPreview={() => onNavigate('ripple_simulator')}
              onApply={() => handleApply(scenario)}
              onOptimize={() => handleOptimizeWithMCDA(scenario)}
            />
          ))}
        </div>
      ) : (
        /* Side-by-side Comparison Matrix Table */
        <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            Side-by-Side Trade-Off Comparison Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/80 text-slate-400 font-mono border-b border-white/10">
                <tr>
                  <th className="px-3.5 py-3">Resolution Plan</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3">Feasibility</th>
                  <th className="px-3.5 py-3">Monthly Deficit Left</th>
                  <th className="px-3.5 py-3">Protected Milestones</th>
                  <th className="px-3.5 py-3">Delayed / Adjusted</th>
                  <th className="px-3.5 py-3">Budget Shift</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {scenarios.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="px-3.5 py-3 font-bold text-white max-w-[180px]">
                      <div>{s.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                        {s.tagline}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          s.isFeasible
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {s.isFeasible ? 'FEASIBLE' : 'CONSTRAINED'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-cyan-400">
                      {s.overallFeasibilityScore}%
                    </td>
                    <td className="px-3.5 py-3 font-mono">
                      <span
                        className={
                          s.monthlyDeficitRemaining > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                        }
                      >
                        {FinancialEngine.formatINR(s.monthlyDeficitRemaining)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-300">
                      {s.goalsProtected.length > 0 ? s.goalsProtected.join(', ') : 'None'}
                    </td>
                    <td className="px-3.5 py-3 text-amber-300">
                      {s.goalsDelayedOrAdjusted.length > 0
                        ? s.goalsDelayedOrAdjusted.join(', ')
                        : 'None'}
                    </td>
                    <td className="px-3.5 py-3 font-mono">
                      {s.monthlyBudgetDelta > 0
                        ? `-${FinancialEngine.formatINR(s.monthlyBudgetDelta)}/mo`
                        : '₹0'}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={() => handleApply(s)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold transition-all shadow-sm shadow-cyan-500/20"
                      >
                        Apply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
