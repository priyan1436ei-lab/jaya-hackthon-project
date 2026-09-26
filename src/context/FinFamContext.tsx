import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  UserProfile,
  TransactionItem,
  BudgetItem,
  GoalItem,
  BillItem,
  FamilyMemberItem,
  EmiItem,
  FinancialHealth,
  FinancialHealthAxis,
  MonthlySpendingTrendsState,
  TimeHorizonType,
  DailySpendDataPoint,
  WeeklySpendBar,
  FamilyContributionShare,
  ExpensePrediction,
  NotificationAlertItem,
  ReceiptScanResult,
  ChatMessage,
  RealTimeTransferRecord,
  LivePeerNode,
  RazorpayTransactionRecord,
  SubscriptionPlanTier,
  RealTimeTransferType
} from '../types';
import { DecisionHistoryRecord } from '../types/decisionOptimizer';
import {
  HouseholdFinancialProfile,
  GoalFeasibilityResult,
  SharedTimelineResult,
  GoalConflictItem,
  InterferenceMatrixResult,
  ResolutionComparisonResult,
  ResolutionScenario
} from '../types/goalPlanning';
import { FinancialEngine } from '../lib/financialEngine';
import { SpendingTrendsEngine } from '../lib/spendingTrendsEngine';
import { GeminiAiEngine } from '../lib/geminiAiEngine';
import {
  GoalFeasibilityEngine,
  SharedCashflowTimelineEngine,
  GoalConflictEngine,
  GoalInterferenceEngine,
  RippleResolutionEngine,
  DEMO_GOALS,
  DEMO_PROFILE
} from '../lib/goalPlanning';
import { PaymentGatewayOrderData } from '../components/PaymentGatewayModal';

const INITIAL_DECISION_HISTORY: DecisionHistoryRecord[] = [
  {
    id: 'dec_sample_01',
    timestamp: Date.now() - 86400000 * 2,
    scenarioTitle: 'Allocation of ₹50,000 Surplus',
    capitalAmount: 50000,
    winningAlternativeId: 'alt_emergency_fund',
    winningAlternativeTitle: 'Liquid Emergency Reserve Fund',
    winningScore: 88,
    confidenceScore: 84,
    confidenceTier: 'HIGH',
    implementationStatus: 'IMPLEMENTED',
    criteriaWeightsSnapshot: {
      LIQUIDITY: 0.25,
      RETURN_ROI: 0.20,
      RISK_SAFETY: 0.25,
      DEBT_REDUCTION: 0.15,
      TAX_EFFICIENCY: 0.05,
      TIMELINE_FLEXIBILITY: 0.10
    },
    topTradeOffSummary: 'Sacrifices 4.5% equity upside to guarantee 0-day liquidity and zero capital loss risk.'
  }
];

const INITIAL_PROFILE: UserProfile = {
  id: 1,
  name: 'Priyanshu Sharma',
  email: 'priyan1436ei@gmail.com',
  phone: '+91 98765 43210',
  currencySymbol: '₹',
  totalBalance: 84500.0,
  monthlyIncome: 65000.0,
  monthlyExpenses: 38250.0,
  monthlySavings: 26750.0,
  emergencyFund: 72500.0,
  healthScore: 82,
  previousHealthScore: 76,
  isPremium: false,
  premiumTier: 'FREE',
  premiumValidUntil: 'N/A',
  familyId: 'fam_sharma_001',
  familyName: 'Sharma Family Vault',
  isBiometricEnabled: true,
  isNotificationsEnabled: true,
  unreadNotificationsCount: 2
};

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 1,
    title: 'Nature\'s Basket Grocery Store',
    category: 'Food',
    amount: 1845.0,
    type: 'EXPENSE',
    isCredit: false,
    date: '21 Aug 2026',
    timestamp: Date.now() - 3600000 * 2,
    paymentMethod: 'UPI',
    notes: 'Weekly fresh vegetables & almond milk',
    isFamilyShared: true,
    memberName: 'Priyanshu',
    iconName: 'Utensils',
    riskStatus: 'VERIFIED'
  },
  {
    id: 2,
    title: 'Monthly Salary Credit',
    category: 'Salary',
    amount: 65000.0,
    type: 'INCOME',
    isCredit: true,
    date: '01 Aug 2026',
    timestamp: Date.now() - 86400000 * 20,
    paymentMethod: 'Net Banking',
    notes: 'August 2026 Corporate Payroll',
    isFamilyShared: true,
    memberName: 'Priyanshu',
    iconName: 'Building2',
    riskStatus: 'VERIFIED'
  },
  {
    id: 3,
    title: 'HDFC Bank Bike EMI',
    category: 'Vehicle',
    amount: 4200.0,
    type: 'PAYMENT',
    isCredit: false,
    date: '05 Aug 2026',
    timestamp: Date.now() - 86400000 * 16,
    paymentMethod: 'Auto Debit',
    notes: 'Month 14/24 Royal Enfield Hunter 350',
    isFamilyShared: false,
    memberName: 'Priyanshu',
    iconName: 'Bike',
    riskStatus: 'VERIFIED'
  },
  {
    id: 4,
    title: 'Airtel Xstream Fiber Broadband',
    category: 'Bills',
    amount: 1179.0,
    type: 'EXPENSE',
    isCredit: false,
    date: '12 Aug 2026',
    timestamp: Date.now() - 86400000 * 9,
    paymentMethod: 'UPI',
    notes: 'Gigabit 300 Mbps Unlimited Wifi',
    isFamilyShared: true,
    memberName: 'Rajesh (Father)',
    iconName: 'Wifi',
    riskStatus: 'VERIFIED'
  },
  {
    id: 5,
    title: 'Amazon Fresh & Household Supplies',
    category: 'Shopping',
    amount: 2450.0,
    type: 'EXPENSE',
    isCredit: false,
    date: '15 Aug 2026',
    timestamp: Date.now() - 86400000 * 6,
    paymentMethod: 'RuPay Credit Card',
    notes: 'Detergents, oils & household utilities',
    isFamilyShared: true,
    memberName: 'Sunita (Mother)',
    iconName: 'ShoppingBag',
    riskStatus: 'VERIFIED'
  },
  {
    id: 6,
    title: 'Indian Oil Fuel XP95',
    category: 'Travel',
    amount: 1500.0,
    type: 'EXPENSE',
    isCredit: false,
    date: '18 Aug 2026',
    timestamp: Date.now() - 86400000 * 3,
    paymentMethod: 'UPI',
    notes: '14.8 Litres Premium Petrol',
    isFamilyShared: false,
    memberName: 'Priyanshu',
    iconName: 'Car',
    riskStatus: 'VERIFIED'
  },
  {
    id: 7,
    title: 'Freelance UI/UX Consulting Inflow',
    category: 'Freelance',
    amount: 12500.0,
    type: 'INCOME',
    isCredit: true,
    date: '19 Aug 2026',
    timestamp: Date.now() - 86400000 * 2,
    paymentMethod: 'IMPS',
    notes: 'Design sprint milestone completion',
    isFamilyShared: false,
    memberName: 'Priyanshu',
    iconName: 'Sparkles',
    riskStatus: 'VERIFIED'
  }
];

const INITIAL_BUDGETS: BudgetItem[] = [
  { id: 1, category: 'Food & Dining', monthlyLimit: 8500, spent: 5800, month: 'August 2026', iconName: 'Utensils', alertThreshold80: true, alertThreshold90: true, alertThreshold100: true },
  { id: 2, category: 'Rent & Housing', monthlyLimit: 18000, spent: 18000, month: 'August 2026', iconName: 'Home', alertThreshold80: true, alertThreshold90: true, alertThreshold100: true },
  { id: 3, category: 'Bills & Utilities', monthlyLimit: 4000, spent: 3200, month: 'August 2026', iconName: 'Zap', alertThreshold80: true, alertThreshold90: true, alertThreshold100: true },
  { id: 4, category: 'Shopping & Clothes', monthlyLimit: 4500, spent: 2450, month: 'August 2026', iconName: 'ShoppingBag', alertThreshold80: true, alertThreshold90: true, alertThreshold100: true },
  { id: 5, category: 'Travel & Commute', monthlyLimit: 3000, spent: 2100, month: 'August 2026', iconName: 'Car', alertThreshold80: true, alertThreshold90: true, alertThreshold100: true },
  { id: 6, category: 'Entertainment & OTT', monthlyLimit: 2000, spent: 1600, month: 'August 2026', iconName: 'Tv', alertThreshold80: true, alertThreshold90: true, alertThreshold100: true }
];

