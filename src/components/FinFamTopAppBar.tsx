import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  ShieldCheck,
  Plus,
  ScanLine,
  Zap,
  CheckCheck,
  X,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { useFinFam } from '../context/FinFamContext';

interface FinFamTopAppBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenAddExpense: () => void;
  onOpenScanReceipt: () => void;
}

export const FinFamTopAppBar: React.FC<FinFamTopAppBarProps> = ({
  currentRoute,
  onNavigate,
  onOpenAddExpense,
  onOpenScanReceipt
}) => {
  const {
    userProfile,
    notifications,
    dismissNotification,
    markAllNotificationsRead,
    openPaymentGateway
  } = useFinFam();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050816]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Avatar, Family Vault name & status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-cyan-500/20 hover:ring-2 hover:ring-cyan-400 transition-all"
            title="View Profile"
          >
            PS
          </button>
          <div className="cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                FinFam
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  Vault
                </span>
              </h1>
              {userProfile.isPremium ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> PRO
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openPaymentGateway({
                      title: 'FinFam Pro Annual Membership',
                      description: 'Full multi-goal engine, unlimited scenarios & AI coach',
                      amount: 1499,
                      category: 'SUBSCRIPTION',
                      planId: 'premium_annual'
                    });
                  }}
                  className="text-[11px] font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-500/30 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> Upgrade
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-[200px] sm:max-w-xs truncate">
              {userProfile.familyName} • ₹{Math.round(userProfile.totalBalance).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Right Actions: OCR Scan, Add Txn, P2P Beam, Notifications */}
        <div className="flex items-center gap-2">
          {/* Quick Receipt OCR Scan */}
          <button
            onClick={onOpenScanReceipt}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Scan Receipt OCR"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden md:inline">Scan Receipt</span>
          </button>

          {/* Real-time Transfer Beam */}
          <button
            onClick={() => onNavigate('transfer')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-purple-400 border border-purple-500/20 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="P2P Data & Funds Beam"
          >
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="hidden md:inline">Live Transfer</span>
          </button>

          {/* Quick Add Expense */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs px-3 py-2 rounded-lg transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#050816]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0E1528] border border-slate-700/70 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Vault Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs transition-colors hover:bg-white/[0.03] ${
                          notif.isUnread ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800 text-cyan-400">
                              {notif.type === 'BILL_DUE_TOMORROW' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                              {notif.type === 'BUDGET_CROSSED' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                              {notif.type === 'SCORE_INCREASED' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                              {notif.type === 'SAVINGS_GOAL_REACHED' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                              {notif.type === 'PAYMENT_SUCCESS' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                {notif.title}
                                {notif.amountFormatted && (
                                  <span className="font-mono text-cyan-400 font-bold">
                                    {notif.amountFormatted}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                                <span>{notif.timeAgo}</span>
                                {notif.actionRoute && (
                                  <button
                                    onClick={() => {
                                      setShowNotifications(false);
                                      onNavigate(notif.actionRoute!);
                                    }}
                                    className="text-cyan-400 hover:underline flex items-center gap-0.5 font-medium"
                                  >
                                    View details <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="text-slate-500 hover:text-slate-300 p-1"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
