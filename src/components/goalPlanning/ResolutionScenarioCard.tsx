import React from 'react';
import { ResolutionScenario } from '../../types/goalPlanning';
import { FinancialEngine } from '../../lib/financialEngine';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Scale
} from 'lucide-react';

interface ResolutionScenarioCardProps {
  scenario: ResolutionScenario;
  isRecommended?: boolean;
  onPreview?: (scenario: ResolutionScenario) => void;
  onApply?: (scenario: ResolutionScenario) => void;
  onOptimize?: (scenario: ResolutionScenario) => void;
}

export const ResolutionScenarioCard: React.FC<ResolutionScenarioCardProps> = ({
  scenario,
  isRecommended = false,
  onPreview,
  onApply,
  onOptimize
}) => {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between space-y-4 border transition-all ${
        scenario.isFeasible && isRecommended
          ? 'bg-[#0E1B38] border-cyan-400 shadow-xl shadow-cyan-500/10'
          : scenario.isFeasible
          ? 'bg-[#0E1528] border-emerald-500/30 hover:border-emerald-500/50'
          : 'bg-[#0E1528] border-rose-500/20 hover:border-rose-500/40'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
              Option #{scenario.recommendationRank}
            </span>
            {isRecommended && scenario.isFeasible && (
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Recommended Plan
              </span>
            )}
          </div>

          <div>
            {scenario.isFeasible ? (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Feasible
              </span>
            ) : (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Infeasible Under Constraints
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white">{scenario.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{scenario.tagline}</p>
        </div>

        {/* Action items */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs">
          <div className="text-[11px] font-semibold text-slate-300">Exact Adjustments Proposed:</div>
          <ul className="space-y-1 text-slate-300 text-[11px]">
            {scenario.actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                <span>{act.description}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Goals Protected vs Delayed */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Fully Protected
            </span>
            <div className="text-white mt-1 font-medium truncate">
              {scenario.goalsProtected.length > 0 ? scenario.goalsProtected.join(', ') : 'None'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> Delayed / Scaled
            </span>
            <div className="text-slate-200 mt-1 font-medium truncate">
              {scenario.goalsDelayedOrAdjusted.length > 0
                ? scenario.goalsDelayedOrAdjusted.join(', ')
                : 'No delays'}
            </div>
          </div>
        </div>

        {/* Metrics summary */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
          <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
            <span className="text-[10px] text-slate-400">Portfolio Feasibility</span>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">
              {scenario.overallFeasibilityScore}%
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
            <span className="text-[10px] text-slate-400">Monthly Deficit Left</span>
            <div
              className={`text-sm font-bold mt-0.5 ${
                scenario.monthlyDeficitRemaining > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {FinancialEngine.formatINR(scenario.monthlyDeficitRemaining)}
            </div>
          </div>
        </div>

        {/* Why this works */}
        <p className="text-[11px] text-slate-300 italic bg-black/20 p-2.5 rounded-lg border border-white/5 leading-relaxed">
          💡 {scenario.whyThisWorks}
        </p>
      </div>

      {/* Action Controls */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
        {onPreview && (
          <button
            onClick={() => onPreview(scenario)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Preview
          </button>
        )}

        {onOptimize && (
          <button
            onClick={() => onOptimize(scenario)}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
            title="Evaluate in Decision Optimizer"
          >
            <Scale className="w-3.5 h-3.5" /> MCDA
          </button>
        )}

        {onApply && (
          <button
            onClick={() => onApply(scenario)}
            className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Apply Plan
          </button>
        )}
      </div>
    </div>
  );
};