const INITIAL_GOALS: GoalItem[] = [
  GoalFeasibilityEngine.normalizeGoal({ id: 1, name: 'Emergency Reserve Fund', emoji: '🛡️', targetAmount: 100000, currentAmount: 72500, targetDate: 'Dec 2026', category: 'Emergency', isFamilyGoal: true }),
  GoalFeasibilityEngine.normalizeGoal({ id: 2, name: 'Japan Family Vacation 2027', emoji: '✈️', targetAmount: 250000, currentAmount: 68000, targetDate: 'May 2027', category: 'Travel', isFamilyGoal: true }),
  GoalFeasibilityEngine.normalizeGoal({ id: 3, name: 'Ananya Education Fund', emoji: '🎓', targetAmount: 500000, currentAmount: 145000, targetDate: 'Aug 2028', category: 'Education', isFamilyGoal: true })
];

const INITIAL_BILLS: BillItem[] = [
  { id: 1, name: 'Torrent Power Electricity', amount: 2340, dueDate: '25 Aug 2026', dueTimestamp: Date.now() + 86400000 * 4, category: 'Electricity', isRecurring: true, isPaid: false, reminderDays: 3, autoPayEnabled: true },
  { id: 2, name: 'Airtel Xstream Fiber Broadband', amount: 1179, dueDate: '22 Aug 2026', dueTimestamp: Date.now() + 86400000 * 1, category: 'Internet', isRecurring: true, isPaid: false, reminderDays: 2, autoPayEnabled: false },
  { id: 3, name: 'Star Health Family Insurance', amount: 4850, dueDate: '02 Sep 2026', dueTimestamp: Date.now() + 86400000 * 12, category: 'Insurance', isRecurring: true, isPaid: false, reminderDays: 5, autoPayEnabled: true },
  { id: 4, name: 'Indane LPG Gas Cylinder', amount: 825, dueDate: '15 Aug 2026', dueTimestamp: Date.now() - 86400000 * 6, category: 'Gas', isRecurring: false, isPaid: true, reminderDays: 1, autoPayEnabled: false }
];

const INITIAL_FAMILY: FamilyMemberItem[] = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    role: 'Father',
    email: 'rajesh.sharma@example.com',
    avatarColor: '#10B981',
    monthlyContribution: 80000,
    spentThisMonth: 32000,
    salaryIncome: 80000,
    freelanceIncome: 0,
    businessIncome: 0,
    rentalIncome: 15000,
    otherIncome: 0,
    foodExpense: 8000,
    transportExpense: 4000,
    shoppingExpense: 3000,
    educationExpense: 10000,
    healthExpense: 3000,
    entertainmentExpense: 4000,
    bankSavings: 150000,
    emergencyFund: 45000,
    fixedDeposit: 300000,
    mutualFund: 250000,
    monthlyEmi: 0,
    equityInvestments: 180000,
    goldInvestments: 200000,
    ppfInvestments: 150000,
    fdInterest: 21000,
    rdInterest: 6000,
    savingsInterest: 4500,
    investmentReturns: 32000
  },
  {
    id: 2,
    name: 'Sunita Sharma',
    role: 'Mother',
    email: 'sunita.sharma@example.com',
    avatarColor: '#06B6D4',
    monthlyContribution: 60000,
    spentThisMonth: 24000,
    salaryIncome: 55000,
    freelanceIncome: 5000,
    businessIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    foodExpense: 10000,
    transportExpense: 2000,
    shoppingExpense: 6000,
    educationExpense: 2000,
    healthExpense: 2000,
    entertainmentExpense: 2000,
    bankSavings: 90000,
    emergencyFund: 27500,
    fixedDeposit: 150000,
    mutualFund: 120000,
    monthlyEmi: 0,
    equityInvestments: 75000,
    goldInvestments: 350000,
    ppfInvestments: 100000,
    fdInterest: 10500,
    rdInterest: 3000,
    savingsInterest: 2700,
    investmentReturns: 14000
  },
  {
    id: 3,
    name: 'Priyanshu Sharma',
    role: 'Son (You)',
    email: 'priyan1436ei@gmail.com',
    avatarColor: '#3B82F6',
    monthlyContribution: 40000,
    spentThisMonth: 16000,
    salaryIncome: 65000,
    freelanceIncome: 12500,
    businessIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    foodExpense: 4500,
    transportExpense: 2500,
    shoppingExpense: 3500,
    educationExpense: 0,
    healthExpense: 1000,
    entertainmentExpense: 4500,
    bankSavings: 84500,
    emergencyFund: 72500,
    fixedDeposit: 100000,
    mutualFund: 185000,
    monthlyEmi: 4200,
    equityInvestments: 220000,
    goldInvestments: 50000,
    ppfInvestments: 60000,
    fdInterest: 7000,
    rdInterest: 0,
    savingsInterest: 2500,
    investmentReturns: 28000
  },
  {
    id: 4,
    name: 'Ananya Sharma',
    role: 'Daughter',
    email: 'ananya.sharma@example.com',
    avatarColor: '#A855F7',
    monthlyContribution: 20000,
    spentThisMonth: 8000,
    salaryIncome: 25000,
    freelanceIncome: 0,
    businessIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    foodExpense: 2500,
    transportExpense: 1500,
    shoppingExpense: 2500,
    educationExpense: 1500,
    healthExpense: 0,
    entertainmentExpense: 0,
    bankSavings: 35000,
    emergencyFund: 10000,
    fixedDeposit: 50000,
    mutualFund: 40000,
    monthlyEmi: 0,
    equityInvestments: 30000,
    goldInvestments: 25000,
    ppfInvestments: 20000,
    fdInterest: 3500,
    rdInterest: 0,
    savingsInterest: 1000,
    investmentReturns: 4500
  }
];

const INITIAL_EMIS: EmiItem[] = [
  {
    id: 1,
    title: 'Royal Enfield Hunter 350 Bike',
    category: 'Vehicle',
    totalAmount: 120000.0,
    paidAmount: 58800.0,
    monthlyEmi: 4200.0,
    interestRate: 9.5,
    totalTenureMonths: 24,
    paidTenureMonths: 14,
    dueDate: '05th of every month',
    dueDayOfMonth: 5,
    lenderBank: 'HDFC Bank Auto Loan',
    isAutoDebit: true,
    isPaidThisMonth: true,
    lastPaymentDate: '05 Aug 2026',
    iconName: 'Bike'
  },
  {
    id: 2,
    title: 'MacBook Pro M3 Max Workstation',
    category: 'Electronics',
    totalAmount: 85000.0,
    paidAmount: 42500.0,
    monthlyEmi: 7083.0,
    interestRate: 0.0,
    totalTenureMonths: 12,
    paidTenureMonths: 6,
    dueDate: '10th of every month',
    dueDayOfMonth: 10,
    lenderBank: 'Bajaj Finserv No-Cost',
    isAutoDebit: true,
    isPaidThisMonth: false,
    lastPaymentDate: '10 Jul 2026',
    iconName: 'Laptop'
  }
];

const INITIAL_RADAR_AXES: FinancialHealthAxis[] = [
  { categoryName: 'Savings', score: 88, maxScore: 100, metricFormatted: '41% of Income', status: 'Optimal', statusColor: '#10B981' },
  { categoryName: 'Debt', score: 85, maxScore: 100, metricFormatted: '11% DTI Ratio', status: 'Optimal', statusColor: '#10B981' },
  { categoryName: 'Spending', score: 76, maxScore: 100, metricFormatted: '₹38,250 Discretionary', status: 'Strong', statusColor: '#06B6D4' },
  { categoryName: 'Investments', score: 82, maxScore: 100, metricFormatted: '₹4.8L Active SIPs', status: 'Optimal', statusColor: '#10B981' },
  { categoryName: 'Budget', score: 80, maxScore: 100, metricFormatted: '92% Adherence', status: 'Strong', statusColor: '#06B6D4' },
  { categoryName: 'Emergency', score: 79, maxScore: 100, metricFormatted: '1.9 Months Buffer', status: 'Strong', statusColor: '#06B6D4' }
];

const INITIAL_NOTIFICATIONS: NotificationAlertItem[] = [
  {
    id: 'notif_bill_due',
    title: 'Bill Due Tomorrow',
    message: 'Airtel Xstream Fiber Broadband (₹1,179) is due tomorrow. Auto-pay scheduled.',
    type: 'BILL_DUE_TOMORROW',
    timeAgo: '10 mins ago',
    isUnread: true,
    actionRoute: 'family',
    amountFormatted: '₹1,179'
  },
  {
    id: 'notif_budget_crossed',
    title: 'Budget Crossed Warning',
    message: 'Food & Dining budget reached 68.2%. AI predicts overflow by ₹1,900 by Day 28.',
    type: 'BUDGET_CROSSED',
    timeAgo: '1 hour ago',
    isUnread: true,
    actionRoute: 'trends',
    amountFormatted: '₹1,900'
  },
  {
    id: 'notif_score_increased',
    title: 'Financial Health Score Increased',
    message: 'Your score improved by +6 points to 82/100 (Tier: Excellent) thanks to early debt reduction.',
    type: 'SCORE_INCREASED',
    timeAgo: '3 hours ago',
    isUnread: false,
    actionRoute: 'analytics',
    amountFormatted: '+6 pts'
  },
  {
    id: 'notif_goal_reached',
    title: 'Savings Goal Milestone Reached',
    message: 'Emergency Reserve Fund reached 72.5% milestone! ₹72,500 deposited.',
    type: 'SAVINGS_GOAL_REACHED',
    timeAgo: 'Yesterday',
    isUnread: false,
    actionRoute: 'goals',
    amountFormatted: '₹72,500'
  },
  {
    id: 'notif_payment_success',
    title: 'Payment Successful',
    message: '₹199.00 paid for FinFam Pro Monthly Subscription via Razorpay UPI. Verified.',
    type: 'PAYMENT_SUCCESS',
    timeAgo: '2 days ago',
    isUnread: false,
    actionRoute: 'payment',
    amountFormatted: '₹199'
  }
];

