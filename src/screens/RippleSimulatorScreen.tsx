import React, { useState } from 'react';
import { useFinFam } from '../context/FinFamContext';
import { RippleSimulationEngine } from '../lib/goalPlanning/RippleSimulationEngine';
import { RippleChain } from '../components/goalPlanning/RippleChain';
import { FinancialEngine } from '../lib/financialEngine';
import { RippleTrigger, GoalItem } from '../types/goalPlanning';
import {
  Zap,
  Sliders,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShieldAlert
} from 'lucide-react';

interface RippleSimulatorScreenProps {
  onNavigate: (route: string) => void;
}

export const RippleSimulatorScreen: React.FC<RippleSimulatorScreenProps> = ({ onNavigate }) => {
  const { goals, householdProfile, setGoals, setHouseholdProfile, previousGoalsSnapshot, setPreviousGoalsSnapshot } = useFinFam();

  const activeGoals = goals.filter((g) => !g.archived);
  const homeGoal = activeGoals.find((g) => g.name.toLowerCase().includes('home')) || activeGoals[1] || activeGoals[0];

  // Simulator Trigger State (Default: Move Home Deadline 2030 -> 2028 as requested in Judge Demo Flow)
  const [triggerType, setTriggerType] = useState<RippleTrigger['type']>('DEADLINE_CHANGE');
  const [selectedGoalId, setSelectedGoalId] = useState<number>(homeGoal?.id || 102);
  const [deadlineInput, setDeadlineInput] = useState<string>('Dec 2028');
  const [targetAmountInput, setTargetAmountInput] = useState<string>('1500000');
  const [incomeInput, setIncomeInput] = useState<string>('60000');
  const [expenseInput, setExpenseInput] = useState<string>('42000');
  const [newEmiInput, setNewEmiInput] = useState<string>('8000');
  const [emergencyShockInput, setEmergencyShockInput] = useState<string>('150000');
  const [hasAppliedPlan, setHasAppliedPlan] = useState(false);

  const selectedGoal = activeGoals.find((g) => g.id === selectedGoalId) || activeGoals[0];

  // Construct active trigger payload
  const currentTrigger: RippleTrigger = (() => {
    switch (triggerType) {
      case 'DEADLINE_CHANGE':
        return {
          type: 'DEADLINE_CHANGE',
          targetGoalId: selectedGoal?.id,
          targetGoalName: selectedGoal?.name,
          parameterName: `${selectedGoal?.name} Deadline`,
          oldValue: selectedGoal?.targetDate || 'Dec 2030',
          newValue: deadlineInput
        };
      case 'TARGET_CHANGE':
        return {
          type: 'TARGET_CHANGE',
          targetGoalId: selectedGoal?.id,
          targetGoalName: selectedGoal?.name,
          parameterName: `${selectedGoal?.name} Target Amount`,
          oldValue: FinancialEngine.formatINR(selectedGoal?.targetAmount || 1200000),
          newValue: Number(targetAmountInput)
        };
      case 'INCOME_CHANGE':
        return {
          type: 'INCOME_CHANGE',
          parameterName: 'Household Monthly Income',
          oldValue: FinancialEngine.formatINR(householdProfile.monthlyNetIncome),
          newValue: Number(incomeInput)
        };
      case 'EXPENSE_CHANGE':
        return {
          type: 'EXPENSE_CHANGE',
          parameterName: 'Essential Monthly Expenses',
          oldValue: FinancialEngine.formatINR(householdProfile.essentialMonthlyExpenses),
          newValue: Number(expenseInput)
        };
      case 'NEW_EMI':
        return {
          type: 'NEW_EMI',
          parameterName: 'New Monthly Vehicle/Personal EMI',
          oldValue: '₹0/mo',
          newValue: Number(newEmiInput)
        };
      case 'EMERGENCY_SHOCK':
        return {
          type: 'EMERGENCY_SHOCK',
          parameterName: 'Unforeseen Medical/Household Shock',
          oldValue: 'None',
          newValue: Number(emergencyShockInput)
        };
      default:
        return {
          type: 'PAUSE_GOAL',
          targetGoalId: selectedGoal?.id,
          targetGoalName: selectedGoal?.name,
          parameterName: `${selectedGoal?.name} Pause`,
          oldValue: 'Active',
          newValue: 'Paused for 6 Months'
        };
    }
  })();

  // Compute Ripple Simulation
  const simulation = RippleSimulationEngine.simulateRipple(
    goals,
    householdProfile,
    currentTrigger
  );

  // Apply Plan Handler
  const handleApplyPlan = () => {
    setPreviousGoalsSnapshot(goals);
    setGoals(simulation.proposedGoals);
    setHasAppliedPlan(true);
    setTimeout(() => setHasAppliedPlan(false), 3500);
  };

  // Revert Plan Handler
  const handleRevertPlan = () => {
    if (previousGoalsSnapshot) {
      setGoals(previousGoalsSnapshot);
      setPreviousGoalsSnapshot(null);
    }
  };

  // Quick Preset Handlers for Judge Demo
  const handleApplyJudgeDemoHomePreset = () => {
    setTriggerType('DEADLINE_CHANGE');
    if (homeGoal) {
      setSelectedGoalId(homeGoal.id);
    }
    setDeadlineInput('Dec 2028');
  };

  const handleApplyIncomeCutPreset = () => {
    setTriggerType('INCOME_CHANGE');
    setIncomeInput(String(Math.round(householdProfile.monthlyNetIncome * 0.8)));
  };

  const handleApplyEmergencyShockPreset = () => {
    setTriggerType('EMERGENCY_SHOCK');
    setEmergencyShockInput('150000');
  };

  const handleApplyNewEmiPreset = () => {
    setTriggerType('NEW_EMI');
    setNewEmiInput('8000');
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              Ripple Effect Simulator
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            What-If Scenario Sandbox
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test any life event or parameter shift and watch the deterministic cascade of downstream consequences across all other goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {previousGoalsSnapshot && (
            <button
              onClick={handleRevertPlan}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revert Applied Plan
            </button>
          )}

          <button
            onClick={() => onNavigate('resolution_lab')}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> View Resolutions
          </button>
        </div>
      </div>

      {hasAppliedPlan && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Proposed scenario successfully applied to family vault! All screens updated.
        </div>
      )}

      {/* Preset Bar for Quick Demo */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#121A33] via-[#10142A] to-[#121A33] border border-cyan-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Quick Hackathon Demo Presets:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">1-Click Live Re-simulation</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleApplyJudgeDemoHomePreset}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              triggerType === 'DEADLINE_CHANGE' && deadlineInput === 'Dec 2028'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            🏡 Demo Step 3: Home 2030 → 2028
          </button>

          <button
            onClick={handleApplyIncomeCutPreset}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              triggerType === 'INCOME_CHANGE'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            📉 Income Cut (-20%)
          </button>

          <button
            onClick={handleApplyNewEmiPreset}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              triggerType === 'NEW_EMI'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            🚗 New Car EMI (+₹8,000/mo)
          </button>

          <button
            onClick={handleApplyEmergencyShockPreset}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              triggerType === 'EMERGENCY_SHOCK'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            🚨 Medical Shock (₹1,50,000)
          </button>
        </div>
      </div>

      {/* Main 2-Column Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Parameter Trigger Controls */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Hypothetical Adjustment
            </h3>
            <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/20 px-2 py-0.5 rounded">
              NON-MUTATING PREVIEW
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Parameter to Tweak
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                <option value="DEADLINE_CHANGE">Shift Milestone Deadline (Earlier / Later)</option>
                <option value="TARGET_CHANGE">Scale Milestone Target Amount</option>
                <option value="INCOME_CHANGE">Adjust Monthly Net Income (Raise / Cut)</option>
                <option value="EXPENSE_CHANGE">Adjust Essential Living Expenses</option>
                <option value="NEW_EMI">Take on New Loan / EMI Obligation</option>
                <option value="EMERGENCY_SHOCK">Simulate Emergency Lump-sum Shock</option>
                <option value="PAUSE_GOAL">Pause Milestone Contributions</option>
              </select>
            </div>

            {/* Sub-inputs based on trigger type */}
            {(triggerType === 'DEADLINE_CHANGE' ||
              triggerType === 'TARGET_CHANGE' ||
              triggerType === 'PAUSE_GOAL') && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Goal</label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  {activeGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.name} (Current: {g.targetDate})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {triggerType === 'DEADLINE_CHANGE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proposed Target Deadline (e.g. Dec 2028)
                </label>
                <input
                  type="text"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  placeholder="e.g. Dec 2028"
                />
              </div>
            )}

            {triggerType === 'TARGET_CHANGE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proposed Target Amount (₹)
                </label>
                <input
                  type="number"
                  value={targetAmountInput}
                  onChange={(e) => setTargetAmountInput(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {triggerType === 'INCOME_CHANGE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Monthly Net Income (₹)
                </label>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {triggerType === 'EXPENSE_CHANGE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Essential Expenses (₹)
                </label>
                <input
                  type="number"
                  value={expenseInput}
                  onChange={(e) => setExpenseInput(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {triggerType === 'NEW_EMI' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Additional Monthly EMI Commitment (₹)
                </label>
                <input
                  type="number"
                  value={newEmiInput}
                  onChange={(e) => setNewEmiInput(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {triggerType === 'EMERGENCY_SHOCK' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  One-time Emergency Outflow (₹)
                </label>
                <input
                  type="number"
                  value={emergencyShockInput}
                  onChange={(e) => setEmergencyShockInput(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {/* Before vs After Capacity Comparison Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300">
                Monthly Goal Capacity Impact:
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Baseline Flow</span>
                  <span className="font-bold text-white">
                    {FinancialEngine.formatINR(simulation.baselineCapacity)}/mo
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Proposed Flow</span>
                  <span
                    className={`font-bold ${
                      simulation.proposedCapacity < simulation.baselineCapacity
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {FinancialEngine.formatINR(simulation.proposedCapacity)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Apply Action Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleApplyPlan}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Apply Plan to Vault
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-step Ripple Chain & Goal Feasibilities */}
        <div className="lg:col-span-7 space-y-4">
          <RippleChain
            events={simulation.events}
            summaryNarrative={simulation.summaryNarrative}
          />

          {/* Goal-by-Goal Feasibility Comparison Table */}
          <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-3">
            <h4 className="text-xs font-extrabold uppercase font-mono text-white">
              Goal Feasibility & Required Contribution Comparison
            </h4>

            <div className="divide-y divide-white/5 text-xs">
              {activeGoals.map((g) => {
                const baseF = simulation.baselineFeasibilities[g.id];
                const propF = simulation.proposedFeasibilities[g.id];
                if (!baseF || !propF) return null;

                const reqDelta = propF.requiredMonthlyContribution - baseF.requiredMonthlyContribution;
                const scoreDelta = propF.feasibilityScore - baseF.feasibilityScore;

                return (
                  <div key={g.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{g.emoji}</span>
                      <div>
                        <span className="font-bold text-white">{g.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Target: {propF.targetDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-slate-400 line-through">
                          {FinancialEngine.formatINR(baseF.requiredMonthlyContribution)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span
                          className={`font-bold ${
                            reqDelta > 0 ? 'text-rose-400' : reqDelta < 0 ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {FinancialEngine.formatINR(propF.requiredMonthlyContribution)}/mo
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          scoreDelta < 0
                            ? 'text-rose-400'
                            : scoreDelta > 0
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        Score: {propF.feasibilityScore}% ({scoreDelta > 0 ? '+' : ''}
                        {scoreDelta} pts)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
