export type TimeHorizonType = 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'LAST_12_MONTHS' | 'ALL_TIME';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  currencySymbol: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  emergencyFund: number;
  healthScore: number;
  previousHealthScore: number;
  isPremium: boolean;
  premiumTier: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL' | 'PREMIUM_LIFETIME';
  premiumValidUntil: string;
  familyId: string;
  familyName: string;
  isBiometricEnabled: boolean;
  isNotificationsEnabled: boolean;
  unreadNotificationsCount: number;
}

export interface TransactionItem {
  id: number;
  title: string;
  category: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'PAYMENT';
  isCredit: boolean;
  date: string;
  timestamp: number;
  paymentMethod: string;
  notes: string;
  receiptUrl?: string | null;
  isFamilyShared: boolean;
  memberName: string;
  iconName: string;
  riskStatus: 'VERIFIED' | 'FLAGGED' | 'PENDING';
}

export interface BudgetItem {
  id: number;
  category: string;
  monthlyLimit: number;
  spent: number;
  month: string;
  iconName: string;
  alertThreshold80: boolean;
  alertThreshold90: boolean;
  alertThreshold100: boolean;
}

import {
  GoalItem as ExtendedGoalItem
} from './types/goalPlanning';

export type GoalItem = ExtendedGoalItem;

export interface BillItem {
  id: number;
  name: string;
  amount: number;
  dueDate: string;
  dueTimestamp: number;
  category: string;
  isRecurring: boolean;
  isPaid: boolean;
  reminderDays: number;
  autoPayEnabled: boolean;
}

export interface FamilyMemberItem {
  id: number;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  avatarColorHex?: string;
  monthlyContribution: number;
  spentThisMonth: number;
  salaryIncome: number;
  freelanceIncome: number;
  businessIncome: number;
  rentalIncome: number;
  otherIncome: number;
  foodExpense: number;
  transportExpense: number;
  shoppingExpense: number;
  educationExpense: number;
  healthExpense: number;
  entertainmentExpense: number;
  bankSavings: number;
  emergencyFund: number;
  fixedDeposit: number;
  mutualFund: number;
  monthlyEmi: number;
  equityInvestments: number;
  goldInvestments: number;
  ppfInvestments: number;
  fdInterest: number;
  rdInterest: number;
  savingsInterest: number;
  investmentReturns: number;
}

export interface EmiItem {
  id: number;
  title: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  monthlyEmi: number;
  interestRate: number;
  totalTenureMonths: number;
  paidTenureMonths: number;
  dueDate: string;
  dueDayOfMonth: number;
  lenderBank: string;
  isAutoDebit: boolean;
  isPaidThisMonth: boolean;
  lastPaymentDate?: string | null;
  iconName: string;
}

export interface AmortizationRow {
  periodIndex: number;
  periodLabel: string;
  openingBalance: number;
  emiPaid: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  cumulativeInterest: number;
}

export interface PrepaymentAnalysis {
  extraMonthlyPayment: number;
  originalTenureMonths: number;
  newTenureMonths: number;
  monthsSaved: number;
  originalTotalInterest: number;
  newTotalInterest: number;
  totalInterestSaved: number;
  interestSavingsPercent: number;
}

export interface EmiCalculationResult {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  interestPercentageOfTotal: number;
  principalPercentageOfTotal: number;
  yearlyAmortization: AmortizationRow[];
  monthlyAmortization: AmortizationRow[];
  prepaymentScenario: PrepaymentAnalysis | null;
}

export interface LoanPreset {
  id: string;
  title: string;
  category: string;
  defaultAmount: number;
  defaultAnnualRate: number;
  defaultTenureMonths: number;
  iconName: string;
  defaultLender: string;
  description: string;
}

export interface FinancialHealthPillar {
  score: number;
  title?: string;
  summary?: string;
  weight?: number;
}

export interface FinancialHealth {
  overallScore: number;
  statusLabel: string;
  statusColorHex: string;
  scoreChange: number;
  savingsRateScore: number;
  spendingConsistencyScore: number;
  emergencyFundScore: number;
  billAdherenceScore: number;
  budgetAdherenceScore: number;
  debtBehaviorScore: number;
  goalProgressScore: number;
  pillars: {
    savingsRate: FinancialHealthPillar;
    debtToIncome: FinancialHealthPillar;
    budgetDiscipline: FinancialHealthPillar;
    emergencyFund: FinancialHealthPillar;
    investmentRate: FinancialHealthPillar;
    spendingConsistency?: FinancialHealthPillar;
    billAdherence?: FinancialHealthPillar;
  };
  aiSummary: string;
  recommendations: string[];
}

export interface FinancialHealthAxis {
  categoryName: string;
  score: number;
  maxScore: number;
  metricFormatted: string;
  status: string;
  statusColor: string;
}

