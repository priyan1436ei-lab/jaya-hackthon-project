import React from 'react';
import {
  Trophy,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  BarChart2,
  Sliders,
  BookmarkPlus,
  RefreshCw,
  Scale
} from 'lucide-react';
import {
  AlternativeEvaluation,
  DecisionCriterion,
  DecisionConstraint,
  DecisionConfidenceResult,
  PairwiseTradeOff,
  SensitivityAnalysisResult
} from '../types/decisionOptimizer';
import { FinancialEngine } from '../lib/financialEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

interface DecisionResultsScreenProps {
  scenarioTitle: string;
  scenarioDilemma: string;
  capitalAmount: number;
  criteria: DecisionCriterion[];
  constraints: DecisionConstraint[];
  evaluations: AlternativeEvaluation[];
  tradeOffs: PairwiseTradeOff[];
  sensitivityResults: SensitivityAnalysisResult[];
  confidence: DecisionConfidenceResult;
  onNavigateToExplanation: () => void;
  onNavigateToSensitivity: () => void;
  onSaveScenario: () => void;
  onReconfigure: () => void;
}

export const DecisionResultsScreen: React.FC<DecisionResultsScreenProps> = ({
  scenarioTitle,
  scenarioDilemma,
  capitalAmount,
  criteria,
  constraints,
  evaluations,
  tradeOffs,
  sensitivityResults,
  confidence,
  onNavigateToExplanation,
  onNavigateToSensitivity,
  onSaveScenario,
  onReconfigure
}) => {
  const winner = evaluations[0];
  const runnerUp = evaluations[1];

  // Prepare chart data comparing scores across alternatives
  const chartData = evaluations.map((item) => ({
    name: item.alternative.title.length > 18 ? `${item.alternative.title.slice(0, 16)}...` : item.alternative.title,
    finalScore: item.finalScore,
    isWinner: item.rank === 1,
    isFeasible: item.isFeasible,
    returnRate: item.alternative.rawCriteriaValues.RETURN_ROI,
    liquidity: item.alternative.rawCriteriaValues.LIQUIDITY * 10
  }));

  const confidenceBadgeColor =
    confidence.confidenceTier === 'HIGH'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : confidence.confidenceTier === 'MODERATE'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

  return (
    <div className="space-y-6 pb-28">
      {/* Header & Scenario Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Optimization Solved
            </span>
            <span className="text-xs text-slate-400">Capital: {FinancialEngine.formatINR(capitalAmount)}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            {scenarioTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReconfigure}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reconfigure
          </button>
          <button
            onClick={onSaveScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
          >
            <BookmarkPlus className="w-3.5 h-3.5" /> Save to Vault
          </button>
        </div>
      </div>

      {/* WINNER SPOTLIGHT CARD */}
      {winner && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0B1530] via-[#0E1B42] to-[#122256] border-2 border-cyan-500/50 shadow-2xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {winner.isFeasible ? (
                  <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> Rank #1 Recommended
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> No Fully Feasible Plan (Best Partial Score)
                  </span>
                )}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${confidenceBadgeColor}`}>
                  Robustness: {confidence.confidenceTier} ({confidence.confidenceScore}%)
                </span>
                {winner.isFeasible ? (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" /> Constraints Met
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <AlertTriangle className="w-3 h-3" /> Hard Constraint Violation
                  </span>
                )}
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {winner.alternative.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {winner.alternative.description}
              </p>
            </div>

            {/* Score Display Circle */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#050816]/80 border border-cyan-500/30 min-w-[130px] text-center shadow-inner">
              <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">MCDA WSM Score</div>
              <div className="text-4xl font-black text-white font-mono mt-0.5">
                {winner.finalScore}
                <span className="text-sm font-medium text-slate-400">/100</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {runnerUp ? `+${winner.finalScore - runnerUp.finalScore} pts vs #2` : 'Dominant Choice'}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#050816]/60 border border-white/5">
              <span className="text-[10px] text-slate-400">Target Allocation</span>
              <div className="font-mono font-bold text-white text-sm">
                {FinancialEngine.formatINR(capitalAmount)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050816]/60 border border-white/5">
              <span className="text-[10px] text-slate-400">Annual Return (CAGR)</span>
              <div className="font-mono font-bold text-emerald-400 text-sm">
                {winner.alternative.rawCriteriaValues.RETURN_ROI}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050816]/60 border border-white/5">
              <span className="text-[10px] text-slate-400">Liquidity Score</span>
              <div className="font-mono font-bold text-cyan-400 text-sm">
                {winner.alternative.rawCriteriaValues.LIQUIDITY}/10
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050816]/60 border border-white/5">
              <span className="text-[10px] text-slate-400">Safety Index</span>
              <div className="font-mono font-bold text-indigo-300 text-sm">
                {winner.alternative.rawCriteriaValues.RISK_SAFETY}/10
              </div>
            </div>
          </div>

          {/* Key Pros Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {winner.pros.map((pro, i) => (
              <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                ✓ {pro}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* QUICK DEEP-DIVE BANNER BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onNavigateToExplanation}
          className="p-4 rounded-2xl bg-[#0E1528] border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center justify-between text-left group"
        >
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <HelpCircle className="w-4 h-4" />
              <span>Decision Explanation & Trade-Offs</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Why this option won, pairwise sacrifices, and AI executive memo.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onNavigateToSensitivity}
          className="p-4 rounded-2xl bg-[#0E1528] border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between text-left group"
        >
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
              <Sliders className="w-4 h-4" />
              <span>Sensitivity Analysis & Stability</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Critical weight flip points and interactive threshold perturbation.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* COMPARATIVE SCORE CHART */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1528] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Comparative Score Distribution
          </h3>
          <span className="text-[11px] text-slate-400">Ranked by final MCDA score</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#050816',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '11px'
                }}
              />
              <Bar dataKey="finalScore" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isWinner
                        ? '#06b6d4'
                        : !entry.isFeasible
                        ? '#f43f5e'
                        : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FULL COMPARATIVE LEADERBOARD */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Comprehensive Alternatives Leaderboard
        </h3>

        <div className="space-y-3">
          {evaluations.map((evalItem) => {
            const alt = evalItem.alternative;
            const isTop = evalItem.rank === 1;

            return (
              <div
                key={alt.id}
                className={`p-4 rounded-2xl transition-all border ${
                  isTop
                    ? 'bg-gradient-to-r from-cyan-950/30 to-[#0E1528] border-cyan-500/40 shadow-md'
                    : !evalItem.isFeasible
                    ? 'bg-rose-950/10 border-rose-500/30'
                    : 'bg-[#0E1528] border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                        isTop
                          ? 'bg-cyan-500 text-[#050816] shadow-md shadow-cyan-500/30'
                          : !evalItem.isFeasible
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{evalItem.rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white tracking-tight">{alt.title}</h4>
                        {isTop && evalItem.isFeasible && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            BEST FIT
                          </span>
                        )}
                        {!evalItem.isFeasible && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            DISQUALIFIED BY HARD CONSTRAINT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">{alt.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-[10px] text-slate-400">Final Score</div>
                      <div className="text-xl font-bold font-mono text-white">
                        {evalItem.finalScore}
                        <span className="text-xs font-normal text-slate-500">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Constraint Violations Notice if Infeasible */}
                {!evalItem.isFeasible && evalItem.hardConstraintViolations.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Rejection Diagnostics:
                    </div>
                    {evalItem.hardConstraintViolations.map((v, i) => (
                      <div key={i} className="text-[11px] pl-4">• {v}</div>
                    ))}
                  </div>
                )}

                {/* Criteria Breakdown mini bars */}
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                  {criteria.map((c) => (
                    <div key={c.key} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{c.shortName}</span>
                        <span className="font-mono text-slate-200">
                          {alt.rawCriteriaValues[c.key]}
                          {c.unit}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${Math.round((evalItem.normalizedScores[c.key] ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
