export type GoalPriorityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIONAL';

export type GoalCategoryType =
  | 'EMERGENCY'
  | 'HOME'
  | 'EDUCATION'
  | 'RETIREMENT'
  | 'VEHICLE'
  | 'TRAVEL'
  | 'MARRIAGE'
  | 'DEBT'
  | 'INVESTMENT'
  | 'CUSTOM';

export type GoalStatusType =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'CONFLICT'
  | 'CONFLICTED'
  | 'UNACHIEVABLE'
  | 'COMPLETED';

export type RiskToleranceType = 'LOW' | 'MEDIUM' | 'HIGH';
export type EssentialityType = 'ESSENTIAL' | 'IMPORTANT' | 'OPTIONAL';

export interface GoalItem {
  id: number;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // e.g., 'Dec 2026' or '2026-12-31'
  category: string;
  isFamilyGoal: boolean;

  // Multi-goal planning extensions
  priority: number; // 1 (Critical) to 5 (Optional)
  priorityLabel: GoalPriorityLabel;
  goalType: GoalCategoryType;
  hardDeadline: boolean; // if true, deadline is locked and cannot be delayed
  targetAmountLocked?: boolean; // if true, target amount cannot be reduced
  deadlineFlexibilityMonths: number; // max months allowed to postpone
  minimumAcceptableAmount: number; // hard floor for target reduction
  monthlyAllocation: number; // currently assigned monthly saving
  monthlyContribution?: number; // alias for monthlyAllocation
  expectedAnnualReturn: number; // percentage (e.g. 7 for 7%)
  inflationRate: number; // percentage (e.g. 6 for 6%)
  riskTolerance: RiskToleranceType;
  essentiality: EssentialityType;
  canPause: boolean;
  canReduceTarget: boolean;
  currentStatus: GoalStatusType;
  status?: GoalStatusType; // alias for currentStatus
  requiredMonthlyContribution?: number;
  fundingGap?: number;
  feasibilityScore?: number;
  conflictLevel?: string;
  projectedCompletionDate?: string;
  familyMemberOwner?: string;
  pauseStartMonth?: string | null; // e.g. '2027-01'
  pauseEndMonth?: string | null; // e.g. '2027-06'
  archived?: boolean;
}

export interface HouseholdFinancialProfile {
  monthlyNetIncome: number;
  essentialMonthlyExpenses: number;
  discretionaryMonthlyExpenses: number;
  existingCashBalance: number;
  protectedEmergencyReserve: number;
  unassignedSavings: number;
  activeEmiMonthlyTotal: number;
  recurringBillsTotal: number;
  scheduledIncomeChanges?: Array<{
    effectiveMonth: string; // 'YYYY-MM'
    deltaAmount: number; // positive for raise, negative for cut
    reason: string;
  }>;
  oneTimeFinancialShocks?: Array<{
    month: string; // 'YYYY-MM'
    amount: number;
    description: string;
  }>;
}

export interface FinancialCapacityResult {
  totalMonthlyIncome: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  emiCommitments: number;
  recurringBills: number;
  mandatoryReserveContribution: number;
  availableGoalCapacity: number; // Net flow available for all goals
  currentGoalAllocations: number;
  remainingCapacity: number; // capacity - allocations (can be negative = deficit)
  isDeficit: boolean;
  deficitAmount: number;

  // Exact Phase 3 specification aliases
  availableCapacity: number;
  income: number;
  expenses: number;
  emi: number;
  bills: number;
  emergencyAllocation: number;
  existingGoalContributions: number;
  remainingGoalCapacity: number;
}

export interface GoalFeasibilityResult {
  goalId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  targetDate: string;
  targetYearMonth: string;
  monthsRemaining: number;
  inflationAdjustedTarget: number;
  expectedInvestmentGrowth: number;
  requiredMonthlyContribution: number;
  currentMonthlyAllocation: number;
  monthlyShortfall: number;
  fundingGap: number;
  feasibilityScore: number; // 0-100
  feasibilityPercentage: number; // 0-100
  projectedCompletionDate: string;
  delayMonths: number;
  status: GoalStatusType;
  isOverdue: boolean;
  isCompleted: boolean;
  warningNote?: string;
}

export interface MonthlyAllocatedShare {
  goalId: number;
  goalName: string;
  requiredContribution: number;
  allocatedContribution: number;
  shortfall: number;
  closingBalance: number;
  isFullyFunded: boolean;
}

export interface MonthlyTimelinePoint {
  monthIndex: number;
  yearMonth: string; // '2026-10'
  monthLabel: string; // 'Oct 2026'
  income: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  emiTotal: number;
  billsTotal: number;
  oneTimeShocks: number;
  availableCapacity: number;
  requiredGoalFunding: number;
  allocatedGoalFunding: number;
  unallocatedSurplus: number;
  monthlyDeficit: number;
  goalAllocations: MonthlyAllocatedShare[];
  activeGoalIds: number[];
  conflictGoalIds: number[];
  hasConflict: boolean;
  closingReserveBuffer: number;
}

