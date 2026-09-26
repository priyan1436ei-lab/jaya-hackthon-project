import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Landmark,
  Wallet,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Printer,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Receipt,
  XCircle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { RazorpayTransactionRecord } from '../types';
import { FinancialEngine } from '../lib/financialEngine';

export interface PaymentGatewayOrderData {
  title: string;
  description?: string;
  amount: number;
  category?: 'SUBSCRIPTION' | 'BILL' | 'GOAL_TOPUP' | 'TRANSFER' | 'CUSTOM';
  planId?: string;
  billId?: number;
  goalId?: number;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: PaymentGatewayOrderData | null;
  onPaymentSuccess: (transaction: RazorpayTransactionRecord) => void;
}

type GatewayStep =
  | 'METHOD_SELECT'
  | 'UPI_INTENT_PENDING'
  | 'AUTHENTICATING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED';

export interface UpiFailureDetails {
  code: string;
  title: string;
  message: string;
  suggestedAction: string;
  canRetrySameApp: boolean;
}

const UPI_FAILURE_PRESETS: Record<string, UpiFailureDetails> = {
  USER_CANCELLED: {
    code: 'NPCI_ERR_U69',
    title: 'Payment Request Declined on UPI App',
    message: 'The authorization prompt was cancelled or dismissed on your UPI application.',
    suggestedAction: 'Please keep your UPI app open in the foreground and approve the payment before timeout.',
    canRetrySameApp: true
  },
  INCORRECT_PIN: {
    code: 'NPCI_ERR_ZM_INCORRECT_PIN',
    title: 'Incorrect UPI PIN Entered',
    message: 'The 4 or 6-digit UPI MPIN entered in your banking app did not match your account security profile.',
    suggestedAction: 'Verify your UPI PIN or reset it via your bank debit card inside your UPI app.',
    canRetrySameApp: true
  },
  CBS_TIMEOUT: {
    code: 'NPCI_ERR_U16_HOST_TIMEOUT',
    title: 'Bank Server / CBS Unreachable',
    message: 'The issuing bank Core Banking System (CBS) took too long to respond to the NPCI clearance switch.',
    suggestedAction: 'The issuing bank is facing intermittent downtime. Try another UPI app linked to a different bank account, or pay via Card.',
    canRetrySameApp: false
  },
  INSUFFICIENT_FUNDS: {
    code: 'NPCI_ERR_U66_INSUFFICIENT_BALANCE',
    title: 'Insufficient Account Balance',
    message: 'Your selected bank account does not have sufficient liquid balance to complete this transaction.',
    suggestedAction: 'Please top up your account, switch to another linked bank account, or choose RuPay Credit Card on UPI.',
    canRetrySameApp: false
  },
  LIMIT_EXCEEDED: {
    code: 'NPCI_ERR_U30_LIMIT_EXCEEDED',
    title: 'UPI Daily Transaction Limit Exceeded',
    message: 'This payment exceeds your bank or UPI app cumulative 24-hour transaction or frequency ceiling.',
    suggestedAction: 'Use NetBanking or a Debit/Credit Card, which have higher permissible transaction thresholds.',
    canRetrySameApp: false
  },
  TIMEOUT: {
    code: 'NPCI_ERR_EX01_EXPIRED',
    title: 'UPI Intent Session Expired',
    message: 'The 5-minute approval window timed out before receiving cryptographic confirmation from NPCI.',
    suggestedAction: 'Restart the payment intent and approve promptly once the notification arrives.',
    canRetrySameApp: true
  }
};

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  orderData,
  onPaymentSuccess
}) => {
  if (!isOpen || !orderData) return null;

  const [currentStep, setCurrentStep] = useState<GatewayStep>('METHOD_SELECT');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'EMI'>('UPI');

  // Selected UPI App Details
  const [selectedUpiApp, setSelectedUpiApp] = useState<{
    name: string;
    id: string;
    badge: string;
    iconColor: string;
  }>({
    name: 'Google Pay',
    id: 'gpay',
    badge: 'Fastest',
    iconColor: 'from-blue-600 to-emerald-600'
  });

  // UPI State
  const [upiSubMode, setUpiSubMode] = useState<'APPS' | 'VPA' | 'QR'>('APPS');
  const [userVpa, setUserVpa] = useState('user@okhdfcbank');
  const [vpaVerified, setVpaVerified] = useState(false);
  const [isVerifyingVpa, setIsVerifyingVpa] = useState(false);
  const [qrTimerSeconds, setQrTimerSeconds] = useState(300);
  const [intentTimerSeconds, setIntentTimerSeconds] = useState(240); // 4 min countdown for UPI intent

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 8921 7734 9012');
  const [cardHolder, setCardHolder] = useState('Priyanshu Sharma');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('843');
  const [saveCardToken, setSaveCardToken] = useState(true);

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Wallet State
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  // EMI State
  const [selectedEmiTenure, setSelectedEmiTenure] = useState('3_MONTHS');

  // Authentication & Processing State
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(45);
  const [processingStatusText, setProcessingStatusText] = useState('Contacting issuing bank gateway...');

  // Rich Failure State (Especially for UPI Intent)
  const [failureError, setFailureError] = useState('');
  const [upiFailureInfo, setUpiFailureInfo] = useState<UpiFailureDetails | null>(null);

  // Successful Transaction Record
  const [completedTxn, setCompletedTxn] = useState<RazorpayTransactionRecord | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Simulated Order ID
  const orderId = `order_${Math.random().toString(36).substring(2, 11)}`;

  // Format Card Number
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // QR Timer countdown
  useEffect(() => {
    if (currentStep === 'METHOD_SELECT' && selectedMethod === 'UPI' && upiSubMode === 'QR' && qrTimerSeconds > 0) {
      const timer = setInterval(() => setQrTimerSeconds((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, selectedMethod, upiSubMode, qrTimerSeconds]);

  // UPI Intent Countdown timer
  useEffect(() => {
    if (currentStep === 'UPI_INTENT_PENDING' && intentTimerSeconds > 0) {
      const timer = setInterval(() => setIntentTimerSeconds((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (currentStep === 'UPI_INTENT_PENDING' && intentTimerSeconds === 0) {
      triggerUpiFailure('TIMEOUT');
    }
  }, [currentStep, intentTimerSeconds]);

  // OTP Timer countdown
  useEffect(() => {
    if (currentStep === 'AUTHENTICATING' && otpTimer > 0) {
      const timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, otpTimer]);

  const handleVerifyVpa = () => {
    if (!userVpa.includes('@')) return;
    setIsVerifyingVpa(true);
    setTimeout(() => {
      setIsVerifyingVpa(false);
      setVpaVerified(true);
    }, 600);
  };

  // Launch UPI Intent
  const handleLaunchUpiAppIntent = (app: { name: string; id: string; badge: string; iconColor: string }) => {
    setSelectedUpiApp(app);
    setIntentTimerSeconds(240); // 4 minutes
    setUpiFailureInfo(null);
    setCurrentStep('UPI_INTENT_PENDING');
  };

  // Initiate Authentication / OTP Step for non-intent or manual cards
  const handleProceedToAuth = () => {
    setCurrentStep('AUTHENTICATING');
    setOtpTimer(45);
    setOtpValue('');
  };

  // Handle Intent Failure trigger
  const triggerUpiFailure = (presetKey: keyof typeof UPI_FAILURE_PRESETS) => {
    const details = UPI_FAILURE_PRESETS[presetKey] || UPI_FAILURE_PRESETS.USER_CANCELLED;
    setUpiFailureInfo(details);
    setFailureError(`${details.title}: ${details.message}`);
    setCurrentStep('FAILED');
  };

  // Submit & Process Gateway Authorization
  const handleAuthorizePayment = (simulateFailure = false, failureKey: keyof typeof UPI_FAILURE_PRESETS = 'USER_CANCELLED') => {
    setCurrentStep('PROCESSING');
    setProcessingStatusText('Connecting to issuing bank & NPCI switch...');

    setTimeout(() => {
      setProcessingStatusText('Verifying cryptographic token & UPI MPIN signature...');
    }, 800);

    setTimeout(() => {
      setProcessingStatusText('Settling funds via Reserve Bank of India IMPS/RTGS...');
    }, 1600);

    setTimeout(() => {
      if (simulateFailure) {
        triggerUpiFailure(failureKey);
        return;
      }

      const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const signature = `sig_${Math.random().toString(36).substring(2, 16)}`;
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      let resolvedMethodName = `${selectedUpiApp.name} (UPI Intent)`;
      if (selectedMethod === 'UPI' && upiSubMode === 'VPA') {
        resolvedMethodName = `UPI VPA (${userVpa})`;
      } else if (selectedMethod === 'UPI' && upiSubMode === 'QR') {
        resolvedMethodName = `UPI QR Dynamic Payment`;
      } else if (selectedMethod === 'CARD') {
        const isRupay = cardNumber.startsWith('6') || cardNumber.startsWith('5');
        resolvedMethodName = `${isRupay ? 'RuPay' : 'Visa/MasterCard'} ending in ${cardNumber.slice(-4) || '9012'}`;
      } else if (selectedMethod === 'NETBANKING') {
        resolvedMethodName = `NetBanking (${selectedBank} Bank)`;
      } else if (selectedMethod === 'WALLET') {
        resolvedMethodName = `${selectedWallet} Digital Wallet`;
      } else if (selectedMethod === 'EMI') {
        resolvedMethodName = `RuPay Credit EMI (${selectedEmiTenure.replace('_', ' ')})`;
      }

      const txn: RazorpayTransactionRecord = {
        id: paymentId,
        orderId,
        paymentId,
        signature,
        userId: 'priyan1436ei@gmail.com',
        planId: orderData.planId || orderData.category || 'custom_payment',
        planTitle: orderData.title,
        amount: orderData.amount,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: resolvedMethodName,
        date: dateFormatted,
        timestamp: Date.now(),
        validUntil: 'Active (Lifetime Verified)',
        refundStatus: null
      };

      setCompletedTxn(txn);
      setCurrentStep('SUCCESS');
      onPaymentSuccess(txn);
    }, 2400);
  };

  const handleCopyPaymentId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCloseModal = () => {
    setCurrentStep('METHOD_SELECT');
    setCompletedTxn(null);
    setUpiFailureInfo(null);
    onClose();
  };

  // Visual status pill computation
  const getStatusBadge = () => {
    if (currentStep === 'UPI_INTENT_PENDING' || currentStep === 'AUTHENTICATING') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          Pending Authorization
        </span>
      );
    }
    if (currentStep === 'PROCESSING') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
          <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
          Processing Clearance
        </span>
      );
    }
    if (currentStep === 'SUCCESS') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Success • Settled
        </span>
      );
    }
    if (currentStep === 'FAILED') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20">
          <XCircle className="w-3 h-3 text-rose-400" />
          Failed • Declined
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
        Ready to Checkout
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-[#090E20] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Gateway Brand Header */}
        <div className="bg-gradient-to-r from-[#0C152F] via-[#101D40] to-[#0A122A] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  FinFam Gateway
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    256-Bit SSL
                  </span>
                </h2>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> PCI-DSS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Merchant: <span className="text-slate-200 font-medium">FinFam Technologies</span> • Priyanshu Sharma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Amount</span>
              <span className="text-lg sm:text-xl font-black font-mono text-white">
                {FinancialEngine.formatINR(orderData.amount)}
              </span>
            </div>
            {currentStep !== 'PROCESSING' && (
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ml-1"
                title="Close Gateway"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Visual Status Stepper Bar */}
        <div className="bg-[#060A1A] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs">
          {/* Status Stepper */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-cyan-500 text-[#050816] text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-[11px] font-semibold text-slate-200 hidden sm:inline">Method</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <div className="flex items-center gap-1">
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  currentStep === 'UPI_INTENT_PENDING' || currentStep === 'AUTHENTICATING' || currentStep === 'PROCESSING'
                    ? 'bg-amber-400 text-[#050816] animate-pulse ring-2 ring-amber-400/40'
                    : currentStep === 'SUCCESS' || currentStep === 'FAILED'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                2
              </span>
              <span
                className={`text-[11px] font-semibold hidden sm:inline ${
                  currentStep === 'UPI_INTENT_PENDING' || currentStep === 'AUTHENTICATING' || currentStep === 'PROCESSING'
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }`}
              >
                Authorize
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <div className="flex items-center gap-1">
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  currentStep === 'SUCCESS'
                    ? 'bg-emerald-500 text-black'
                    : currentStep === 'FAILED'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                3
              </span>
              <span
                className={`text-[11px] font-semibold hidden sm:inline ${
                  currentStep === 'SUCCESS'
                    ? 'text-emerald-400'
                    : currentStep === 'FAILED'
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                Settlement
              </span>
            </div>
          </div>

          {/* Dynamic Status Pill */}
          <div>{getStatusBadge()}</div>
        </div>

        {/* Dynamic Step Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* STEP 1: PAYMENT METHOD SELECT */}
          {currentStep === 'METHOD_SELECT' && (
            <div className="space-y-5">
              {/* Method Selector Bar */}
              <div className="grid grid-cols-5 gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'UPI', label: 'UPI', icon: Zap },
                  { id: 'CARD', label: 'Cards', icon: CreditCard },
                  { id: 'NETBANKING', label: 'NetBank', icon: Landmark },
                  { id: 'WALLET', label: 'Wallets', icon: Wallet },
                  { id: 'EMI', label: 'EMI', icon: Clock }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedMethod(item.id as any)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-[#050816] shadow-md shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[11px] truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPI Options */}
              {selectedMethod === 'UPI' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <button
                      onClick={() => setUpiSubMode('APPS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        upiSubMode === 'APPS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                      }`}
                    >
                      Popular UPI Apps (Intent)
                    </button>
                    <button
                      onClick={() => setUpiSubMode('VPA')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        upiSubMode === 'VPA' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                      }`}
                    >
                      Enter UPI ID / VPA
                    </button>
                    <button
                      onClick={() => setUpiSubMode('QR')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        upiSubMode === 'QR' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                      }`}
                    >
                      Dynamic QR Code
                    </button>
                  </div>

                  {/* UPI Apps Grid (Intent Triggers) */}
                  {upiSubMode === 'APPS' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Select installed UPI App for instant intent:</span>
                        <span className="text-cyan-400 text-[11px] flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> Auto-Invokes App
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: 'gpay', name: 'Google Pay', badge: 'Fastest', iconColor: 'from-blue-600 to-emerald-600' },
                          { id: 'phonepe', name: 'PhonePe', badge: 'Auto-Detect', iconColor: 'from-purple-600 to-indigo-600' },
                          { id: 'paytm', name: 'Paytm UPI', badge: 'Zero Fee', iconColor: 'from-sky-600 to-blue-700' },
                          { id: 'bhim', name: 'BHIM UPI', badge: 'Govt NPCI', iconColor: 'from-emerald-600 to-teal-700' },
                          { id: 'cred', name: 'CRED UPI', badge: 'Cashback', iconColor: 'from-amber-600 to-orange-700' },
                          { id: 'navi', name: 'Navi UPI', badge: 'Instant', iconColor: 'from-rose-600 to-pink-700' }
                        ].map((app) => (
                          <button
                            key={app.id}
                            onClick={() => handleLaunchUpiAppIntent(app)}
                            className="p-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-cyan-400 text-left transition-all hover:scale-102 group relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                                {app.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                                {app.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              Tap to launch intent <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VPA Input */}
                  {upiSubMode === 'VPA' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Virtual Payment Address (VPA / UPI ID)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userVpa}
                            onChange={(e) => {
                              setUserVpa(e.target.value);
                              setVpaVerified(false);
                            }}
                            placeholder="username@okhdfcbank"
                            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={handleVerifyVpa}
                            disabled={isVerifyingVpa || vpaVerified}
                            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                              vpaVerified
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {isVerifyingVpa ? 'Checking...' : vpaVerified ? 'Verified ✓' : 'Verify'}
                          </button>
                        </div>
                        {vpaVerified && (
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Registered to Priyanshu Sharma (Verified NPCI Handle)
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          handleLaunchUpiAppIntent({
                            name: `UPI Collect (${userVpa})`,
                            id: 'vpa_collect',
                            badge: 'Collect Request',
                            iconColor: 'from-cyan-600 to-blue-600'
                          })
                        }
                        className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        Send Payment Request to {userVpa}
                      </button>
                    </div>
                  )}

                  {/* Dynamic QR Mode */}
                  {upiSubMode === 'QR' && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-center space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                        <span>Scan with any UPI App</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          Expires in: {Math.floor(qrTimerSeconds / 60)}:{(qrTimerSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>

                      <div className="w-44 h-44 bg-white rounded-2xl p-2 mx-auto flex items-center justify-center shadow-lg">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                          <rect width="100" height="100" fill="white" />
                          <rect x="5" y="5" width="26" height="26" fill="black" />
                          <rect x="9" y="9" width="18" height="18" fill="white" />
                          <rect x="13" y="13" width="10" height="10" fill="black" />
                          <rect x="69" y="5" width="26" height="26" fill="black" />
                          <rect x="73" y="9" width="18" height="18" fill="white" />
                          <rect x="77" y="13" width="10" height="10" fill="black" />
                          <rect x="5" y="69" width="26" height="26" fill="black" />
                          <rect x="9" y="73" width="18" height="18" fill="white" />
                          <rect x="13" y="77" width="10" height="10" fill="black" />
                          <rect x="36" y="8" width="6" height="6" fill="black" />
                          <rect x="46" y="8" width="6" height="6" fill="black" />
                          <rect x="36" y="20" width="6" height="6" fill="black" />
                          <rect x="46" y="24" width="6" height="6" fill="black" />
                          <rect x="38" y="38" width="24" height="24" fill="#0891b2" rx="4" />
                          <circle cx="50" cy="50" r="7" fill="white" />
                          <circle cx="50" cy="50" r="3" fill="#0891b2" />
                          <rect x="8" y="36" width="6" height="6" fill="black" />
                          <rect x="16" y="46" width="6" height="6" fill="black" />
                          <rect x="68" y="38" width="6" height="6" fill="black" />
                          <rect x="78" y="46" width="6" height="6" fill="black" />
                          <rect x="36" y="68" width="6" height="6" fill="black" />
                          <rect x="48" y="78" width="6" height="6" fill="black" />
                        </svg>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Scan with GPay, PhonePe, Paytm, BHIM, or any banking app
                      </p>

                      <button
                        onClick={() => handleAuthorizePayment(false)}
                        className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 mx-auto transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" /> Simulate Mobile QR Approval
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CARD OPTIONS */}
              {selectedMethod === 'CARD' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-cyan-500/30 shadow-lg text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase">
                        FinFam Secure Card
                      </span>
                      <span className="text-xs font-bold text-amber-300 font-mono">RuPay / VISA</span>
                    </div>
                    <div className="text-base sm:text-lg font-mono tracking-widest font-bold">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Cardholder</div>
                        <div className="font-semibold">{cardHolder || 'CARDHOLDER NAME'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Expires</div>
                        <div className="font-mono font-semibold">{cardExpiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4532 8921 7734 9012"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Priyanshu Sharma"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveCardToken}
                        onChange={(e) => setSaveCardToken(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-900 border-white/20"
                      />
                      <span className="text-[11px] text-slate-400">
                        Tokenize card securely as per Reserve Bank of India (RBI) mandates
                      </span>
                    </label>

                    <button
                      onClick={handleProceedToAuth}
                      className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      Pay {FinancialEngine.formatINR(orderData.amount)} via Card
                    </button>
                  </div>
                </div>
              )}

              {/* NETBANKING OPTIONS */}
              {selectedMethod === 'NETBANKING' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-slate-300 font-medium">Select Preferred Indian Scheduled Bank:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { code: 'HDFC', name: 'HDFC Bank' },
                      { code: 'SBI', name: 'State Bank of India' },
                      { code: 'ICICI', name: 'ICICI Bank' },
                      { code: 'AXIS', name: 'Axis Bank' },
                      { code: 'KOTAK', name: 'Kotak Mahindra' },
                      { code: 'PNB', name: 'Punjab National' }
                    ].map((bank) => (
                      <button
                        key={bank.code}
                        onClick={() => setSelectedBank(bank.code)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedBank === bank.code
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{bank.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Corporate & Retail NetBanking</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleProceedToAuth}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Authenticate with {selectedBank} NetBanking
                  </button>
                </div>
              )}

              {/* WALLETS */}
              {selectedMethod === 'WALLET' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-slate-300 font-medium">Select Digital Wallet:</div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Paytm Wallet', 'Amazon Pay', 'MobiKwik', 'PhonePe Wallet'].map((w) => (
                      <button
                        key={w}
                        onClick={() => setSelectedWallet(w)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          selectedWallet === w
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{w}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Linked Balance Ready</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleProceedToAuth}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    Debit {FinancialEngine.formatINR(orderData.amount)} from {selectedWallet}
                  </button>
                </div>
              )}

              {/* EMI */}
              {selectedMethod === 'EMI' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>0% Interest No-Cost EMI pre-approved on linked RuPay Credit Cards!</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { id: '3_MONTHS', months: 3, monthly: Math.round(orderData.amount / 3), note: '0% Interest' },
                      { id: '6_MONTHS', months: 6, monthly: Math.round((orderData.amount * 1.05) / 6), note: '12% p.a.' },
                      { id: '12_MONTHS', months: 12, monthly: Math.round((orderData.amount * 1.1) / 12), note: '14% p.a.' }
                    ].map((emi) => (
                      <button
                        key={emi.id}
                        onClick={() => setSelectedEmiTenure(emi.id)}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          selectedEmiTenure === emi.id
                            ? 'bg-cyan-500/15 border-cyan-400 text-white'
                            : 'bg-slate-900 border-white/10 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{emi.months} Months Plan</div>
                          <div className="text-[10px] text-cyan-400 font-mono">{emi.note}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-white">
                            {FinancialEngine.formatINR(emi.monthly)}/mo
                          </div>
                          <div className="text-[10px] text-slate-400">Total: {FinancialEngine.formatINR(emi.monthly * emi.months)}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleProceedToAuth}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    Setup EMI Schedule
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2A: UPI INTENT PENDING (LIVE LISTENER SCREEN) */}
          {currentStep === 'UPI_INTENT_PENDING' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Visual Status Indicator Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
                    <span className="text-xs font-bold uppercase font-mono tracking-wider text-amber-300">
                      UPI Intent Active
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {Math.floor(intentTimerSeconds / 60)}:{(intentTimerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* App Brand Spotlight */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-cyan-500/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedUpiApp.name}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {selectedUpiApp.badge}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Waiting for your authorization on {selectedUpiApp.name}
                    </p>
                  </div>
                </div>

                {/* Real-time Instructions */}
                <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                  <div className="font-semibold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-cyan-400">
                    <Zap className="w-3.5 h-3.5" /> Next Steps to complete payment:
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                    <li>Open the <span className="text-cyan-300 font-semibold">{selectedUpiApp.name}</span> app notification on your mobile device.</li>
                    <li>Verify payee name: <span className="text-white font-semibold">FinFam Technologies (Priyanshu Sharma)</span>.</li>
                    <li>Verify amount: <span className="font-mono text-cyan-300 font-bold">{FinancialEngine.formatINR(orderData.amount)}</span>.</li>
                    <li>Enter your secret <span className="text-amber-300 font-semibold">UPI MPIN</span> to authorize the transaction.</li>
                  </ol>
                </div>

                {/* Webhook Polling Pulse */}
                <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                  </div>
                  <span>Awaiting instant NPCI clearance webhook confirmation...</span>
                </div>
              </div>

              {/* Simulation Testing Toolbar for User/Judges */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Test & Simulation Controls
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Verify Status Outcomes</span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleAuthorizePayment(false)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> Simulate Successful UPI App Approval
                  </button>

                  <div className="text-[11px] text-slate-400 text-center font-medium pt-1">
                    Or simulate realistic UPI failure scenarios:
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAuthorizePayment(true, 'USER_CANCELLED')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-[11px] font-semibold text-left transition-all"
                    >
                      <div className="text-white font-bold">1. User Cancelled</div>
                      <div className="text-[9px] text-slate-400">Declined in {selectedUpiApp.name}</div>
                    </button>

                    <button
                      onClick={() => handleAuthorizePayment(true, 'INCORRECT_PIN')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-[11px] font-semibold text-left transition-all"
                    >
                      <div className="text-white font-bold">2. Wrong UPI PIN</div>
                      <div className="text-[9px] text-slate-400">MPIN mismatch error</div>
                    </button>

                    <button
                      onClick={() => handleAuthorizePayment(true, 'CBS_TIMEOUT')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-[11px] font-semibold text-left transition-all"
                    >
                      <div className="text-white font-bold">3. Bank Server Down</div>
                      <div className="text-[9px] text-slate-400">NPCI CBS host timeout</div>
                    </button>

                    <button
                      onClick={() => handleAuthorizePayment(true, 'INSUFFICIENT_FUNDS')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-[11px] font-semibold text-left transition-all"
                    >
                      <div className="text-white font-bold">4. Insufficient Balance</div>
                      <div className="text-[9px] text-slate-400">Account funds low</div>
                    </button>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <button
                    onClick={() => setCurrentStep('METHOD_SELECT')}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel and change payment method
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2B: 3D SECURE / BANK AUTHENTICATION OTP */}
          {currentStep === 'AUTHENTICATING' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                    OTP
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      NPCI / Issuing Bank Authentication
                    </h3>
                    <p className="text-[10px] text-slate-400">One-Time Password Sent to +91 98*** **432</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {FinancialEngine.formatINR(orderData.amount)}
                </span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Enter 6-Digit Bank Verification OTP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => setOtpValue('123456')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10"
                    title="Quick Fill Demo OTP"
                  >
                    Auto-Fill (123456)
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Resend code in: <span className="font-mono text-cyan-300">{otpTimer}s</span>
                  </span>
                  <span className="text-slate-500">Ref: {orderId.slice(0, 10)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setCurrentStep('METHOD_SELECT')}
                  className="py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all"
                >
                  Cancel Payment
                </button>
                <button
                  onClick={() => handleAuthorizePayment(false)}
                  className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Authorize & Pay
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => handleAuthorizePayment(true, 'CBS_TIMEOUT')}
                  className="text-[10px] text-rose-400/80 hover:text-rose-300 underline"
                >
                  (Test simulate bank failure scenario)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING STATE */}
          {currentStep === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Processing Gateway Transaction...
                </h3>
                <p className="text-xs text-cyan-300 font-mono animate-pulse">
                  {processingStatusText}
                </p>
                <p className="text-[11px] text-slate-500">
                  Please do not refresh or press back button.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {currentStep === 'SUCCESS' && completedTxn && (
            <div className="space-y-5 animate-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white">Payment Authorized Successfully!</h3>
                <p className="text-xs text-slate-300">
                  {FinancialEngine.formatINR(completedTxn.amount)} credited to {orderData.title}
                </p>
              </div>

              {/* Formal Digital Tax Invoice Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                      Tax Receipt & Proof of Payment
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    PAID • 200 OK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Payment ID</span>
                    <div className="flex items-center gap-1 font-mono text-white text-xs font-semibold">
                      <span>{completedTxn.paymentId}</span>
                      <button
                        onClick={() => handleCopyPaymentId(completedTxn.paymentId)}
                        className="text-slate-400 hover:text-cyan-400 p-0.5"
                      >
                        {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Order ID</span>
                    <span className="font-mono text-white text-xs font-semibold">{completedTxn.orderId}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Date & Time</span>
                    <span className="text-white text-xs">{completedTxn.date}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Payment Method</span>
                    <span className="text-white text-xs font-medium">{completedTxn.paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Amount</span>
                    <span className="font-mono text-white">{FinancialEngine.formatINR(completedTxn.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Gateway Processing Surcharge</span>
                    <span className="font-mono text-emerald-400">₹0.00 (Waived)</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-white/5 text-sm">
                    <span>Total Amount Charged</span>
                    <span className="font-mono text-cyan-400">{FinancialEngine.formatINR(completedTxn.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handlePrintReceipt}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print Receipt
                </button>
                <button
                  onClick={handleCloseModal}
                  className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Done
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ENHANCED FAILED STATE WITH CLEAR ERROR MESSAGING */}
          {currentStep === 'FAILED' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Prominent Visual Failure Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#180A12] to-slate-950 border border-rose-500/50 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 shadow-lg shadow-rose-500/10">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        Transaction Declined
                      </span>
                      {upiFailureInfo?.code && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/10">
                          Code: {upiFailureInfo.code}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      {upiFailureInfo?.title || 'Payment Authorization Declined'}
                    </h3>
                  </div>
                </div>

                {/* Clear Error Description */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/20 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-200">Reason for Failure:</div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {upiFailureInfo?.message || failureError || 'Your issuing bank declined payment authorization.'}
                      </p>
                    </div>
                  </div>

                  {upiFailureInfo?.suggestedAction && (
                    <div className="pt-2 border-t border-white/5 text-[11px] text-cyan-300 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Recommended Resolution:</strong> {upiFailureInfo.suggestedAction}
                      </span>
                    </div>
                  )}
                </div>

                {/* Safety & No Debit Guarantee Note */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <strong>Account Balance Safe:</strong> No money was debited from your bank account.
                  </span>
                  <span className="text-slate-500 text-[10px] font-mono">RBI Mandate Compliant</span>
                </div>
              </div>

              {/* Action Recovery Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (selectedMethod === 'UPI') {
                        handleLaunchUpiAppIntent(selectedUpiApp);
                      } else {
                        handleAuthorizePayment(false);
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050816] font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry with {selectedUpiApp.name}
                  </button>

                  <button
                    onClick={() => setCurrentStep('METHOD_SELECT')}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all"
                  >
                    Choose Different Payment Method
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    onClick={handleCloseModal}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel & Return to FinFam Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="bg-[#050816] px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-cyan-400" /> End-to-End Encrypted
          </span>
          <div className="flex items-center gap-3">
            <span>Razorpay 2.0</span>
            <span>•</span>
            <span>NPCI Unified Payments</span>
            <span>•</span>
            <span className="text-slate-400 font-bold">RBI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