const INITIAL_PEER_NODES: LivePeerNode[] = [
  {
    id: 'peer_priya',
    name: 'Priya Sharma',
    relationship: 'Spouse',
    vpa: 'priya.sharma@okaxis',
    ipAddress: '192.168.1.44:8443',
    pingMs: 11,
    isOnline: true,
    avatarColorHex: '#7C3AED',
    lastSyncText: 'Live (2s ago)'
  },
  {
    id: 'peer_aarav',
    name: 'Aarav Sharma',
    relationship: 'Son',
    vpa: 'aarav.junior@okicici',
    ipAddress: '192.168.1.48:8443',
    pingMs: 16,
    isOnline: true,
    avatarColorHex: '#00E5FF',
    lastSyncText: 'Live (12s ago)'
  },
  {
    id: 'peer_sunita',
    name: 'Sunita Sharma',
    relationship: 'Mother',
    vpa: 'sunita.sharma@oksbi',
    ipAddress: '192.168.1.52:8443',
    pingMs: 22,
    isOnline: true,
    avatarColorHex: '#10B981',
    lastSyncText: 'Online'
  },
  {
    id: 'peer_vault',
    name: 'Encrypted Family Backup Beam',
    relationship: 'Vault Cloud',
    vpa: 'sync://vault.finfam.cloud',
    ipAddress: '10.0.4.18:443',
    pingMs: 8,
    isOnline: true,
    avatarColorHex: '#3B82F6',
    lastSyncText: 'Synchronized'
  }
];

const INITIAL_TRANSFER_HISTORY: RealTimeTransferRecord[] = [
  {
    id: 'TXN-8F92BA01',
    utrNumber: 'UTR429184029103',
    senderName: 'Priyanshu Sharma (Vault)',
    senderVpaOrAcc: 'priyan1436ei@okhdfcbank',
    receiverName: 'Priya Sharma (Spouse)',
    receiverVpaOrAcc: 'priya.sharma@okaxis',
    amount: 15000.0,
    transferType: 'FAMILY_ALLOWANCE',
    status: 'SETTLED',
    protocol: 'WSS://finfam.sync.p2p • AES-256',
    latencyMs: 12,
    note: 'Monthly Household & Groceries Vault Pool',
    timestampFormatted: '10 mins ago'
  },
  {
    id: 'TXN-7E14C920',
    utrNumber: 'UTR429183928174',
    senderName: 'Priyanshu Sharma',
    senderVpaOrAcc: 'priyan1436ei@okhdfcbank',
    receiverName: 'Family Cloud Vault',
    receiverVpaOrAcc: 'sync://vault.finfam.cloud',
    payloadSizeKb: 248.6,
    transferType: 'DATA_SYNC_BEAM',
    status: 'SETTLED',
    protocol: 'WSS://finfam.sync.p2p • AES-256',
    latencyMs: 9,
    note: 'Automated Budget & EMI Ledger Sync',
    timestampFormatted: '42 mins ago'
  },
  {
    id: 'TXN-5C38190F',
    utrNumber: 'UTR429181029482',
    senderName: 'Priyanshu Sharma',
    senderVpaOrAcc: 'priyan1436ei@okhdfcbank',
    receiverName: 'Aarav Sharma (Son)',
    receiverVpaOrAcc: 'aarav.junior@okicici',
    amount: 2500.0,
    transferType: 'FUNDS_TRANSFER',
    status: 'SETTLED',
    protocol: 'NPCI-IMPS-LIVE • AES-256',
    latencyMs: 15,
    note: 'Weekly School & Coding Camp Allowance',
    timestampFormatted: 'Yesterday, 04:30 PM'
  }
];

export const SUBSCRIPTION_PLANS: SubscriptionPlanTier[] = [
  {
    id: 'premium_monthly',
    title: 'FinFam Pro Monthly',
    amountInr: 199.0,
    amountPaise: 19900,
    durationDays: 30,
    badge: 'FLEXIBLE',
    features: [
      'Unlimited Family Members & Vault Sync',
      'Interactive Smart EMI & Amortization Engine',
      'Real-Time P2P Funds Beam (Sub-second)',
      'OCR Digital Receipt Scanning & Categorization',
      'AI Advisor with Custom Household Insights'
    ]
  },
  {
    id: 'premium_annual',
    title: 'FinFam Pro Annual',
    amountInr: 1499.0,
    amountPaise: 149900,
    durationDays: 365,
    badge: 'POPULAR • SAVE 37%',
    recommended: true,
    features: [
      'Everything in Monthly Plan',
      'Advanced 24-Month Trend Modeling & Forecasts',
      'UPI Anti-Scam Intent Shield (256-bit)',
      'Multi-device Real-Time Ledger Mesh',
      'Priority Financial Coach Advisory'
    ]
  },
  {
    id: 'premium_lifetime',
    title: 'Lifetime Founder Shield',
    amountInr: 3999.0,
    amountPaise: 399900,
    durationDays: 36500,
    badge: 'ONE-TIME • LIFETIME ACCESS',
    features: [
      'Permanent Lifetime Access for Whole Household',
      'Unlimited Automated Bill Payment Integrations',
      'VIP Dedicated Cloud Vault Backup',
      'Founder Badge & Early Beta Access',
      'Zero Gateway or Maintenance Fees Ever'
    ]
  }
];