export interface CategoryTrendSeries {
  category: string;
  colorHex: string;
  dataPoints: number[];
  totalSpent: number;
  averageMonthly: number;
  momPercentageChange: number;
  peakMonth: string;
  peakAmount: number;
  lowestMonth: string;
  lowestAmount: number;
  budgetLimit?: number | null;
}

export interface TrendMetrics {
  averageMonthlySpend: number;
  highestSpendMonth: string;
  highestSpendAmount: number;
  lowestSpendMonth: string;
  lowestSpendAmount: number;
  latestMonthSpend: number;
  previousMonthSpend: number;
  momPercentageChange: number;
  topCategory: string;
  topCategoryPercentage: number;
  totalSpendInWindow: number;
}

export interface CategoryBreakdownItem {
  category: string;
  iconName: string;
  colorHex: string;
  totalAmount: number;
  percentageShare: number;
  monthlyAverage: number;
  momPercentageChange: number;
  isBudgetExceeded: boolean;
}

export interface MonthlyDataPoint {
  monthFull: string;
  monthShort: string;
  totalExpense: number;
  totalIncome: number;
  categoryAmounts: Record<string, number>;
}

export interface MonthlySpendingTrendsState {
  monthsFull: string[];
  monthsShort: string[];
  monthlyDataPoints: MonthlyDataPoint[];
  categorySeries: CategoryTrendSeries[];
  totalExpenseSeries: number[];
  totalIncomeSeries: number[];
  selectedTimeHorizon: TimeHorizonType;
  selectedCategory: string;
  selectedMultiCategories: string[];
  isMultiLineMode: boolean;
  metrics: TrendMetrics;
  categoryBreakdowns: CategoryBreakdownItem[];
  selectedMonthIndex: number;
}

export interface DailySpendDataPoint {
  day: number;
  dateLabel: string;
  amount: number;
  isProjected: boolean;
}

export interface WeeklySpendBar {
  dayName: string;
  amount: number;
  isPeakDay?: boolean;
}

export interface FamilyContributionShare {
  memberName: string;
  role: string;
  contributionAmount: number;
  spentAmount: number;
  percentageShare: number;
  avatarColorHex: string;
}

export interface ExpensePrediction {
  projectedEndOfMonthSpend: number;
  projectedFutureSavings: number;
  monthlyBudgetLimit: number;
  isBudgetExceeded: boolean;
  overflowCategory: string;
  overflowAmount: number;
  predictedDaysRemaining: number;
  aiInsights: string[];
  recommendation: string;
}

export type NotificationType =
  | 'BILL_DUE_TOMORROW'
  | 'BUDGET_CROSSED'
  | 'SCORE_INCREASED'
  | 'SAVINGS_GOAL_REACHED'
  | 'PAYMENT_SUCCESS';

export interface NotificationAlertItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timeAgo: string;
  isUnread: boolean;
  actionRoute?: string | null;
  amountFormatted?: string | null;
}

export interface ReceiptScanResult {
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  detectedItems: string[];
  taxGst: number;
  paymentMode: string;
  rawText: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: number;
}

export type RealTimeTransferType = 'FAMILY_ALLOWANCE' | 'DATA_SYNC_BEAM' | 'FUNDS_TRANSFER' | 'EMERGENCY_POOL';
export type RealTimeTransferStatus = 'INITIALIZING' | 'ENCRYPTING' | 'STREAMING' | 'SETTLED' | 'FAILED';

export interface RealTimeTransferRecord {
  id: string;
  utrNumber: string;
  senderName: string;
  senderVpaOrAcc: string;
  receiverName: string;
  receiverVpaOrAcc: string;
  amount?: number;
  payloadSizeKb?: number;
  transferType: RealTimeTransferType;
  status: RealTimeTransferStatus;
  protocol: string;
  latencyMs: number;
  note: string;
  timestampFormatted: string;
}

export interface LivePeerNode {
  id: string;
  name: string;
  relationship: string;
  vpa: string;
  ipAddress: string;
  pingMs: number;
  isOnline: boolean;
  avatarColorHex: string;
  lastSyncText: string;
}

export interface RazorpayTransactionRecord {
  id: string;
  orderId: string;
  paymentId: string;
  signature?: string;
  userId: string;
  planId: string;
  planTitle: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  date: string;
  timestamp: number;
  validUntil: string;
  refundStatus?: string | null;
  refundId?: string | null;
  failureReason?: string | null;
}

export interface SubscriptionPlanTier {
  id: string;
  title: string;
  amountInr: number;
  amountPaise: number;
  durationDays: number;
  badge: string;
  features: string[];
  recommended?: boolean;
}

export * from './types/decisionOptimizer';
export * from './types/goalPlanning';

