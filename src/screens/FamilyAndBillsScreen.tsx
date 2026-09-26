import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Zap,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useFinFam } from '../context/FinFamContext';
import { FinancialEngine } from '../lib/financialEngine';

export const FamilyAndBillsScreen: React.FC<{
  onOpenAddBill: () => void;
}> = ({ onOpenAddBill }) => {
  const { familyMembers, bills, addFamilyMember, deleteFamilyMember, payBill, deleteBill, openPaymentGateway } =
    useFinFam();

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Parent');
  const [newMemberContribution, setNewMemberContribution] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const contrib = parseFloat(newMemberContribution);
    if (!newMemberName) return;
    addFamilyMember({
      name: newMemberName,
      role: newMemberRole,
      monthlyContribution: isNaN(contrib) ? 0 : contrib
    });
    setNewMemberName('');
    setNewMemberContribution('');
    setIsAddingMember(false);
  };

  const totalFamilyContribution = familyMembers.reduce((acc, m) => acc + m.monthlyContribution, 0);

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Family Members Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Family Vault Contributors
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Household members with shared permissions, budgets, and automated settlement
            </p>
          </div>

          <button
            onClick={() => setIsAddingMember(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Member
          </button>
        </div>

        {/* Add Member inline modal form */}
        {isAddingMember && (
          <form
            onSubmit={handleAddMember}
            className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3 animate-in fade-in"
          >
            <div className="text-xs font-bold text-cyan-300">Invite Family Member to Vault</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Admin">Admin</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child / Student">Child / Student</option>
                <option value="Sibling">Sibling</option>
              </select>
              <input
                type="number"
                placeholder="Monthly Inflow (₹)"
                value={newMemberContribution}
                onChange={(e) => setNewMemberContribution(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-[#050816] font-bold text-xs"
              >
                Save Member
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-[#0E1528] border border-white/10 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md"
                    style={{ backgroundColor: member.avatarColorHex || member.avatarColor || '#06B6D4' }}
                  >
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  {member.role === 'Admin' ? (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      ADMIN
                    </span>
                  ) : (
                    <button
                      onClick={() => deleteFamilyMember(member.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-white">{member.name}</h4>
                  <div className="text-[11px] text-slate-400">{member.role}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-xs">
                <span className="text-slate-400 text-[10px] block">Monthly Deposit</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {FinancialEngine.formatINR(member.monthlyContribution)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Scheduled Bills Section */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Household Scheduled Bills
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Electricity, broadband, rent, utilities and auto-pay standing orders
            </p>
          </div>

          <button
            onClick={onOpenAddBill}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Bill
          </button>
        </div>

        <div className="divide-y divide-white/5 bg-[#0E1528] rounded-2xl border border-white/10 p-5">
          {bills.map((bill) => (
            <div key={bill.id} className="py-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  {bill.name}
                  {bill.autoPayEnabled && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      AUTO-PAY
                    </span>
                  )}
                  {bill.isPaid && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                      PAID
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="text-amber-300">Due: {bill.dueDate}</span>
                  <span>•</span>
                  <span>{bill.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono font-bold text-sm text-white">
                  {FinancialEngine.formatINR(bill.amount)}
                </div>
                {!bill.isPaid ? (
                  <button
                    onClick={() =>
                      openPaymentGateway({
                        title: `${bill.name} (${bill.category})`,
                        amount: bill.amount,
                        category: 'BILL',
                        billId: bill.id
                      })
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    Pay
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                  </span>
                )}
                <button
                  onClick={() => deleteBill(bill.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
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
