import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  RotateCcw,
  Sparkles,
  Smartphone,
  Landmark,
  Tv,
  Wifi,
  Flame,
  Droplets,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useFinFam, SUBSCRIPTION_PLANS } from '../context/FinFamContext';
import { FinancialEngine } from '../lib/financialEngine';
import { RazorpayTransactionRecord } from '../types';

export const PaymentScreen: React.FC<{ onNavigateToTransfer: () => void }> = ({
  onNavigateToTransfer
}) => {
  const {
    userProfile,
    paymentHistory,
    processSubscriptionPayment,
    refundPayment,
    payBill,
    bills,
    openPaymentGateway
  } = useFinFam();

  const [activeTab, setActiveTab] = useState(0); // 0: Smart Pay, 1: Premium Plans, 2: Scan & Pay, 3: Pay Bills, 4: Passbook
  const [selectedPlanId, setSelectedPlanId] = useState('premium_annual');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [customPayAmount, setCustomPayAmount] = useState('500');
  const [customPayNote, setCustomPayNote] = useState('Household expense');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<RazorpayTransactionRecord | null>(null);

  const merchantUpi = 'priyan1436ei@okhdfcbank';
  const merchantName = 'Priyanshu Sharma';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubscribe = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
    openPaymentGateway({
      title: plan.title,
      description: `${plan.badge} • ${plan.durationDays} Days Membership`,
      amount: plan.amountInr,
      category: 'SUBSCRIPTION',
      planId: plan.id
    });
  };

  const handleRefund = async (paymentId: string) => {
    const result = await refundPayment(paymentId);
    if (result.success) {
      setSuccessStatus(result.message);
      setTimeout(() => setSuccessStatus(null), 4000);
    }
  };

  const handleCustomUpiPay = () => {
    const amt = parseFloat(customPayAmount);
    if (isNaN(amt) || amt <= 0) return;
    openPaymentGateway({
      title: customPayNote || 'Direct Household Transfer',
      amount: amt,
      category: 'TRANSFER'
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              FINFAM PAYMENTS & GATEWAY
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              RUPAY & UPI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Merchant: {merchantName} • <span className="font-mono text-cyan-400">{merchantUpi}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() =>
              openPaymentGateway({
                title: 'FinFam Gateway Checkout Demo',
                amount: parseFloat(customPayAmount || '500'),
                category: 'CUSTOM'
              })
            }
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> Launch Gateway
          </button>
          <button
            onClick={onNavigateToTransfer}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 text-xs font-semibold border border-purple-500/30 flex items-center gap-1.5"
          >
            P2P Mesh Beam
          </button>
        </div>
      </div>

      {successStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successStatus}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/10 pb-2">
        {[
          { id: 0, label: 'Smart Pay' },
          { id: 1, label: 'Premium Plans' },
          { id: 2, label: 'Scan & Pay' },
          { id: 3, label: 'Pay Bills' },
          { id: 4, label: `Passbook (${paymentHistory.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-[#050816] shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 0: Smart Pay (UPI & RuPay Cards) */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Direct UPI Transfer Form */}
          <div className="lg:col-span-7 rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Direct UPI & RuPay Intent</h3>
                <p className="text-[11px] text-slate-400">Zero surcharge, instant settlement</p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                NPCI 2.0
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient UPI ID / VPA
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={merchantUpi}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleCopyUpi}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-white/10 flex items-center gap-1 transition-all"
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedUpi ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount to Send (₹)
                  </label>
                  <input
                    type="number"
                    value={customPayAmount}
                    onChange={(e) => setCustomPayAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Instrument
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="UPI">Direct UPI Intent</option>
                    <option value="RuPay Card">RuPay Credit Card (Linked)</option>
                    <option value="HDFC Bank">HDFC Bank Primary A/C</option>
                    <option value="SBI Bank">State Bank of India</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purpose / Note
                </label>
                <input
                  type="text"
                  value={customPayNote}
                  onChange={(e) => setCustomPayNote(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCustomUpiPay}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {isProcessing ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Authorize & Pay ₹{parseFloat(customPayAmount || '0').toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic UPI QR Code Card */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#101A33] to-[#080E20] border border-cyan-500/30 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Dynamic UPI QR Code
            </span>

            {/* Generated SVG QR Code representation */}
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none">
                {/* QR Pattern visual simulation */}
                <rect width="100" height="100" fill="white" />
                {/* Top Left Marker */}
                <rect x="5" y="5" width="26" height="26" fill="black" />
                <rect x="9" y="9" width="18" height="18" fill="white" />
                <rect x="13" y="13" width="10" height="10" fill="black" />
                {/* Top Right Marker */}
                <rect x="69" y="5" width="26" height="26" fill="black" />
                <rect x="73" y="9" width="18" height="18" fill="white" />
                <rect x="77" y="13" width="10" height="10" fill="black" />
                {/* Bottom Left Marker */}
                <rect x="5" y="69" width="26" height="26" fill="black" />
                <rect x="9" y="73" width="18" height="18" fill="white" />
                <rect x="13" y="77" width="10" height="10" fill="black" />
                {/* Matrix dots */}
                <rect x="36" y="8" width="5" height="5" fill="black" />
                <rect x="44" y="8" width="5" height="5" fill="black" />
                <rect x="52" y="8" width="5" height="5" fill="black" />
                <rect x="36" y="16" width="5" height="5" fill="black" />
                <rect x="48" y="24" width="5" height="5" fill="black" />
                <rect x="56" y="24" width="5" height="5" fill="black" />
                <rect x="8" y="36" width="5" height="5" fill="black" />
                <rect x="16" y="44" width="5" height="5" fill="black" />
                <rect x="24" y="36" width="5" height="5" fill="black" />
                <rect x="36" y="36" width="28" height="28" fill="#06B6D4" rx="4" />
                {/* Center logo */}
                <circle cx="50" cy="50" r="10" fill="#050816" />
                <path d="M47 50 L53 50 M50 47 L50 53" stroke="#06B6D4" strokeWidth="2" />
                <rect x="69" y="36" width="5" height="5" fill="black" />
                <rect x="77" y="44" width="5" height="5" fill="black" />
                <rect x="85" y="36" width="5" height="5" fill="black" />
                <rect x="36" y="69" width="5" height="5" fill="black" />
                <rect x="44" y="77" width="5" height="5" fill="black" />
                <rect x="52" y="85" width="5" height="5" fill="black" />
                <rect x="69" y="69" width="5" height="5" fill="black" />
                <rect x="77" y="77" width="5" height="5" fill="black" />
                <rect x="85" y="85" width="5" height="5" fill="black" />
              </svg>
            </div>

            <div>
              <div className="text-sm font-bold font-mono text-white">
                Scan with any UPI App
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                BHIM • GPay • PhonePe • Paytm • Cred • Navi
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Premium Plans */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              FinFam Pro Membership
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Unlock Multi-User Vault, Smart EMI & AI Coach
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Protected by Razorpay Live Checkout & UPI Anti-Scam Shield
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isCurrent = userProfile.premiumTier === plan.id.toUpperCase();

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`cursor-pointer rounded-2xl p-5 flex flex-col justify-between border transition-all ${
                    isSelected
                      ? 'bg-[#121D3A] border-cyan-400 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                      : 'bg-[#0E1528] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                          plan.recommended
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {plan.badge}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          CURRENT PLAN
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white mt-3">{plan.title}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-extrabold font-mono text-white">
                        ₹{plan.amountInr}
                      </span>
                      <span className="text-xs text-slate-400">
                        {plan.durationDays > 365 ? ' one-time' : ` /${plan.durationDays} days`}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.id);
                    }}
                    disabled={isProcessing}
                    className={`w-full mt-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-[#050816] shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                    }`}
                  >
                    {isProcessing && selectedPlanId === plan.id
                      ? 'Processing Checkout...'
                      : isCurrent
                      ? 'Renew Plan'
                      : `Upgrade for ₹${plan.amountInr}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Scan & Pay Simulator */}
      {activeTab === 2 && (
        <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-6 max-w-xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Scan & Pay (ZXing Simulator)</h3>
            <p className="text-xs text-slate-400">
              Decode merchant UPI barcodes and execute real-time settlement
            </p>
          </div>

          <div className="border border-white/10 rounded-xl p-4 bg-slate-900/60 space-y-3">
            <div className="text-xs font-semibold text-slate-300">Simulated Merchant Payloads:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setCustomPayAmount('1845');
                  setCustomPayNote('Grocery invoice');
                  setActiveTab(0);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-white/5 text-xs text-slate-200"
              >
                🛒 Nature's Basket VPA
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">₹1,845.00</div>
              </button>
              <button
                onClick={() => {
                  setCustomPayAmount('2340');
                  setCustomPayNote('Electricity bill');
                  setActiveTab(0);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-white/5 text-xs text-slate-200"
              >
                ⚡ Torrent Power VPA
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">₹2,340.00</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Utility Bills */}
      {activeTab === 3 && (
        <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">Household Utility Bill Payments</h3>
              <p className="text-[11px] text-slate-400">BBPS Integrated Settlement</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Unpaid: {bills.filter((b) => !b.isPaid).length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {bill.name}
                    {bill.isPaid && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                        PAID
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Due: {bill.dueDate}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-white">
                    {FinancialEngine.formatINR(bill.amount)}
                  </span>
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
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#050816] text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                    >
                      Pay
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold">Settled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Passbook / Transaction History */}
      {activeTab === 4 && (
        <div className="rounded-2xl bg-[#0E1528] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">Razorpay & UPI Passbook</h3>
              <p className="text-[11px] text-slate-400">All authenticated charges and digital receipts</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              {paymentHistory.length} Recorded
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {paymentHistory.map((rec) => (
              <div key={rec.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {rec.planTitle}
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        rec.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ref: <span className="font-mono">{rec.paymentId}</span> • {rec.date} • {rec.paymentMethod}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono font-bold text-sm text-white">
                    ₹{rec.amount.toLocaleString('en-IN')}
                  </div>
                  {rec.status === 'SUCCESS' && (
                    <button
                      onClick={() => handleRefund(rec.paymentId)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-white/10 flex items-center gap-1"
                      title="Request Refund"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" /> Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
