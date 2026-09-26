import { GoalItem, GoalFeasibilityResult, GoalStatusType } from '../../types/goalPlanning';

export const BASE_SIMULATION_DATE = '2026-10-01';

export const GoalFeasibilityEngine = {
  /**
   * Parses arbitrary user dates like "Dec 2026", "2026-12", "15 Aug 2027", "2028-08-31"
   * into a standardized YYYY-MM string.
   */
  parseTargetYearMonth(dateStr: string): string {
    if (!dateStr || typeof dateStr !== 'string') {
      return '2027-12';
    }

    const trimmed = dateStr.trim();

    // Check if ISO format YYYY-MM or YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, '0');
      return `${year}-${month}`;
    }

    // Check month name and year e.g. "Dec 2026", "August 2028"
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const parts = trimmed.toLowerCase().split(/[\s,/-]+/);
    let foundMonth = '12';
    let foundYear = '2027';

    for (const part of parts) {
      const prefix = part.slice(0, 3);
      if (monthNames[prefix]) {
        foundMonth = monthNames[prefix];
      } else if (/^\d{4}$/.test(part)) {
        foundYear = part;
      }
    }

    return `${foundYear}-${foundMonth}`;
  },

  /**
   * Calculates the integer month difference between baseDate ('YYYY-MM-DD' or 'YYYY-MM')
   * and targetDate.
   */
  calculateMonthsRemaining(targetDateStr: string, baseDateStr: string = BASE_SIMULATION_DATE): number {
    const targetYM = this.parseTargetYearMonth(targetDateStr);
    const [targetYear, targetMonth] = targetYM.split('-').map(Number);

    const baseYM = baseDateStr.slice(0, 7);
    const [baseYear, baseMonth] = baseYM.split('-').map(Number);

    const diff = (targetYear - baseYear) * 12 + (targetMonth - baseMonth);
    return diff;
  },

  /**
   * Formats a YYYY-MM into a friendly string like "Dec 2026".
   */
  formatYearMonthLabel(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthLabels[(month - 1) % 12] || 'Dec'} ${year}`;
  },

  /**
   * Adds months to a YYYY-MM string.
   */
  addMonthsToYearMonth(yearMonth: string, monthsToAdd: number): string {
    const [y, m] = yearMonth.split('-').map(Number);
    const totalMonths = (y * 12 + (m - 1)) + monthsToAdd;
    const newY = Math.floor(totalMonths / 12);
    const newM = (totalMonths % 12) + 1;
    return `${newY}-${String(newM).padStart(2, '0')}`;
  },

  /**
   * Core feasibility calculation for a single goal.
   * Transparent zero-return baseline by default, with optional return & inflation adjustments.
   */
  calculateGoalFeasibility(
    goal: GoalItem,
    baseDateStr: string = BASE_SIMULATION_DATE,
    applyInflation: boolean = false,
    applyInvestmentGrowth: boolean = false
  ): GoalFeasibilityResult {
    const targetYM = this.parseTargetYearMonth(goal.targetDate);
    const monthsRemaining = this.calculateMonthsRemaining(goal.targetDate, baseDateStr);
    const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);

    // 1. Completed Goal
    if (remainingAmount <= 0) {
      return {
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remainingAmount: 0,
        targetDate: goal.targetDate,
        targetYearMonth: targetYM,
        monthsRemaining: Math.max(monthsRemaining, 0),
        inflationAdjustedTarget: goal.targetAmount,
        expectedInvestmentGrowth: 0,
        requiredMonthlyContribution: 0,
        currentMonthlyAllocation: goal.monthlyAllocation || 0,
        monthlyShortfall: 0,
        fundingGap: 0,
        feasibilityScore: 100,
        feasibilityPercentage: 100,
        projectedCompletionDate: 'Fully Funded',
        delayMonths: 0,
        status: 'COMPLETED',
        isOverdue: false,
        isCompleted: true
      };
    }

    // 2. Overdue or Expired Goal
    if (monthsRemaining <= 0) {
      return {
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remainingAmount,
        targetDate: goal.targetDate,
        targetYearMonth: targetYM,
        monthsRemaining: 0,
        inflationAdjustedTarget: goal.targetAmount,
        expectedInvestmentGrowth: 0,
        requiredMonthlyContribution: remainingAmount, // Requires immediate lump sum
        currentMonthlyAllocation: goal.monthlyAllocation || 0,
        monthlyShortfall: Math.max(remainingAmount - (goal.monthlyAllocation || 0), 0),
        fundingGap: remainingAmount,
        feasibilityScore: 10,
        feasibilityPercentage: 10,
        projectedCompletionDate: 'Deadline Overdue',
        delayMonths: Math.abs(monthsRemaining) + 1,
        status: 'UNACHIEVABLE',
        isOverdue: true,
        isCompleted: false,
        warningNote: 'Target deadline has passed without full funding.'
      };
    }

    // 3. Active Goal - Baseline calculation
    let effectiveTarget = goal.targetAmount;
    if (applyInflation && (goal.inflationRate || 0) > 0) {
      const annualInflation = goal.inflationRate / 100;
      effectiveTarget = Math.round(goal.targetAmount * Math.pow(1 + annualInflation, monthsRemaining / 12));
    }

    let requiredMonthly = 0;
    let expectedGrowth = 0;

    if (applyInvestmentGrowth && (goal.expectedAnnualReturn || 0) > 0) {
      const r = (goal.expectedAnnualReturn / 100) / 12;
      const n = monthsRemaining;
      const futureValueOfCurrent = goal.currentAmount * Math.pow(1 + r, n);
      expectedGrowth = Math.max(Math.round(futureValueOfCurrent - goal.currentAmount), 0);
      const gapToFund = Math.max(effectiveTarget - futureValueOfCurrent, 0);

      if (gapToFund <= 0) {
        requiredMonthly = 0;
      } else {
        // PMT = gap * r / ((1 + r)^n - 1)
        const denominator = Math.pow(1 + r, n) - 1;
        requiredMonthly = denominator > 0 ? Math.round(gapToFund * r / denominator) : Math.round(gapToFund / n);
      }
    } else {
      // Standard Transparent Zero-Return Baseline:
      requiredMonthly = Math.round(remainingAmount / monthsRemaining);
    }

    const currentAllocation = goal.monthlyAllocation || 0;
    const monthlyShortfall = Math.max(requiredMonthly - currentAllocation, 0);

    // Projected completion at current monthly allocation
    let projectedYM = targetYM;
    let delayMonths = 0;

    if (currentAllocation > 0) {
      const monthsNeeded = Math.ceil(remainingAmount / currentAllocation);
      const baseYM = baseDateStr.slice(0, 7);
      projectedYM = this.addMonthsToYearMonth(baseYM, monthsNeeded);
      delayMonths = Math.max(monthsNeeded - monthsRemaining, 0);
    } else {
      delayMonths = 999;
      projectedYM = 'No Allocation';
    }

    // Deterministic Feasibility Score (0 - 100)
    let feasibilityScore = 100;
    if (currentAllocation === 0) {
      feasibilityScore = Math.max(Math.round((goal.currentAmount / goal.targetAmount) * 30), 15);
    } else {
      const coverageRatio = Math.min(currentAllocation / Math.max(requiredMonthly, 1), 1.5);
      const timeFactor = Math.min(monthsRemaining / 12, 1);
      const fundingProgress = Math.min(goal.currentAmount / goal.targetAmount, 1);

      feasibilityScore = Math.min(
        100,
        Math.max(
          10,
          Math.round(
            coverageRatio * 65 +
            timeFactor * 15 +
            fundingProgress * 20
          )
        )
      );
    }

    // Determine Status
    let status: GoalStatusType = 'ON_TRACK';
    if (feasibilityScore >= 80 && monthlyShortfall === 0) {
      status = 'ON_TRACK';
    } else if (feasibilityScore >= 55) {
      status = 'AT_RISK';
    } else if (delayMonths > (goal.deadlineFlexibilityMonths || 0) && goal.hardDeadline) {
      status = 'CONFLICT';
    } else {
      status = 'AT_RISK';
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount,
      targetDate: goal.targetDate,
      targetYearMonth: targetYM,
      monthsRemaining,
      inflationAdjustedTarget: effectiveTarget,
      expectedInvestmentGrowth: expectedGrowth,
      requiredMonthlyContribution: requiredMonthly,
      currentMonthlyAllocation: currentAllocation,
      monthlyShortfall,
      fundingGap: remainingAmount,
      feasibilityScore,
      feasibilityPercentage: feasibilityScore,
      projectedCompletionDate: projectedYM === 'No Allocation' ? 'Indefinite' : this.formatYearMonthLabel(projectedYM),
      delayMonths: delayMonths === 999 ? 0 : delayMonths,
      status,
      isOverdue: false,
      isCompleted: false
    };
  },

  /**
   * Helper to ensure legacy goals have all necessary default properties.
   */
  normalizeGoal(raw: Partial<GoalItem>): GoalItem {
    const targetAmount = Math.max(raw.targetAmount ?? 100000, 1000);
    const currentAmount = Math.max(raw.currentAmount ?? 0, 0);
    const targetDate = raw.targetDate || 'Dec 2027';

    // Infer priority if missing
    let priority = raw.priority ?? 2;
    let priorityLabel = raw.priorityLabel ?? 'HIGH';
    if (raw.category?.toLowerCase().includes('emergency') || raw.name?.toLowerCase().includes('emergency')) {
      priority = 1;
      priorityLabel = 'CRITICAL';
    } else if (raw.category?.toLowerCase().includes('travel') || raw.category?.toLowerCase().includes('vacation')) {
      priority = 4;
      priorityLabel = 'LOW';
    }

    // Default monthly allocation based on zero-return need if not specified
    const remaining = Math.max(targetAmount - currentAmount, 0);
    const months = Math.max(this.calculateMonthsRemaining(targetDate), 1);
    const defaultAllocation = raw.monthlyAllocation ?? Math.round(remaining / months);

    return {
      id: raw.id ?? Date.now(),
      name: raw.name || 'Financial Goal',
      emoji: raw.emoji || '🎯',
      targetAmount,
      currentAmount,
      targetDate,
      category: raw.category || 'Savings',
      isFamilyGoal: raw.isFamilyGoal ?? true,
      priority,
      priorityLabel,
      goalType: (raw.goalType as any) || (raw.category?.toUpperCase() as any) || 'CUSTOM',
      hardDeadline: raw.hardDeadline ?? (priority <= 2),
      targetAmountLocked: raw.targetAmountLocked ?? (priority === 1),
      deadlineFlexibilityMonths: raw.deadlineFlexibilityMonths ?? (priority === 1 ? 0 : 12),
      minimumAcceptableAmount: raw.minimumAcceptableAmount ?? Math.round(targetAmount * 0.8),
      monthlyAllocation: defaultAllocation,
      monthlyContribution: raw.monthlyContribution ?? defaultAllocation,
      expectedAnnualReturn: raw.expectedAnnualReturn ?? 0,
      inflationRate: raw.inflationRate ?? 0,
      riskTolerance: raw.riskTolerance || 'MEDIUM',
      essentiality: raw.essentiality || (priority === 1 ? 'ESSENTIAL' : priority === 2 ? 'IMPORTANT' : 'OPTIONAL'),
      canPause: raw.canPause ?? (priority >= 3),
      canReduceTarget: raw.canReduceTarget ?? (priority >= 3),
      currentStatus: raw.currentStatus || raw.status || 'ON_TRACK',
      status: raw.status || raw.currentStatus || 'ON_TRACK',
      requiredMonthlyContribution: raw.requiredMonthlyContribution,
      fundingGap: raw.fundingGap ?? Math.max(targetAmount - currentAmount, 0),
      feasibilityScore: raw.feasibilityScore,
      conflictLevel: raw.conflictLevel,
      projectedCompletionDate: raw.projectedCompletionDate,
      familyMemberOwner: raw.familyMemberOwner || 'Household Shared',
      pauseStartMonth: raw.pauseStartMonth || null,
      pauseEndMonth: raw.pauseEndMonth || null,
      archived: raw.archived ?? false
    };
  }
};
