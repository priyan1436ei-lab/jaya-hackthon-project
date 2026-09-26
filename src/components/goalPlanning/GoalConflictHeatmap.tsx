import React, { useState } from 'react';
import { MonthlyTimelinePoint } from '../../types/goalPlanning';
import { FinancialEngine } from '../../lib/financialEngine';
import { Calendar, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface GoalConflictHeatmapProps {
  timeline: MonthlyTimelinePoint[];
}

export const GoalConflictHeatmap: React.FC<GoalConflictHeatmapProps> = ({ timeline }) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthlyTimelinePoint | null>(null);

  // Take first 24 or 36 months for display
  const displayMonths = timeline.slice(0, 36);

  return (
    <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Monthly Cashflow & Conflict Timeline Heatmap</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any month to inspect active goal demands, allocated flows, and cashflow deficits.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300">Surplus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-slate-300">Constrained</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-300">Deficit</span>
          </div>
        </div>
      </div>

      {/* Grid of months */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
        {displayMonths.map((m) => {
          const isDeficit = m.monthlyDeficit > 0;
          const isTight = !isDeficit && m.unallocatedSurplus < 2000 && m.requiredGoalFunding > 0;
          const isSelected = selectedMonth?.yearMonth === m.yearMonth;

          let bgClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25';
          if (isDeficit) {
            bgClass = 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30';
          } else if (isTight) {
            bgClass = 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30';
          }

          return (
            <button
              key={m.yearMonth}
              onClick={() => setSelectedMonth(m)}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[64px] ${bgClass} ${
                isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#050816] scale-105' : ''
              }`}
            >
              <span className="text-[10px] font-bold font-mono uppercase">{m.monthLabel}</span>
              <div className="mt-1 font-mono font-bold text-xs">
                {isDeficit
                  ? `-${FinancialEngine.formatINR(m.monthlyDeficit, true)}`
                  : `+${FinancialEngine.formatINR(m.unallocatedSurplus, true)}`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Month Detail Modal / Drawer */}
      {selectedMonth && (
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 animate-in fade-in space-y-3 relative">
          <button
            onClick={() => setSelectedMonth(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-white">
              Month Detail: {selectedMonth.monthLabel} ({selectedMonth.yearMonth})
            </h4>
            {selectedMonth.hasConflict ? (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                DEFICIT: {FinancialEngine.formatINR(selectedMonth.monthlyDeficit)}
              </span>
            ) : (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SURPLUS: {FinancialEngine.formatINR(selectedMonth.unallocatedSurplus)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">Total Income</span>
              <div className="font-bold text-white">{FinancialEngine.formatINR(selectedMonth.income)}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">Essential + EMI</span>
              <div className="font-bold text-slate-300">
                {FinancialEngine.formatINR(selectedMonth.essentialExpenses + selectedMonth.emiTotal)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">Available Goal Flow</span>
              <div className="font-bold text-cyan-400">
                {FinancialEngine.formatINR(selectedMonth.availableCapacity)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">Required Goal Funding</span>
              <div className="font-bold text-purple-400">
                {FinancialEngine.formatINR(selectedMonth.requiredGoalFunding)}
              </div>
            </div>
          </div>

          {/* Goal breakdown for this month */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="text-xs font-semibold text-slate-300">Allocated Goal Contributions:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedMonth.goalAllocations.map((alloc) => (
                <div
                  key={alloc.goalId}
                  className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{alloc.goalName}</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Req: {FinancialEngine.formatINR(alloc.requiredContribution)} • Alloc:{' '}
                      {FinancialEngine.formatINR(alloc.allocatedContribution)}
                    </div>
                  </div>
                  {alloc.shortfall > 0 ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      -{FinancialEngine.formatINR(alloc.shortfall)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      100% Funded
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