interface FinFamContextType {
  userProfile: UserProfile;
  transactions: TransactionItem[];
  budgets: BudgetItem[];
  goals: GoalItem[];
  bills: BillItem[];
  familyMembers: FamilyMemberItem[];
  emis: EmiItem[];
  financialHealth: FinancialHealth;
  monthlySpendingTrends: MonthlySpendingTrendsState;
  spendingTrendHorizon: TimeHorizonType;
  setSpendingTrendHorizon: (h: TimeHorizonType) => void;
  spendingTrendCategory: string;
  setSpendingTrendCategory: (cat: string) => void;
  spendingTrendMultiCategories: string[];
  toggleSpendingTrendMultiCategory: (cat: string) => void;
  spendingTrendMultiLineMode: boolean;
  setSpendingTrendMultiLineMode: (enabled: boolean) => void;
  spendingTrendSelectedMonthIndex: number;
  setSpendingTrendSelectedMonth: (idx: number) => void;
  radarHealthAxes: FinancialHealthAxis[];
  isSimulatingRadarUpdates: boolean;
  togglePeriodicRadarSimulation: () => void;
  simulateRadarDataStep: () => void;
  resetRadarBaseline: () => void;
  dailySpendingPoints: DailySpendDataPoint[];
  weeklySpendingBars: WeeklySpendBar[];
  familyContributions: FamilyContributionShare[];
  expensePrediction: ExpensePrediction;
  notifications: NotificationAlertItem[];
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotificationAlert: (title: string, message: string, type: any, amountFormatted?: string) => void;
  chatMessages: ChatMessage[];
  isCoachTyping: boolean;
  askAiCoach: (prompt: string) => Promise<void>;
  scannedReceiptResult: ReceiptScanResult | null;
  isScanningReceipt: boolean;
  scanReceiptSimulator: (type?: string) => void;
  confirmScannedReceiptAsExpense: () => void;
  dismissScannedReceipt: () => void;
  liveP2pNodes: LivePeerNode[];
  realTimeTransferHistory: RealTimeTransferRecord[];
  isLiveTransferStreaming: boolean;
  executeRealTimeFundsTransfer: (
    receiverName: string,
    receiverVpa: string,
    amount: number,
    transferType: RealTimeTransferType,
    note: string
  ) => Promise<RealTimeTransferRecord>;
  paymentHistory: RazorpayTransactionRecord[];
  activePlanTier: string;
  isSubscriptionActive: boolean;
  processSubscriptionPayment: (planId: string, paymentMethod: string) => Promise<{ success: boolean; message: string }>;
  refundPayment: (paymentId: string) => Promise<{ success: boolean; message: string }>;
  addExpense: (title: string, category: string, amount: number, paymentMethod: string, notes?: string, isFamilyShared?: boolean, memberName?: string) => void;
  addIncome: (title: string, category: string, amount: number, paymentMethod: string, notes?: string, memberName?: string) => void;
  deleteTransaction: (id: number) => void;
  addBudget: (category: string, limit: number) => void;
  deleteBudget: (id: number) => void;
  addGoal: (name: string, emoji: string, targetAmount: number, targetDate: string, category: string, isFamilyGoal: boolean, options?: Partial<GoalItem>) => void;
  depositGoal: (id: number, amount: number) => void;
  withdrawGoal: (id: number, amount: number) => void;
  deleteGoal: (id: number) => void;
  updateGoal: (goal: GoalItem) => void;
  setGoals: React.Dispatch<React.SetStateAction<GoalItem[]>>;
  householdProfile: HouseholdFinancialProfile;
  setHouseholdProfile: React.Dispatch<React.SetStateAction<HouseholdFinancialProfile>>;
  goalFeasibilities: Record<number, GoalFeasibilityResult>;
  sharedTimeline: SharedTimelineResult;
  goalConflicts: GoalConflictItem[];
  interferenceMatrix: InterferenceMatrixResult;
  resolutionResult: ResolutionComparisonResult;
  isDemoMode: boolean;
  loadJudgeDemoScenario: () => void;
  resetJudgeDemoScenario: () => void;
  applyResolutionScenario: (scenario: ResolutionScenario) => void;
  revertLastAppliedPlan: () => void;
  previousGoalsSnapshot: GoalItem[] | null;
  setPreviousGoalsSnapshot: React.Dispatch<React.SetStateAction<GoalItem[] | null>>;
  addBill: (name: string, amount: number, dueDate: string, category: string, isRecurring: boolean, autoPay: boolean) => void;
  payBill: (billId: number, billName: string, amount: number, method?: string) => void;
  deleteBill: (id: number) => void;
  toggleAutoPay: (id: number) => void;
  addFamilyMember: (data: Partial<FamilyMemberItem>) => void;
  updateFamilyMember: (member: FamilyMemberItem) => void;
  deleteFamilyMember: (id: number) => void;
  addEmi: (title: string, category: string, totalAmount: number, monthlyEmi: number, interestRate: number, tenureMonths: number, lenderBank: string, dueDate?: string) => void;
  payEmi: (emiId: number, emiTitle: string, amount: number, method?: string) => void;
  deleteEmi: (id: number) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  resetAllData: () => void;
  decisionHistory: DecisionHistoryRecord[];
  saveDecisionRecord: (record: Omit<DecisionHistoryRecord, 'id' | 'timestamp'>) => void;
  deleteDecisionRecord: (id: string) => void;
  updateDecisionStatus: (id: string, status: 'IMPLEMENTED' | 'DISMISSED' | 'PENDING') => void;
  isPaymentGatewayOpen: boolean;
  activeGatewayOrder: PaymentGatewayOrderData | null;
  openPaymentGateway: (order: PaymentGatewayOrderData) => void;
  closePaymentGateway: () => void;
  handleGatewayPaymentSuccess: (txn: RazorpayTransactionRecord) => void;
}

const FinFamContext = createContext<FinFamContextType | null>(null);

