import React from 'react';
import { useFinFam } from '../context/FinFamContext';
import { GoalInterferenceGraph } from '../components/goalPlanning/GoalInterferenceGraph';
import { FinancialEngine } from '../lib/financialEngine';
import { Network, Zap, Sparkles, AlertTriangle, ArrowRight, Info, Scale } from 'lucide-react';

interface GoalInterferenceMapScreenProps {
  onNavigate: (route: string) => void;
}

export const GoalInterferenceMapScreen: React.FC<GoalInterferenceMapScreenProps> = ({
  onNavigate
}) => {
  const { interferenceMatrix, goalConflicts } = useFinFam();

  const highestEdge = interferenceMatrix.highestInterferenceEdge;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Goal Interference Mapping Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Resource Competition & Crowding Map
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Goals do not exist in isolation. This engine uses counterfactual modeling to reveal which goals siphon surplus from others.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('ripple_simulator')}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Ripple Sandbox
          </button>
          <button
            onClick={() => onNavigate('resolution_lab')}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> Resolution Lab
          </button>
        </div>
      </div>

      {/* Primary Highlight Card: Peak Interference */}
      {highestEdge && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#170E28] via-[#121B3A] to-[#0A162E] border border-rose-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-xs font-extrabold uppercase font-mono text-rose-300">
                Primary Financial Competition Detected
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/30">
              Competition Intensity: {highestEdge.interferenceScore}/100 ({highestEdge.severity})
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="text-cyan-400">{highestEdge.sourceGoalName}</span>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-purple-400">{highestEdge.targetGoalName}</span>
            <span className="text-xs font-mono font-normal text-slate-300 ml-2">
              (Est. Monthly Siphon: {FinancialEngine.formatINR(highestEdge.monthlyImpact)}/mo)
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
            {highestEdge.reason}
          </p>
        </div>
      )}

      {/* Interactive Network Graph Component */}
      <GoalInterferenceGraph data={interferenceMatrix} />

      {/* Methodology Explanation Note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-cyan-400" />
          Mathematical Counterfactual Methodology
        </div>
        <p className="leading-relaxed">
          Interference is calculated deterministically by evaluating pairwise counterfactual simulations:
          for every pair of goals (A and B), the engine measures how much Goal B's projected shortfall would be
          reduced if Goal A's funding requirements were removed from the shared cashflow timeline.
          Pairwise impacts are independent counterfactuals and are not simply summed across the graph.
        </p>
      </div>
    </div>
  );
};
