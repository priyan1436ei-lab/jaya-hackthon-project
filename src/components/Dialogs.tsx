import React, { useState } from 'react';
import {
  X,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Target,
  Zap,
  Calculator,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send
} from 'lucide-react';
import { useFinFam } from '../context/FinFamContext';
import { GoalItem } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, familyMembers } = useFinFam();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [isFamilyShared, setIsFamilyShared] = useState(true);
  const [memberName, setMemberName] = useState(familyMembers[2]?.name || 'Priyanshu');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title || isNaN(num) || num <= 0) return;
    addExpense(title, category, num, paymentMethod, notes, isFamilyShared, memberName);
    onClose();
    setTitle('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">Add Expense Entry</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title / Merchant</label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy Gourmet, Metro Ticket"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="450.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Food">Food & Dining</option>
                <option value="Rent">Rent & Housing</option>
                <option value="Bills">Bills & Utilities</option>
                <option value="Travel">Travel & Commute</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Investment">Investment</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="RuPay Credit Card">RuPay Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Member</label>
              <select
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Add short description..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isFamilyShared"
              checked={isFamilyShared}
              onChange={(e) => setIsFamilyShared(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-white/20 focus:ring-cyan-500"
            />
            <label htmlFor="isFamilyShared" className="text-xs text-slate-300 font-medium cursor-pointer">
              Share with Family Vault members
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/20"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddIncomeModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addIncome, familyMembers } = useFinFam();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Salary');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Net Banking');
  const [notes, setNotes] = useState('');
  const [memberName, setMemberName] = useState(familyMembers[2]?.name || 'Priyanshu');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title || isNaN(num) || num <= 0) return;
    addIncome(title, category, num, paymentMethod, notes, memberName);
    onClose();
    setTitle('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Record Income / Deposit</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Source / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Consulting Milestone, Freelance Work"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="25000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance / Consulting</option>
                <option value="Investment">Investment Return</option>
                <option value="Rental">Rental Income</option>
                <option value="Bonus">Bonus / Gift</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Net Banking">Net Banking</option>
                <option value="IMPS / NEFT">IMPS / NEFT</option>
                <option value="UPI">UPI Transfer</option>
                <option value="Cheque">Cheque Deposit</option>
                <option value="Cash">Cash Deposit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Credited To</label>
              <select
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Deposit reference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Deposit to Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddGoalModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addGoal } = useFinFam();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('Dec 2027');
  const [category, setCategory] = useState('Savings');
  const [priorityLabel, setPriorityLabel] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [hardDeadline, setHardDeadline] = useState(false);
  const [flexibilityMonths, setFlexibilityMonths] = useState('12');
  const [minimumAcceptable, setMinimumAcceptable] = useState('');
  const [monthlyAllocation, setMonthlyAllocation] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('0');
  const [inflationRate, setInflationRate] = useState('0');
  const [canPause, setCanPause] = useState(true);
  const [canReduceTarget, setCanReduceTarget] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFamilyGoal, setIsFamilyGoal] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount);
    if (!name || isNaN(targetNum) || targetNum <= 0) return;

    const currentNum = parseFloat(currentAmount) || 0;
    const priority = priorityLabel === 'CRITICAL' ? 1 : priorityLabel === 'HIGH' ? 2 : priorityLabel === 'MEDIUM' ? 3 : 4;
    const minAcceptableNum = parseFloat(minimumAcceptable) || Math.round(targetNum * 0.8);
    const allocationNum = parseFloat(monthlyAllocation) || 0;
    const flexMonths = parseInt(flexibilityMonths) || 12;

    addGoal(name, emoji, targetNum, targetDate, category, isFamilyGoal, {
      currentAmount: currentNum,
      priority,
      priorityLabel,
      hardDeadline,
      deadlineFlexibilityMonths: hardDeadline ? 0 : flexMonths,
      minimumAcceptableAmount: minAcceptableNum,
      monthlyAllocation: allocationNum,
      expectedAnnualReturn: parseFloat(expectedReturn) || 0,
      inflationRate: parseFloat(inflationRate) || 0,
      canPause,
      canReduceTarget
    });

    onClose();
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Create Savings Goal & Milestone</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full text-center bg-slate-900 border border-white/10 rounded-xl py-2.5 text-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Electric Vehicle Downpayment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="150000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Saved Stock (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Deadline</label>
              <input
                type="text"
                placeholder="e.g. Dec 2027"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
              <select
                value={priorityLabel}
                onChange={(e) => setPriorityLabel(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="CRITICAL">1 - CRITICAL (Top Shield)</option>
                <option value="HIGH">2 - HIGH Priority</option>
                <option value="MEDIUM">3 - MEDIUM Priority</option>
                <option value="LOW">4 - LOW / Flexible</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Savings">General Savings</option>
                <option value="Emergency">Emergency Reserve</option>
                <option value="Home">Home & Property</option>
                <option value="Education">Higher Education</option>
                <option value="Travel">Vacation & Travel</option>
                <option value="Vehicle">Vehicle Purchase</option>
                <option value="Retirement">Retirement Wealth</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hardDeadline}
                  onChange={(e) => setHardDeadline(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-white/20 focus:ring-cyan-500"
                />
                <span className="text-xs text-slate-300 font-medium">Locked Hard Deadline</span>
              </label>
            </div>
          </div>

          {/* Collapsible Advanced Options */}
          <div className="border border-white/10 rounded-xl p-3 bg-slate-900/60">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-bold text-cyan-400"
            >
              <span>⚙️ Advanced Planning & Constraints</span>
              <span>{showAdvanced ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pt-3 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Max Allowed Extension (Mo)
                    </label>
                    <input
                      type="number"
                      value={flexibilityMonths}
                      onChange={(e) => setFlexibilityMonths(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                      disabled={hardDeadline}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Minimum Acceptable Target (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 120000"
                      value={minimumAcceptable}
                      onChange={(e) => setMinimumAcceptable(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Expected Annual Return (%)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Inflation Rate (%)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={canPause}
                      onChange={(e) => setCanPause(e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    Can Pause in Conflict
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={canReduceTarget}
                      onChange={(e) => setCanReduceTarget(e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    Can Trim Target
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              Add Goal to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TopUpGoalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  goal: GoalItem | null;
}> = ({ isOpen, onClose, goal }) => {
  const { depositGoal, openPaymentGateway } = useFinFam();
  const [amount, setAmount] = useState('');

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    depositGoal(goal.id, num);
    onClose();
    setAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{goal.emoji}</span>
            <div>
              <h2 className="text-sm font-bold text-white">Top-up Goal</h2>
              <p className="text-[11px] text-slate-400">{goal.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Deposit Amount (₹)
            </label>
            <input
              type="number"
              required
              autoFocus
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1000, 5000, 10000].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-medium border border-cyan-500/20"
              >
                +₹{preset}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                const num = parseFloat(amount || '5000');
                if (isNaN(num) || num <= 0) return;
                onClose();
                openPaymentGateway({
                  title: `Fund Goal: ${goal.name}`,
                  description: `Target: ₹${goal.targetAmount.toLocaleString('en-IN')}`,
                  amount: num,
                  category: 'GOAL_TOPUP',
                  goalId: goal.id
                });
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-[#050816] font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> Pay via Gateway (UPI / Cards)
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs"
              >
                Transfer from Vault
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddBudgetModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addBudget } = useFinFam();
  const [category, setCategory] = useState('Food & Dining');
  const [limit, setLimit] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(limit);
    if (isNaN(num) || num <= 0) return;
    addBudget(category, num);
    onClose();
    setLimit('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Add Category Budget</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <input
              type="text"
              required
              placeholder="e.g. Healthcare & Wellness"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Ceiling (₹)</label>
            <input
              type="number"
              required
              placeholder="5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs"
            >
              Save Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddBillModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addBill } = useFinFam();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('28th of every month');
  const [category, setCategory] = useState('Electricity');
  const [isRecurring, setIsRecurring] = useState(true);
  const [autoPay, setAutoPay] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name || isNaN(num) || num <= 0) return;
    addBill(name, num, dueDate, category, isRecurring, autoPay);
    onClose();
    setName('');
    setAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Add Recurring Bill</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bill Name / Biller</label>
            <input
              type="text"
              required
              placeholder="e.g. Jio Fiber, Tata Play DTH"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="1299"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="text"
                placeholder="e.g. 28 Aug 2026"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Electricity">Electricity</option>
                <option value="Internet">Internet / Broadband</option>
                <option value="Water">Water Bill</option>
                <option value="Gas">LPG Gas</option>
                <option value="DTH">DTH / Cable TV</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  checked={autoPay}
                  onChange={(e) => setAutoPay(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-white/20"
                />
                <span className="text-xs text-slate-300 font-medium">Enable Auto-Pay</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Schedule Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddEmiModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addEmi } = useFinFam();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Vehicle');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [interestRate, setInterestRate] = useState('9.5');
  const [tenureMonths, setTenureMonths] = useState('24');
  const [lenderBank, setLenderBank] = useState('HDFC Bank');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount);
    const emi = parseFloat(monthlyEmi);
    const rate = parseFloat(interestRate);
    const tenure = parseInt(tenureMonths, 10);

    if (!title || isNaN(tot) || isNaN(emi)) return;
    addEmi(title, category, tot, emi, rate, tenure, lenderBank);
    onClose();
    setTitle('');
    setTotalAmount('');
    setMonthlyEmi('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0E1528] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Add Loan / Active EMI</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Enfield Hunter 350"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Principal (₹)</label>
              <input
                type="number"
                required
                placeholder="120000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly EMI (₹)</label>
              <input
                type="number"
                required
                placeholder="4200"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tenure (Months)</label>
              <input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Lender Bank / Financer</label>
            <input
              type="text"
              placeholder="e.g. HDFC Auto Loan"
              value={lenderBank}
              onChange={(e) => setLenderBank(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs"
            >
              Save EMI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ScanReceiptModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const {
    isScanningReceipt,
    scannedReceiptResult,
    scanReceiptSimulator,
    confirmScannedReceiptAsExpense,
    dismissScannedReceipt
  } = useFinFam();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0E1528] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Smart Receipt OCR Scanner</h2>
              <p className="text-[11px] text-slate-400">Extracts items, GST, total & merchant</p>
            </div>
          </div>
          <button
            onClick={() => {
              dismissScannedReceipt();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {!scannedReceiptResult && !isScanningReceipt && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-cyan-500/30 rounded-xl p-6 text-center bg-cyan-950/10">
                <ScanLine className="w-10 h-10 text-cyan-400 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-white">Choose Sample Receipt to Scan</p>
                <p className="text-xs text-slate-400 mt-1">
                  Simulates Camera OCR text recognition & auto-parsing
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => scanReceiptSimulator('GROCERY')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 text-center transition-all"
                >
                  🛒 Grocery Store
                </button>
                <button
                  onClick={() => scanReceiptSimulator('RESTAURANT')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 text-center transition-all"
                >
                  🍽️ Dining Buffet
                </button>
                <button
                  onClick={() => scanReceiptSimulator('FUEL')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 text-center transition-all"
                >
                  ⛽ Fuel Station
                </button>
              </div>
            </div>
          )}

          {isScanningReceipt && (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-cyan-300">Processing OCR Document...</p>
              <p className="text-xs text-slate-400">Extracting merchant, line items, and GST breakdown</p>
            </div>
          )}

          {scannedReceiptResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {scannedReceiptResult.merchantName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Category: {scannedReceiptResult.category} • {scannedReceiptResult.paymentMode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black font-mono text-emerald-400">
                      ₹{scannedReceiptResult.amount.toLocaleString('en-IN')}
                    </div>
                    {scannedReceiptResult.taxGst > 0 && (
                      <div className="text-[10px] text-slate-400">
                        GST: ₹{scannedReceiptResult.taxGst}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-500/20">
                  <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Detected Items:</div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {scannedReceiptResult.detectedItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dismissScannedReceipt();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5"
                >
                  Scan Another
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmScannedReceiptAsExpense();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  Add to Transactions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