export const FinFamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from LocalStorage or defaults
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryRecord[]>(() => {
    const saved = localStorage.getItem('finfam_decision_history');
    return saved ? JSON.parse(saved) : INITIAL_DECISION_HISTORY;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('finfam_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const saved = localStorage.getItem('finfam_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem('finfam_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [goals, setGoals] = useState<GoalItem[]>(() => {
    const saved = localStorage.getItem('finfam_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((g) => GoalFeasibilityEngine.normalizeGoal(g));
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_GOALS.map((g) => GoalFeasibilityEngine.normalizeGoal(g));
  });

  const [bills, setBills] = useState<BillItem[]>(() => {
    const saved = localStorage.getItem('finfam_bills');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>(() => {
    const saved = localStorage.getItem('finfam_family');
    return saved ? JSON.parse(saved) : INITIAL_FAMILY;
  });

  const [emis, setEmis] = useState<EmiItem[]>(() => {
    const saved = localStorage.getItem('finfam_emis');
    return saved ? JSON.parse(saved) : INITIAL_EMIS;
  });

  const [radarHealthAxes, setRadarHealthAxes] = useState<FinancialHealthAxis[]>(INITIAL_RADAR_AXES);
  const [isSimulatingRadarUpdates, setIsSimulatingRadarUpdates] = useState(false);

  const [notifications, setNotifications] = useState<NotificationAlertItem[]>(() => {
    const saved = localStorage.getItem('finfam_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [liveP2pNodes, setLiveP2pNodes] = useState<LivePeerNode[]>(INITIAL_PEER_NODES);
  const [realTimeTransferHistory, setRealTimeTransferHistory] = useState<RealTimeTransferRecord[]>(() => {
    const saved = localStorage.getItem('finfam_transfers');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFER_HISTORY;
  });

  const [isLiveTransferStreaming, setIsLiveTransferStreaming] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState<RazorpayTransactionRecord[]>(() => {
    const saved = localStorage.getItem('finfam_payments');
    return saved ? JSON.parse(saved) : [
      {
        id: 'pay_finfam_init01',
        orderId: 'order_N82ba91x',
        paymentId: 'pay_N82ba91x_live',
        userId: 'user_priyanshu_sharma',
        planId: 'premium_monthly',
        planTitle: 'FinFam Pro Monthly',
        amount: 199.0,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: 'UPI (PhonePe)',
        date: '19 Aug 2026',
        timestamp: Date.now() - 86400000 * 2,
        validUntil: '18 Sep 2026'
      }
    ];
  });

  // Save to LocalStorage
  useEffect(() => { localStorage.setItem('finfam_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('finfam_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('finfam_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('finfam_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('finfam_bills', JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem('finfam_family', JSON.stringify(familyMembers)); }, [familyMembers]);
  useEffect(() => { localStorage.setItem('finfam_emis', JSON.stringify(emis)); }, [emis]);
  useEffect(() => { localStorage.setItem('finfam_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('finfam_transfers', JSON.stringify(realTimeTransferHistory)); }, [realTimeTransferHistory]);
  useEffect(() => { localStorage.setItem('finfam_payments', JSON.stringify(paymentHistory)); }, [paymentHistory]);
  useEffect(() => { localStorage.setItem('finfam_decision_history', JSON.stringify(decisionHistory)); }, [decisionHistory]);

  // Multi-Goal Planning Engine State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('finfam_is_demo') === 'true';
  });
  const [previousGoalsSnapshot, setPreviousGoalsSnapshot] = useState<GoalItem[] | null>(null);

  const [householdProfile, setHouseholdProfile] = useState<HouseholdFinancialProfile>(() => {
    const activeEmiTotal = INITIAL_EMIS.reduce((sum, e) => sum + e.monthlyEmi, 0);
    const recurringBillsTotal = INITIAL_BILLS.filter((b) => b.isRecurring).reduce((sum, b) => sum + b.amount, 0);
    return {
      monthlyNetIncome: INITIAL_PROFILE.monthlyIncome,
      essentialMonthlyExpenses: Math.round(INITIAL_PROFILE.monthlyExpenses * 0.65),
      discretionaryMonthlyExpenses: Math.round(INITIAL_PROFILE.monthlyExpenses * 0.35),
      existingCashBalance: INITIAL_PROFILE.totalBalance,
      protectedEmergencyReserve: INITIAL_PROFILE.emergencyFund,
      unassignedSavings: Math.max(INITIAL_PROFILE.totalBalance - INITIAL_PROFILE.emergencyFund, 0),
      activeEmiMonthlyTotal: activeEmiTotal,
      recurringBillsTotal: recurringBillsTotal
    };
  });

  // Keep householdProfile in sync with userProfile, emis, and bills when not manually overridden
  useEffect(() => {
    if (!isDemoMode) {
      const activeEmiTotal = emis.reduce((sum, e) => sum + e.monthlyEmi, 0);
      const recurringBillsTotal = bills.filter((b) => b.isRecurring).reduce((sum, b) => sum + b.amount, 0);
      setHouseholdProfile((prev) => ({
        ...prev,
        monthlyNetIncome: userProfile.monthlyIncome,
        essentialMonthlyExpenses: Math.round(userProfile.monthlyExpenses * 0.65),
        discretionaryMonthlyExpenses: Math.round(userProfile.monthlyExpenses * 0.35),
        existingCashBalance: userProfile.totalBalance,
        protectedEmergencyReserve: userProfile.emergencyFund,
        unassignedSavings: Math.max(userProfile.totalBalance - userProfile.emergencyFund, 0),
        activeEmiMonthlyTotal: activeEmiTotal,
        recurringBillsTotal: recurringBillsTotal
      }));
    }
  }, [userProfile.monthlyIncome, userProfile.monthlyExpenses, userProfile.totalBalance, userProfile.emergencyFund, emis, bills, isDemoMode]);

  // Derived Goal Planning Calculations
  const goalFeasibilities: Record<number, GoalFeasibilityResult> = useMemo(() => {
    const map: Record<number, GoalFeasibilityResult> = {};
    goals.forEach((g) => {
      map[g.id] = GoalFeasibilityEngine.calculateGoalFeasibility(g);
    });
    return map;
  }, [goals]);

  const sharedTimeline: SharedTimelineResult = useMemo(() => {
    return SharedCashflowTimelineEngine.simulateTimeline(goals, householdProfile, {
      priorityAwareAllocation: true,
      activeEmis: emis.map((e) => ({
        id: e.id,
        monthlyEmi: e.monthlyEmi,
        remainingMonths: Math.max(e.totalTenureMonths - e.paidTenureMonths, 1)
      }))
    });
  }, [goals, householdProfile, emis]);

  const goalConflicts: GoalConflictItem[] = useMemo(() => {
    return GoalConflictEngine.detectConflicts(goals, householdProfile);
  }, [goals, householdProfile]);

  const interferenceMatrix: InterferenceMatrixResult = useMemo(() => {
    return GoalInterferenceEngine.analyzeInterference(goals, householdProfile);
  }, [goals, householdProfile]);

  const resolutionResult: ResolutionComparisonResult = useMemo(() => {
    return RippleResolutionEngine.generateResolutions(goals, householdProfile);
  }, [goals, householdProfile]);

  const loadJudgeDemoScenario = () => {
    setPreviousGoalsSnapshot(goals);
    setGoals(DEMO_GOALS.map((g) => GoalFeasibilityEngine.normalizeGoal(g)));
    setHouseholdProfile(DEMO_PROFILE);
    setIsDemoMode(true);
    localStorage.setItem('finfam_is_demo', 'true');
  };

  const resetJudgeDemoScenario = () => {
    if (previousGoalsSnapshot) {
      setGoals(previousGoalsSnapshot);
      setPreviousGoalsSnapshot(null);
    } else {
      setGoals(INITIAL_GOALS.map((g) => GoalFeasibilityEngine.normalizeGoal(g)));
    }
    setIsDemoMode(false);
    localStorage.removeItem('finfam_is_demo');
  };

  const applyResolutionScenario = (scenario: ResolutionScenario) => {
    setPreviousGoalsSnapshot(goals);
    setGoals(scenario.adjustedGoals);
    if (scenario.householdProfileChanges) {
      setHouseholdProfile((prev) => ({ ...prev, ...scenario.householdProfileChanges }));
    }
  };

  const revertLastAppliedPlan = () => {
    if (previousGoalsSnapshot) {
      setGoals(previousGoalsSnapshot);
      setPreviousGoalsSnapshot(null);
    }
  };

  const updateGoal = (updatedGoal: GoalItem) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  const saveDecisionRecord = (record: Omit<DecisionHistoryRecord, 'id' | 'timestamp'>) => {
    const newRecord: DecisionHistoryRecord = {
      ...record,
      id: `dec_${Date.now()}`,
      timestamp: Date.now()
    };
    setDecisionHistory((prev) => [newRecord, ...prev]);
  };

  const deleteDecisionRecord = (id: string) => {
    setDecisionHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const updateDecisionStatus = (id: string, status: 'IMPLEMENTED' | 'DISMISSED' | 'PENDING') => {
    setDecisionHistory((prev) =>
      prev.map((r) => (r.id === id ? { ...r, implementationStatus: status } : r))
    );
  };

  // Spending Trends Query State
  const [spendingTrendHorizon, setSpendingTrendHorizon] = useState<TimeHorizonType>('LAST_6_MONTHS');
  const [spendingTrendCategory, setSpendingTrendCategory] = useState('ALL');
  const [spendingTrendMultiCategories, setSpendingTrendMultiCategories] = useState<string[]>(['Food', 'Rent', 'Bills']);
  const [spendingTrendMultiLineMode, setSpendingTrendMultiLineMode] = useState(false);
  const [spendingTrendSelectedMonthIndex, setSpendingTrendSelectedMonth] = useState(-1);

  const toggleSpendingTrendMultiCategory = (cat: string) => {
    if (spendingTrendMultiCategories.includes(cat)) {
      if (spendingTrendMultiCategories.length > 1) {
        setSpendingTrendMultiCategories(spendingTrendMultiCategories.filter((c) => c !== cat));
      }
    } else {
      setSpendingTrendMultiCategories([...spendingTrendMultiCategories, cat]);
    }
  };

  // Computed Financial Health
  const financialHealth = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.isCredit).reduce((acc, t) => acc + t.amount, 0) || userProfile.monthlyIncome;
    const totalExpenses = transactions.filter((t) => !t.isCredit).reduce((acc, t) => acc + t.amount, 0) || userProfile.monthlyExpenses;
    const totalSavings = Math.max(totalIncome - totalExpenses, 0);
    const goalsRatio = goals.length > 0 ? goals.reduce((acc, g) => acc + g.currentAmount, 0) / Math.max(goals.reduce((acc, g) => acc + g.targetAmount, 0), 1) : 0.72;
    const unpaidBills = bills.filter((b) => !b.isPaid).length;
    const overspentBudgets = budgets.filter((b) => b.spent > b.monthlyLimit).length;

    return FinancialEngine.calculateHealth(
      totalIncome,
      totalExpenses,
      totalSavings,
      userProfile.emergencyFund,
      5000,
      unpaidBills,
      overspentBudgets,
      goalsRatio
    );
  }, [transactions, userProfile, goals, bills, budgets]);

  // Computed Monthly Spending Trends
  const monthlySpendingTrends = useMemo(() => {
    return SpendingTrendsEngine.computeTrends(
      transactions,
      budgets,
      spendingTrendHorizon,
      spendingTrendCategory,
      spendingTrendMultiCategories,
      spendingTrendMultiLineMode,
      spendingTrendSelectedMonthIndex
    );
  }, [
    transactions,
    budgets,
    spendingTrendHorizon,
    spendingTrendCategory,
    spendingTrendMultiCategories,
    spendingTrendMultiLineMode,
    spendingTrendSelectedMonthIndex
  ]);

  // Radar Dynamic Simulation
  const simulateRadarDataStep = () => {
    setRadarHealthAxes((prev) =>
      prev.map((axis) => {
        const delta = Math.floor(Math.random() * 13) - 6;
        const newScore = Math.min(Math.max(axis.score + delta, 45), 98);
        let status = 'Attention Needed';
        let statusColor = '#EF4444';
        if (newScore >= 85) {
          status = 'Optimal';
          statusColor = '#10B981';
        } else if (newScore >= 75) {
          status = 'Strong';
          statusColor = '#06B6D4';
        } else if (newScore >= 65) {
          status = 'Moderate';
          statusColor = '#F59E0B';
        }

        let updatedMetric = axis.metricFormatted;
        if (axis.categoryName === 'Savings') updatedMetric = `${Math.round(newScore * 0.38)}% of Income`;
        if (axis.categoryName === 'Debt') updatedMetric = `${Math.max(Math.round(40 - newScore * 0.25), 8)}% DTI Ratio`;
        if (axis.categoryName === 'Spending') updatedMetric = `₹${Math.round(65000 - newScore * 380)} Discretionary`;
        if (axis.categoryName === 'Investments') updatedMetric = `₹${(newScore * 0.022).toFixed(2)}L Active SIPs`;
        if (axis.categoryName === 'Budget') updatedMetric = `${Math.round(newScore)}% Adherence`;
        if (axis.categoryName === 'Emergency') updatedMetric = `${(newScore * 0.075).toFixed(1)} Months Buffer`;

        return {
          ...axis,
          score: newScore,
          status,
          statusColor,
          metricFormatted: updatedMetric
        };
      })
    );
  };

  const togglePeriodicRadarSimulation = () => {
    setIsSimulatingRadarUpdates((prev) => !prev);
  };

  useEffect(() => {
    if (!isSimulatingRadarUpdates) return;
    const timer = setInterval(() => {
      simulateRadarDataStep();
    }, 3000);
    return () => clearInterval(timer);
  }, [isSimulatingRadarUpdates]);

  const resetRadarBaseline = () => {
    setRadarHealthAxes(INITIAL_RADAR_AXES);
  };

  // Daily & Weekly Analytics
  const dailySpendingPoints: DailySpendDataPoint[] = useMemo(() => {
    const points: DailySpendDataPoint[] = [];
    for (let day = 1; day <= 21; day++) {
      const amt = 800 + ((day * 137) % 1400) + (day % 7 === 0 ? 1800 : 0);
      points.push({ day, dateLabel: `${day} Aug`, amount: amt, isProjected: false });
    }
    const avg = points.reduce((acc, p) => acc + p.amount, 0) / points.length;
    for (let day = 22; day <= 31; day++) {
      const amt = avg * (0.95 + (day % 3) * 0.08);
      points.push({ day, dateLabel: `${day} Aug`, amount: amt, isProjected: true });
    }
    return points;
  }, []);

  const weeklySpendingBars: WeeklySpendBar[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const base = [3200, 4100, 2800, 5600, 7400, 9200, 5950];
    return days.map((day, idx) => ({
      dayName: day,
      amount: base[idx],
      isPeakDay: idx === 5
    }));
  }, []);

  const familyContributions: FamilyContributionShare[] = useMemo(() => {
    const total = familyMembers.reduce((acc, m) => acc + m.monthlyContribution, 0) || 1;
    return familyMembers.map((m) => ({
      memberName: `${m.name} (${m.role})`,
      role: m.role,
      contributionAmount: m.monthlyContribution,
      spentAmount: m.spentThisMonth,
      percentageShare: (m.monthlyContribution / total) * 100,
      avatarColorHex: m.avatarColor
    }));
  }, [familyMembers]);

  const expensePrediction: ExpensePrediction = useMemo(() => {
    const totalSpent = transactions.filter((t) => !t.isCredit).reduce((acc, t) => acc + t.amount, 0) || userProfile.monthlyExpenses;
    const currentDay = 21;
    const daysInMonth = 31;
    const projected = (totalSpent / currentDay) * daysInMonth;
    const projectedSavings = Math.max(userProfile.monthlyIncome - projected, 0);

    return {
      projectedEndOfMonthSpend: projected,
      projectedFutureSavings: projectedSavings,
      monthlyBudgetLimit: 38250,
      isBudgetExceeded: projected > 38250,
      overflowCategory: 'Food & Dining',
      overflowAmount: 1900,
      predictedDaysRemaining: 10,
      aiInsights: [
        'At your current velocity, you will exceed your food & dining budget by ~₹1,900.',
        'Household utility bills are tracking 12% below projected ceiling.',
        'Shifting weekend dining out by 15% recovers ₹2,800 in projected monthly surplus.'
      ],
      recommendation: 'Reallocate ₹2,000 from Shopping surplus to maintain a 100% green budget status.'
    };
  }, [transactions, userProfile]);

  // Notifications
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUserProfile((prev) => ({ ...prev, unreadNotificationsCount: Math.max(prev.unreadNotificationsCount - 1, 0) }));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setUserProfile((prev) => ({ ...prev, unreadNotificationsCount: 0 }));
  };

  const addNotificationAlert = (title: string, message: string, type: any, amountFormatted?: string) => {
    const newItem: NotificationAlertItem = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      timeAgo: 'Just now',
      isUnread: true,
      amountFormatted
    };
    setNotifications((prev) => [newItem, ...prev]);
    setUserProfile((prev) => ({ ...prev, unreadNotificationsCount: prev.unreadNotificationsCount + 1 }));
  };

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_finfam',
      text: '👋 Hello Priyanshu! I am FinFam AI, your dedicated Family Financial Coach. I can analyze your household spending, suggest budget optimizations, calculate savings runway, and help you reach your Japan Vacation goal faster. How can I help you today?',
      isUser: false,
      timestamp: Date.now()
    }
  ]);
  const [isCoachTyping, setIsCoachTyping] = useState(false);

  const askAiCoach = async (prompt: string) => {
    if (!prompt.trim()) return;
    const userMsg: ChatMessage = { id: `msg_${Date.now()}`, text: prompt, isUser: true, timestamp: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsCoachTyping(true);

    try {
      const response = await GeminiAiEngine.askFinancialAdvisor(prompt, userProfile);
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { id: `ai_${Date.now()}`, text: response, isUser: false, timestamp: Date.now() }
        ]);
        setIsCoachTyping(false);
      }, 600);
    } catch {
      setIsCoachTyping(false);
    }
  };

  // OCR Receipt Scanner Simulator
  const [scannedReceiptResult, setScannedReceiptResult] = useState<ReceiptScanResult | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);

  const scanReceiptSimulator = (imageType: string = 'GROCERY') => {
    setIsScanningReceipt(true);
    setTimeout(() => {
      let result: ReceiptScanResult;
      if (imageType === 'RESTAURANT') {
        result = {
          merchantName: 'Barbeque Nation Buffet',
          amount: 2360.0,
          date: 'Today',
          category: 'Food',
          detectedItems: ['2x Grand Dinner Buffet (₹1998)', 'Mocktails (₹250)', 'GST 5% (₹112)'],
          taxGst: 112.0,
          paymentMode: 'Credit Card',
          rawText: 'BARBEQUE NATION HOSPITALITY LTD\nTAX INVOICE #BN-8842\nTOTAL: INR 2360.00'
        };
      } else if (imageType === 'FUEL') {
        result = {
          merchantName: 'Indian Oil Petrol Pump',
          amount: 1500.0,
          date: 'Today',
          category: 'Travel',
          detectedItems: ['XP95 Petrol 14.8L (₹1500.00)'],
          taxGst: 0.0,
          paymentMode: 'UPI',
          rawText: 'INDIAN OIL CORP LTD\nPOS RECEIPT #IOC-9912\nTOTAL: INR 1500.00'
        };
      } else {
        result = {
          merchantName: "Nature's Basket Organic Supermarket",
          amount: 1845.0,
          date: 'Today',
          category: 'Food',
          detectedItems: [
            'Organic Sourdough Bread (₹180)',
            'Almond Milk 1L (₹290)',
            'Fresh Avocado 500g (₹350)',
            'Imported Pasta & Olive Oil (₹1025)'
          ],
          taxGst: 85.0,
          paymentMode: 'UPI',
          rawText: 'NATURES BASKET RETAIL\nINVOICE #NB-4421\nNET PAYABLE: INR 1845.00'
        };
      }
      setScannedReceiptResult(result);
      setIsScanningReceipt(false);
    }, 1200);
  };

  const confirmScannedReceiptAsExpense = () => {
    if (!scannedReceiptResult) return;
    addExpense(
      scannedReceiptResult.merchantName,
      scannedReceiptResult.category,
      scannedReceiptResult.amount,
      scannedReceiptResult.paymentMode,
      `Scanned Receipt OCR (${scannedReceiptResult.detectedItems.join(', ')})`,
      true,
      'Priyanshu'
    );
    setScannedReceiptResult(null);
  };

  const dismissScannedReceipt = () => setScannedReceiptResult(null);

  // Real-Time P2P Funds Transfer Beam
  const executeRealTimeFundsTransfer = async (
    receiverName: string,
    receiverVpa: string,
    amount: number,
    transferType: RealTimeTransferType,
    note: string
  ): Promise<RealTimeTransferRecord> => {
    setIsLiveTransferStreaming(true);

    await new Promise((resolve) => setTimeout(resolve, 850));

    const newRecord: RealTimeTransferRecord = {
      id: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      utrNumber: `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      senderName: userProfile.name,
      senderVpaOrAcc: 'priyan1436ei@okhdfcbank',
      receiverName,
      receiverVpaOrAcc: receiverVpa,
      amount,
      transferType,
      status: 'SETTLED',
      protocol: 'WSS://finfam.sync.p2p • AES-256',
      latencyMs: Math.floor(8 + Math.random() * 12),
      note: note || `Real-time transfer to ${receiverName}`,
      timestampFormatted: 'Just now'
    };

    setRealTimeTransferHistory((prev) => [newRecord, ...prev]);

    // Add transaction to ledger & deduct balance
    addExpense(
      note || `Transfer to ${receiverName}`,
      transferType === 'FAMILY_ALLOWANCE' ? 'Family' : 'Transfer',
      amount,
      'Real-Time UPI Transfer',
      `P2P Real-time Beam to ${receiverVpa} (Ref: ${newRecord.utrNumber})`,
      true,
      'Priyanshu'
    );

    setIsLiveTransferStreaming(false);
    return newRecord;
  };

  // Razorpay Payments & Subscriptions
  const isSubscriptionActive = userProfile.isPremium;
  const activePlanTier = userProfile.premiumTier;

  const processSubscriptionPayment = async (planId: string, paymentMethod: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
    const orderId = `order_${Math.random().toString(36).substring(2, 12)}`;

    const endDate = new Date(Date.now() + plan.durationDays * 86400000);
    const validUntil = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newPaymentRecord: RazorpayTransactionRecord = {
      id: paymentId,
      orderId,
      paymentId,
      userId: userProfile.email,
      planId: plan.id,
      planTitle: plan.title,
      amount: plan.amountInr,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      validUntil
    };

    setPaymentHistory((prev) => [newPaymentRecord, ...prev]);

    setUserProfile((prev) => ({
      ...prev,
      isPremium: true,
      premiumTier: plan.id.toUpperCase() as any,
      premiumValidUntil: validUntil
    }));

    addExpense(
      `${plan.title} Subscription`,
      'Subscriptions',
      plan.amountInr,
      paymentMethod,
      `Razorpay Gateway Payment ID: ${paymentId}`,
      false,
      'Priyanshu'
    );

    addNotificationAlert(
      'Payment Successful',
      `₹${plan.amountInr} paid for ${plan.title}. FinFam Premium active until ${validUntil}.`,
      'PAYMENT_SUCCESS',
      `₹${plan.amountInr}`
    );

    return { success: true, message: `Activated ${plan.title} successfully!` };
  };

  const refundPayment = async (paymentId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPaymentHistory((prev) =>
      prev.map((rec) => {
        if (rec.paymentId === paymentId) {
          return {
            ...rec,
            status: 'REFUNDED',
            refundStatus: 'REFUNDED',
            refundId: `rfnd_${Math.random().toString(36).substring(2, 10)}`
          };
        }
        return rec;
      })
    );
    return { success: true, message: 'Refund initiated successfully. Will reflect in 2-3 banking days.' };
  };

  // Dedicated Payment Gateway Modal State
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [activeGatewayOrder, setActiveGatewayOrder] = useState<PaymentGatewayOrderData | null>(null);

  const openPaymentGateway = (order: PaymentGatewayOrderData) => {
    setActiveGatewayOrder(order);
    setIsPaymentGatewayOpen(true);
  };

  const closePaymentGateway = () => {
    setIsPaymentGatewayOpen(false);
    setActiveGatewayOrder(null);
  };

  const handleGatewayPaymentSuccess = (txn: RazorpayTransactionRecord) => {
    setPaymentHistory((prev) => [txn, ...prev]);

    if (!activeGatewayOrder) return;

    if (activeGatewayOrder.category === 'SUBSCRIPTION' || activeGatewayOrder.planId) {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === activeGatewayOrder.planId) || SUBSCRIPTION_PLANS[0];
      const endDate = new Date(Date.now() + plan.durationDays * 86400000);
      const validUntil = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      setUserProfile((prev) => ({
        ...prev,
        isPremium: true,
        premiumTier: (activeGatewayOrder.planId || 'PREMIUM_ANNUAL').toUpperCase() as any,
        premiumValidUntil: validUntil
      }));

      addExpense(
        `${plan.title} Subscription`,
        'Subscriptions',
        txn.amount,
        txn.paymentMethod,
        `Payment Gateway Ref: ${txn.paymentId} (Order: ${txn.orderId})`,
        false,
        'Priyanshu'
      );

      addNotificationAlert(
        'Subscription Activated',
        `₹${txn.amount} paid for ${plan.title} via ${txn.paymentMethod}. FinFam PRO active until ${validUntil}.`,
        'PAYMENT_SUCCESS',
        `₹${txn.amount}`
      );
    } else if (activeGatewayOrder.category === 'BILL' && activeGatewayOrder.billId) {
      setBills((prev) =>
        prev.map((b) => (b.id === activeGatewayOrder.billId ? { ...b, isPaid: true } : b))
      );

      addExpense(
        activeGatewayOrder.title,
        'Bills',
        txn.amount,
        txn.paymentMethod,
        `Payment Gateway Ref: ${txn.paymentId}`,
        true,
        'Priyanshu'
      );

      addNotificationAlert(
        'Bill Settled',
        `₹${txn.amount} paid for ${activeGatewayOrder.title} via ${txn.paymentMethod}.`,
        'PAYMENT_SUCCESS',
        `₹${txn.amount}`
      );
    } else if (activeGatewayOrder.category === 'GOAL_TOPUP' && activeGatewayOrder.goalId) {
      depositGoal(activeGatewayOrder.goalId, txn.amount);

      addNotificationAlert(
        'Goal Milestone Funded',
        `₹${txn.amount} deposited into ${activeGatewayOrder.title} via Payment Gateway.`,
        'PAYMENT_SUCCESS',
        `₹${txn.amount}`
      );
    } else {
      addExpense(
        activeGatewayOrder.title,
        'Payment',
        txn.amount,
        txn.paymentMethod,
        `Payment Gateway Ref: ${txn.paymentId}`,
        false,
        'Priyanshu'
      );

      addNotificationAlert(
        'Payment Completed',
        `₹${txn.amount} successfully paid for ${activeGatewayOrder.title} via ${txn.paymentMethod}.`,
        'PAYMENT_SUCCESS',
        `₹${txn.amount}`
      );
    }
  };

  // CRUD Operations
  const addExpense = (
    title: string,
    category: string,
    amount: number,
    paymentMethod: string,
    notes: string = '',
    isFamilyShared: boolean = false,
    memberName: string = 'Priyanshu'
  ) => {
    const newItem: TransactionItem = {
      id: Date.now(),
      title,
      category,
      amount,
      type: 'EXPENSE',
      isCredit: false,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      paymentMethod,
      notes,
      isFamilyShared,
      memberName,
      iconName: SpendingTrendsEngine.getCategoryIcon(category),
      riskStatus: 'VERIFIED'
    };

    setTransactions((prev) => [newItem, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      totalBalance: Math.max(prev.totalBalance - amount, 0),
      monthlyExpenses: prev.monthlyExpenses + amount,
      monthlySavings: Math.max(prev.monthlyIncome - (prev.monthlyExpenses + amount), 0)
    }));

    // Update matching budget spent
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.category.toLowerCase().includes(category.toLowerCase())) {
          return { ...b, spent: b.spent + amount };
        }
        return b;
      })
    );
  };

  const addIncome = (
    title: string,
    category: string,
    amount: number,
    paymentMethod: string,
    notes: string = '',
    memberName: string = 'Priyanshu'
  ) => {
    const newItem: TransactionItem = {
      id: Date.now(),
      title,
      category,
      amount,
      type: 'INCOME',
      isCredit: true,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      paymentMethod,
      notes,
      isFamilyShared: true,
      memberName,
      iconName: 'Sparkles',
      riskStatus: 'VERIFIED'
    };

    setTransactions((prev) => [newItem, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      totalBalance: prev.totalBalance + amount,
      monthlyIncome: prev.monthlyIncome + amount,
      monthlySavings: prev.monthlySavings + amount
    }));
  };

  const deleteTransaction = (id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addBudget = (category: string, limit: number) => {
    const newBudget: BudgetItem = {
      id: Date.now(),
      category,
      monthlyLimit: limit,
      spent: 0,
      month: 'August 2026',
      iconName: SpendingTrendsEngine.getCategoryIcon(category),
      alertThreshold80: true,
      alertThreshold90: true,
      alertThreshold100: true
    };
    setBudgets((prev) => [...prev, newBudget]);
  };

  const deleteBudget = (id: number) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const addGoal = (
    name: string,
    emoji: string,
    targetAmount: number,
    targetDate: string,
    category: string,
    isFamilyGoal: boolean,
    options?: Partial<GoalItem>
  ) => {
    const rawGoal: Partial<GoalItem> = {
      id: Date.now(),
      name,
      emoji: emoji || '🎯',
      targetAmount,
      currentAmount: 0,
      targetDate,
      category,
      isFamilyGoal,
      ...options
    };
    const newGoal = GoalFeasibilityEngine.normalizeGoal(rawGoal);
    setGoals((prev) => [...prev, newGoal]);
  };

  const depositGoal = (id: number, amount: number) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || isNaN(amount) || amount <= 0) return;

    // Remaining gap on the goal
    const remainingGap = Math.max(goal.targetAmount - goal.currentAmount, 0);
    if (remainingGap <= 0) return;

    // Available cash balance in household vault
    const availableCash = Math.max(userProfile.totalBalance, 0);
    const actualDeposit = Math.min(amount, remainingGap, availableCash);
    if (actualDeposit <= 0) return;

    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + actualDeposit } : g))
    );

    // Internal stock transfer: deduct from unassigned cash, increase earmarked goal stock
    setUserProfile((prev) => ({
      ...prev,
      totalBalance: Math.max(prev.totalBalance - actualDeposit, 0)
    }));

    // Record transaction as TRANSFER (NOT an EXPENSE, does NOT inflate monthly household outflow)
    const newTx: TransactionItem = {
      id: Date.now(),
      title: `Earmark to Goal: ${goal.name}`,
      category: 'Savings',
      amount: actualDeposit,
      type: 'TRANSFER',
      isCredit: false,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      paymentMethod: 'Vault Allocation',
      notes: `Transferred ₹${actualDeposit.toLocaleString('en-IN')} to earmarked savings for ${goal.name}`,
      isFamilyShared: true,
      memberName: 'Priyanshu',
      iconName: 'Target',
      riskStatus: 'VERIFIED'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const withdrawGoal = (id: number, amount: number) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || isNaN(amount) || amount <= 0) return;

    // Cannot withdraw more than is currently in the goal
    const actualWithdrawal = Math.min(amount, goal.currentAmount);
    if (actualWithdrawal <= 0) return;

    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount - actualWithdrawal } : g))
    );

    // Internal stock transfer: return from goal stock to unassigned liquid cash
    setUserProfile((prev) => ({
      ...prev,
      totalBalance: prev.totalBalance + actualWithdrawal
    }));

    // Record transaction as TRANSFER (NOT an INCOME, does NOT inflate monthly earned income)
    const newTx: TransactionItem = {
      id: Date.now(),
      title: `De-allocated from Goal: ${goal.name}`,
      category: 'Savings',
      amount: actualWithdrawal,
      type: 'TRANSFER',
      isCredit: true,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      paymentMethod: 'Vault Allocation',
      notes: `Returned ₹${actualWithdrawal.toLocaleString('en-IN')} from ${goal.name} to liquid cash`,
      isFamilyShared: true,
      memberName: 'Priyanshu',
      iconName: 'Target',
      riskStatus: 'VERIFIED'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteGoal = (id: number) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addBill = (name: string, amount: number, dueDate: string, category: string, isRecurring: boolean, autoPay: boolean) => {
    const newBill: BillItem = {
      id: Date.now(),
      name,
      amount,
      dueDate,
      dueTimestamp: Date.now() + 86400000 * 7,
      category,
      isRecurring,
      isPaid: false,
      reminderDays: 3,
      autoPayEnabled: autoPay
    };
    setBills((prev) => [...prev, newBill]);
  };

  const payBill = (billId: number, billName: string, amount: number, method: string = 'UPI') => {
    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, isPaid: true } : b)));
    addExpense(billName, 'Bills', amount, method, `Paid utility bill (${billName})`, true);
  };

  const deleteBill = (id: number) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleAutoPay = (id: number) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, autoPayEnabled: !b.autoPayEnabled } : b)));
  };

  const addFamilyMember = (data: Partial<FamilyMemberItem>) => {
    const newMember: FamilyMemberItem = {
      id: Date.now(),
      name: data.name || 'New Member',
      role: data.role || 'Member',
      email: data.email || '',
      avatarColor: data.avatarColor || '#3B82F6',
      monthlyContribution: data.monthlyContribution || 0,
      spentThisMonth: data.spentThisMonth || 0,
      salaryIncome: data.salaryIncome || 0,
      freelanceIncome: 0,
      businessIncome: 0,
      rentalIncome: 0,
      otherIncome: 0,
      foodExpense: 0,
      transportExpense: 0,
      shoppingExpense: 0,
      educationExpense: 0,
      healthExpense: 0,
      entertainmentExpense: 0,
      bankSavings: 0,
      emergencyFund: 0,
      fixedDeposit: 0,
      mutualFund: 0,
      monthlyEmi: 0,
      equityInvestments: 0,
      goldInvestments: 0,
      ppfInvestments: 0,
      fdInterest: 0,
      rdInterest: 0,
      savingsInterest: 0,
      investmentReturns: 0
    };
    setFamilyMembers((prev) => [...prev, newMember]);
  };

  const updateFamilyMember = (member: FamilyMemberItem) => {
    setFamilyMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
  };

  const deleteFamilyMember = (id: number) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const addEmi = (
    title: string,
    category: string,
    totalAmount: number,
    monthlyEmi: number,
    interestRate: number,
    tenureMonths: number,
    lenderBank: string,
    dueDate: string = '05th of every month'
  ) => {
    const newEmi: EmiItem = {
      id: Date.now(),
      title,
      category,
      totalAmount,
      paidAmount: 0,
      monthlyEmi,
      interestRate,
      totalTenureMonths: tenureMonths,
      paidTenureMonths: 0,
      dueDate,
      dueDayOfMonth: 5,
      lenderBank,
      isAutoDebit: true,
      isPaidThisMonth: false,
      iconName: category.toLowerCase().includes('car') ? 'Car' : category.toLowerCase().includes('bike') ? 'Bike' : 'Landmark'
    };
    setEmis((prev) => [...prev, newEmi]);
  };

  const payEmi = (emiId: number, emiTitle: string, amount: number, method: string = 'UPI') => {
    setEmis((prev) =>
      prev.map((e) => {
        if (e.id === emiId) {
          return {
            ...e,
            paidAmount: Math.min(e.paidAmount + amount, e.totalAmount),
            paidTenureMonths: Math.min(e.paidTenureMonths + 1, e.totalTenureMonths),
            isPaidThisMonth: true,
            lastPaymentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          };
        }
        return e;
      })
    );
    addExpense(emiTitle, 'Debt & EMI', amount, method, `Loan EMI installment for ${emiTitle}`);
  };

  const deleteEmi = (id: number) => {
    setEmis((prev) => prev.filter((e) => e.id !== id));
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...data }));
  };

  const resetAllData = () => {
    const FINFAM_KEYS = [
      'finfam_profile',
      'finfam_transactions',
      'finfam_budgets',
      'finfam_goals',
      'finfam_bills',
      'finfam_family',
      'finfam_emis',
      'finfam_notifications',
      'finfam_transfers',
      'finfam_payments',
      'finfam_decision_history',
      'finfam_is_demo'
    ];
    FINFAM_KEYS.forEach((k) => localStorage.removeItem(k));
    setUserProfile(INITIAL_PROFILE);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_GOALS.map((g) => GoalFeasibilityEngine.normalizeGoal(g)));
    setBills(INITIAL_BILLS);
    setFamilyMembers(INITIAL_FAMILY);
    setEmis(INITIAL_EMIS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setRadarHealthAxes(INITIAL_RADAR_AXES);
    setRealTimeTransferHistory(INITIAL_TRANSFER_HISTORY);
    setIsDemoMode(false);
    setPreviousGoalsSnapshot(null);
  };

  return (
    <FinFamContext.Provider
      value={{
        userProfile,
        transactions,
        budgets,
        goals,
        bills,
        familyMembers,
        emis,
        financialHealth,
        monthlySpendingTrends,
        spendingTrendHorizon,
        setSpendingTrendHorizon,
        spendingTrendCategory,
        setSpendingTrendCategory,
        spendingTrendMultiCategories,
        toggleSpendingTrendMultiCategory,
        spendingTrendMultiLineMode,
        setSpendingTrendMultiLineMode,
        spendingTrendSelectedMonthIndex,
        setSpendingTrendSelectedMonth,
        radarHealthAxes,
        isSimulatingRadarUpdates,
        togglePeriodicRadarSimulation,
        simulateRadarDataStep,
        resetRadarBaseline,
        dailySpendingPoints,
        weeklySpendingBars,
        familyContributions,
        expensePrediction,
        notifications,
        dismissNotification,
        markAllNotificationsRead,
        addNotificationAlert,
        chatMessages,
        isCoachTyping,
        askAiCoach,
        scannedReceiptResult,
        isScanningReceipt,
        scanReceiptSimulator,
        confirmScannedReceiptAsExpense,
        dismissScannedReceipt,
        liveP2pNodes,
        realTimeTransferHistory,
        isLiveTransferStreaming,
        executeRealTimeFundsTransfer,
        paymentHistory,
        activePlanTier,
        isSubscriptionActive,
        processSubscriptionPayment,
        refundPayment,
        addExpense,
        addIncome,
        deleteTransaction,
        addBudget,
        deleteBudget,
        addGoal,
        depositGoal,
        withdrawGoal,
        deleteGoal,
        updateGoal,
        setGoals,
        householdProfile,
        setHouseholdProfile,
        goalFeasibilities,
        sharedTimeline,
        goalConflicts,
        interferenceMatrix,
        resolutionResult,
        isDemoMode,
        loadJudgeDemoScenario,
        resetJudgeDemoScenario,
        applyResolutionScenario,
        revertLastAppliedPlan,
        previousGoalsSnapshot,
        setPreviousGoalsSnapshot,
        addBill,
        payBill,
        deleteBill,
        toggleAutoPay,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        addEmi,
        payEmi,
        deleteEmi,
        updateProfile,
        resetAllData,
        decisionHistory,
        saveDecisionRecord,
        deleteDecisionRecord,
        updateDecisionStatus,
        isPaymentGatewayOpen,
        activeGatewayOrder,
        openPaymentGateway,
        closePaymentGateway,
        handleGatewayPaymentSuccess
      }}
    >
      {children}
    </FinFamContext.Provider>
  );
};

export const useFinFam = () => {
  const context = useContext(FinFamContext);
  if (!context) {
    throw new Error('useFinFam must be used within a FinFamProvider');
  }
  return context;
};
