import React from 'react';
import { RippleEvent } from '../../types/goalPlanning';
import { ArrowDown, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';

interface RippleChainProps {
  events: RippleEvent[];
  summaryNarrative?: string;
}

export const RippleChain: React.FC<RippleChainProps> = ({ events, summaryNarrative }) => {
  return (
    <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <Sparkles className="w-5 h-5 text-cyan-400" />
        <h3 className="text-base font-extrabold text-white">Downstream Ripple Chain</h3>
      </div>

      {summaryNarrative && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 leading-relaxed">
          {summaryNarrative}
        </div>
      )}

      {/* Chain flow */}
      <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
        {events.map((ev, idx) => {
          const isPositive = ev.impactType === 'POSITIVE';
          const isNegative = ev.impactType === 'NEGATIVE';

          const iconColor = isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-cyan-400';
          const ringColor = isPositive ? 'border-emerald-500/40' : isNegative ? 'border-rose-500/40' : 'border-cyan-500/40';

          return (
            <div key={idx} className="flex items-start gap-4 relative z-10">
              <div
                className={`w-10 h-10 rounded-full bg-[#050816] border-2 ${ringColor} flex items-center justify-center shrink-0 shadow-lg text-xs font-mono font-bold ${iconColor}`}
              >
                #{ev.order}
              </div>

              <div className="flex-1 p-3 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{ev.entity}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isPositive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isNegative
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {ev.delta}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-300 font-semibold">{ev.metric}:</span> {ev.before} →{' '}
                  <span className="text-white font-bold">{ev.after}</span>
                </div>

                <p className="text-[11px] text-slate-300">{ev.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