export interface SharedTimelineResult {
  horizonMonths: number;
  startMonth: string;
  endMonth: string;
  timeline: MonthlyTimelinePoint[];
  totalRequiredFunding: number;
  totalAllocatedFunding: number;
  peakDeficitMonth: string;
  peakMonthlyDeficit: number;
  conflictMonthsCount: number;
}

export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConflictType =
  | 'CAPACITY_DEFICIT'
  | 'DEADLINE_OVERLAP'
  | 'LOCKED_GOAL_INFEASIBLE'
  | 'EMERGENCY_RESERVE_VIOLATION'
  | 'OVERDUE_GOAL'
  | 'EMI_PRESSURE'
  | 'TARGET_UNDERFUNDED';

export interface GoalConflictItem {
  id: string;
  type: ConflictType;
  conflictType?: string; // alias for type
  severity: ConflictSeverity;
  severityScore: number; // 0-100
  title: string;
  reason: string;
  affectedGoalIds: number[];
  affectedGoalNames: string[];
  affectedPeriod: string;
  monthlyShortfall: number;
  monthlyImpact?: number; // alias for monthlyShortfall
  finalShortfall: number;
  relevantCalculation: string;
  suggestedActionTypes: string[];
  goalA?: string | GoalItem;
  goalB?: string | GoalItem;
  affectedMonths?: number | string;
}

export interface InterferenceEdge {
  sourceGoalId: number;
  sourceGoalName: string;
  targetGoalId: number;
  targetGoalName: string;
  interferenceScore: number; // 0-100
  severity: ConflictSeverity;
  monthlyImpact: number;
  overlappingConflictMonths: number;
  reason: string;
}

export interface InterferenceNode {
  goalId: number;
  goalName: string;
  emoji: string;
  category: string;
  priorityLabel: GoalPriorityLabel;
  targetAmount: number;
  requiredMonthly: number;
  allocatedMonthly: number;
  feasibilityScore: number;
  incomingInterferenceScore: number;
  outgoingInterferenceScore: number;
  status: GoalStatusType;
}

export interface InterferenceMatrixResult {
  nodes: InterferenceNode[];
  edges: InterferenceEdge[];
  matrix: Record<number, Record<number, number>>;
  highestInterferenceEdge: InterferenceEdge | null;
  overallCompetitionDensity: number;
}

export interface RippleTrigger {
  type:
    | 'DEADLINE_CHANGE'
    | 'TARGET_CHANGE'
    | 'PRIORITY_CHANGE'
    | 'INCOME_CHANGE'
    | 'EXPENSE_CHANGE'
    | 'NEW_EMI'
    | 'EMERGENCY_SHOCK'
    | 'PAUSE_GOAL';
  targetGoalId?: number;
  targetGoalName?: string;
  parameterName: string;
  oldValue: string | number;
  newValue: string | number;
}

export interface RippleEvent {
  order: number;
  entity: string;
  metric: string;
  before: string | number;
  after: string | number;
  delta: string | number;
  impactType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  explanation: string;
}

export interface RippleSimulationResult {
  trigger: RippleTrigger;
  events: RippleEvent[];
  baselineCapacity: number;
  proposedCapacity: number;
  baselineFeasibilities: Record<number, GoalFeasibilityResult>;
  proposedFeasibilities: Record<number, GoalFeasibilityResult>;
  baselineConflicts: GoalConflictItem[];
  proposedConflicts: GoalConflictItem[];
  resolvedConflictsCount: number;
  newConflictsCount: number;
  summaryNarrative: string;
  proposedGoals: GoalItem[];
}

export interface ResolutionAction {
  type: 'DELAY_GOAL' | 'REDUCE_TARGET' | 'PAUSE_GOAL' | 'REDUCE_DISCRETIONARY' | 'BOOST_SAVINGS' | 'REALLOCATE_FUNDS';
  goalId?: number;
  goalName?: string;
  description: string;
  magnitude: number;
  unit: string;
}

export interface ResolutionScenario {
  id: string;
  title: string;
  tagline: string;
  isFeasible: boolean;
  hardConstraintsPassed: boolean;
  overallFeasibilityScore: number;
  monthlyDeficitRemaining: number;
  remainingShortfallTotal: number;
  actions: ResolutionAction[];
  goalsProtected: string[];
  goalsDelayedOrAdjusted: string[];
  monthlyBudgetDelta: number;
  recommendationRank: number;
  tradeOffSummary: string;
  whyThisWorks: string;
  adjustedGoals: GoalItem[];
  householdProfileChanges?: Partial<HouseholdFinancialProfile>;
}

export interface ResolutionComparisonResult {
  scenarios: ResolutionScenario[];
  recommendedScenarioId: string | null;
  allInfeasible: boolean;
  bestPartialScenarioId: string | null;
  infeasibilityReason?: string;
}
