import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  TrendingUp,
  Zap,
  CreditCard,
  Calculator,
  Target,
  Users,
  Bot,
  ScanLine,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Scale,
  Network,
  AlertTriangle
} from 'lucide-react';
import { useFinFam } from '../context/FinFamContext';
import { FinancialEngine } from '../lib/financialEngine';

interface HomeScreenProps {
  onNavigate: (route: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenScanReceipt: () => void;
  onSelectGoalForTopUp: (goal: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenScanReceipt,
  onSelectGoalForTopUp
}) => {
  const {
    userProfile,
    financialHealth,
    transactions,
    budgets,
    goals,
    bills,
    emis,
    deleteTransaction,
    payBill,
    goalFeasibilities,
    goalConflicts,
    householdProfile
  } = useFinFam();

  const healthScore = financialHealth.overallScore;

  // Multi-Goal quick status
  const conflictCount = goalConflicts.length;
  const criticalConflictCount = goalConflicts.filter((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH').length;
  const totalRequiredMonthly = Object.values(goalFeasibilities).reduce(
    (sum, f) => sum + (f.requiredMonthlyContribution || 0),
    0
  );
  const netCapacity = Math.max(
    householdProfile.monthlyNetIncome -
      (householdProfile.essentialMonthlyExpenses +
        householdProfile.activeEmiMonthlyTotal +
        householdProfile.discretionaryMonthlyExpenses),
    0
  );
  const shortfall = Math.max(totalRequiredMonthly - netCapacity, 0);

  // Circle circumference for gauge
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Family Vault Primary Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E172F] via-[#091024] to-[#040817] p-5 sm:p-6 border border-cyan-500/20 shadow-xl shadow-cyan-950/20">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>{userProfile.familyName.toUpperCase()}</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Encrypted Vault
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium">Total Family Balance</span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight mt-0.5">
              {FinancialEngine.formatINR(userProfile.totalBalance)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <ArrowDownLeft className="w-3 h-3" /> Monthly Inflow
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-100 mt-0.5">
                {FinancialEngine.formatINR(userProfile.monthlyIncome)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                <ArrowUpRight className="w-3 h-3" /> Expenses
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-100 mt-0.5">
                {FinancialEngine.formatINR(userProfile.monthlyExpenses)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
                <Sparkles className="w-3 h-3" /> Net Savings
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-cyan-300 mt-0.5">
                {FinancialEngine.formatINR(userProfile.monthlySavings)}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={onOpenAddIncome}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> Deposit
            </button>
            <button
              onClick={onOpenAddExpense}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* 2. Financial Health Score (CRED style gauge card) */}
      <div
        onClick={() => onNavigate('analytics')}
        className="cursor-pointer rounded-2xl bg-[#0E1528] border border-white/10 p-5 hover:border-cyan-500/40 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Circular Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="text-slate-800 stroke-current"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-current transition-all duration-1000 ease-out"
                  style={{ color: financialHealth.statusColorHex }}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono text-white leading-none">
                  {healthScore}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Financial Health Score</span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${financialHealth.statusColorHex}20`,
                    color: financialHealth.statusColorHex,
                    border: `1px solid ${financialHealth.statusColorHex}40`
                  }}
                >
                  {financialHealth.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm line-clamp-2">
                {financialHealth.aiSummary}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-emerald-400 font-semibold">
                <span>+{financialHealth.scoreChange} pts vs last month</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
                  View Radar <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Multi-Goal Portfolio Intelligence Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0C1A32] via-[#09152C] to-[#12112E] border border-cyan-500/30 p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                Multi-Goal Planning & Conflict Engine
              </span>
              {criticalConflictCount > 0 ? (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {conflictCount} Conflicts Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Goals In Harmony
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Multi-Goal Cashflow Capacity
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              {shortfall > 0
                ? `Total goal demand ₹${totalRequiredMonthly.toLocaleString('en-IN')}/mo exceeds net household flow ₹${netCapacity.toLocaleString('en-IN')}/mo by ₹${shortfall.toLocaleString('en-IN')}/mo.`
                : `Net available capacity ₹${netCapacity.toLocaleString('en-IN')}/mo comfortably funds all ${goals.length} active household goals.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('goal_portfolio')}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 stroke-[2.5]" /> Multi-Goal Suite
            </button>
            <button
              onClick={() => onNavigate('ripple_simulator')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" /> What-If Sim
            </button>
            <button
              onClick={() => onNavigate('resolution_lab')}
              className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Resolve
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Hub
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('goal_portfolio')}
            className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all group col-span-2 sm:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Multi-Goal Planning</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      CORE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Conflict Detection • Capacity Engine • Feasibility Scoring
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('goal_interference')}
            className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-left transition-all group col-span-2 sm:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Interference Matrix</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                      N × N
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Cross-Goal Interference • Timeline Overlap & Severity
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('optimizer')}
            className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 hover:border-purple-400 text-left transition-all group col-span-2 sm:col-span-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Decision Optimizer AI</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                      AIML 04
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Multi-Criteria Decision Analysis (WSM) • Sensitivity & Trade-Off Modeling
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('transfer')}
            className="p-3.5 rounded-xl bg-[#0E1528] border border-white/10 hover:border-purple-500/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Live Transfer</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sub-second P2P Beam</div>
          </button>

          <button
            onClick={() => onNavigate('payment')}
            className="p-3.5 rounded-xl bg-[#0E1528] border border-white/10 hover:border-cyan-500/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">RuPay & Pay</div>
            <div className="text-[10px] text-slate-400 mt-0.5">UPI, QR & Plans</div>
          </button>

          <button
            onClick={() => onNavigate('emi')}
            className="p-3.5 rounded-xl bg-[#0E1528] border border-white/10 hover:border-amber-500/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Smart EMI Engine</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Amortization & Loans</div>
          </button>

          <button
            onClick={() => onNavigate('trends')}
            className="p-3.5 rounded-xl bg-[#0E1528] border border-white/10 hover:border-blue-500/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Monthly Trends</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Interactive Line Charts</div>
          </button>
        </div>
      </div>

      {/* 4. Budget Utilization Snapshot */}
      <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Monthly Budgets</h3>
            <p className="text-[11px] text-slate-400">Current cycle utilization</p>
          </div>
          <button
            onClick={() => onNavigate('goals')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            Manage <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {budgets.slice(0, 3).map((b) => {
            const pct = Math.min(Math.round((b.spent / b.monthlyLimit) * 100), 100);
            const isDanger = pct >= 90;
            const isWarning = pct >= 80 && pct < 90;

            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{b.category}</span>
                  <div className="font-mono text-[11px] text-slate-400">
                    <span className="text-slate-100 font-bold">
                      {FinancialEngine.formatINR(b.spent)}
                    </span>{' '}
                    / {FinancialEngine.formatINR(b.monthlyLimit)}
                    <span
                      className={`ml-2 font-bold ${
                        isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                    >
                      ({pct}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Upcoming Bills Banner */}
      <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Upcoming Bills</h3>
          </div>
          <button
            onClick={() => onNavigate('family')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            All Bills ({bills.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {bills.filter((b) => !b.isPaid).slice(0, 2).map((bill) => (
            <div key={bill.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white">{bill.name}</div>
                <div className="text-[11px] text-amber-300 flex items-center gap-1 mt-0.5">
                  <span>Due: {bill.dueDate}</span>
                  {bill.autoPayEnabled && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      AUTO-PAY
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right font-mono font-bold text-sm text-white">
                  {FinancialEngine.formatINR(bill.amount)}
                </div>
                <button
                  onClick={() => payBill(bill.id, bill.name, bill.amount, 'UPI')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold transition-all"
                >
                  Pay Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Savings Goals Section */}
      <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Active Savings Goals</h3>
          </div>
          <button
            onClick={() => onNavigate('goals')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goals.map((g) => {
            const pct = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
            return (
              <div
                key={g.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">{pct}%</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2 truncate">{g.name}</h4>
                  <p className="text-[10px] text-slate-400">Target: {g.targetDate}</p>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-mono text-slate-300 font-bold">
                    {FinancialEngine.formatINR(g.currentAmount, true)}
                  </span>
                  <button
                    onClick={() => onSelectGoalForTopUp(g)}
                    className="text-[11px] font-bold text-cyan-400 hover:underline"
                  >
                    + Top up
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Recent Transactions */}
      <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
          <span className="text-xs text-slate-400">{transactions.length} entries</span>
        </div>

        <div className="divide-y divide-white/5">
          {transactions.slice(0, 6).map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.isCredit
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-cyan-400'
                  }`}
                >
                  {tx.isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate max-w-[200px] sm:max-w-md">
                    {tx.title}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className="text-cyan-400/80 font-medium">{tx.category}</span>
                    <span>•</span>
                    <span>{tx.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`text-right font-mono font-bold text-sm ${
                    tx.isCredit ? 'text-emerald-400' : 'text-slate-100'
                  }`}
                >
                  {tx.isCredit ? '+' : '-'}
                  {FinancialEngine.formatINR(tx.amount)}
                </div>
                <button
                  onClick={() => deleteTransaction(tx.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
