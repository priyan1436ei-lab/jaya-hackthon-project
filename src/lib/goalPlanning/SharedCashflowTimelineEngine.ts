import {
  GoalItem,
  HouseholdFinancialProfile,
  MonthlyTimelinePoint,
  MonthlyAllocatedShare,
  SharedTimelineResult
} from '../../types/goalPlanning';
import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from './GoalFeasibilityEngine';

export interface TimelineSimulationOptions {
  startDate?: string; // 'YYYY-MM-DD'
  maxMonths?: number;
  priorityAwareAllocation?: boolean;
  activeEmis?: Array<{
    id: number;
    monthlyEmi: number;
    remainingMonths: number;
  }>;
}

export const SharedCashflowTimelineEngine = {
  /**
   * Simulates all goals across a shared monthly timeline.
   * Stops contributions once a goal is fully funded and cascades capacity to subsequent goals.
   */
  simulateTimeline(
    goals: GoalItem[],
    profile: HouseholdFinancialProfile,
    options: TimelineSimulationOptions = {}
  ): SharedTimelineResult {
    const startStr = options.startDate || BASE_SIMULATION_DATE;
    const startYM = startStr.slice(0, 7);

    // Determine simulation horizon based on latest goal deadline
    let latestMonthsNeeded = 36;
    for (const g of goals) {
      if (!g.archived) {
        const m = GoalFeasibilityEngine.calculateMonthsRemaining(g.targetDate, startStr);
        if (m > latestMonthsNeeded) {
          latestMonthsNeeded = Math.min(m + 6, 120); // Cap at 10 years for performance
        }
      }
    }
    const horizon = Math.min(Math.max(options.maxMonths || latestMonthsNeeded, 24), 120);

    // Track simulated running goal balances
    const runningBalances: Record<number, number> = {};
    goals.forEach((g) => {
      runningBalances[g.id] = g.currentAmount || 0;
    });

    let runningCashReserve = profile.existingCashBalance;

    const timeline: MonthlyTimelinePoint[] = [];
    let totalRequiredFunding = 0;
    let totalAllocatedFunding = 0;
    let peakMonthlyDeficit = 0;
    let peakDeficitMonth = '';
    let conflictMonthsCount = 0;

    for (let mIdx = 0; mIdx < horizon; mIdx++) {
      const yearMonth = GoalFeasibilityEngine.addMonthsToYearMonth(startYM, mIdx);
      const monthLabel = GoalFeasibilityEngine.formatYearMonthLabel(yearMonth);

      // 1. Dynamic Income calculation with scheduled changes
      let monthIncome = profile.monthlyNetIncome;
      if (profile.scheduledIncomeChanges) {
        for (const change of profile.scheduledIncomeChanges) {
          if (yearMonth >= change.effectiveMonth) {
            monthIncome += change.deltaAmount;
          }
        }
      }

      // 2. Active EMI calculation with expiry
      let monthEmi = profile.activeEmiMonthlyTotal;
      if (options.activeEmis && options.activeEmis.length > 0) {
        monthEmi = options.activeEmis.reduce((sum, emi) => {
          return mIdx < emi.remainingMonths ? sum + emi.monthlyEmi : sum;
        }, 0);
      }

      // 3. One-time shocks in this month
      let monthShocks = 0;
      if (profile.oneTimeFinancialShocks) {
        for (const shock of profile.oneTimeFinancialShocks) {
          if (shock.month === yearMonth) {
            monthShocks += shock.amount;
          }
        }
      }

      const essentialExp = profile.essentialMonthlyExpenses;
      const discretionaryExp = profile.discretionaryMonthlyExpenses;
      const recurringBills = profile.recurringBillsTotal;

      // Available flow capacity for goals this month
      const outflows = essentialExp + discretionaryExp + monthEmi + recurringBills + monthShocks;
      const availableCapacity = Math.max(monthIncome - outflows, 0);

      // Active goals that still need funding
      const activeGoalsThisMonth: GoalItem[] = [];
      const goalDemands: Array<{
        goal: GoalItem;
        required: number;
        monthsLeft: number;
      }> = [];

      for (const goal of goals) {
        if (goal.archived) continue;
        const currentBal = runningBalances[goal.id] ?? 0;
        if (currentBal >= goal.targetAmount) continue; // Already fully funded

        // Check if paused
        if (goal.pauseStartMonth && goal.pauseEndMonth) {
          if (yearMonth >= goal.pauseStartMonth && yearMonth <= goal.pauseEndMonth) {
            continue; // Paused in this window
          }
        }

        const monthsRemaining = Math.max(
          GoalFeasibilityEngine.calculateMonthsRemaining(goal.targetDate, `${yearMonth}-01`),
          1
        );

        const needed = Math.max(goal.targetAmount - currentBal, 0);
        const requiredThisMonth = Math.round(needed / monthsRemaining);

        activeGoalsThisMonth.push(goal);
        goalDemands.push({
          goal,
          required: requiredThisMonth,
          monthsLeft: monthsRemaining
        });
      }

      // Priority-aware Allocation Policy
      // Sort: Priority ascending (1 Critical -> 4 Low), then earliest deadline, then ID
      goalDemands.sort((a, b) => {
        if (a.goal.priority !== b.goal.priority) {
          return a.goal.priority - b.goal.priority;
        }
        if (a.monthsLeft !== b.monthsLeft) {
          return a.monthsLeft - b.monthsLeft;
        }
        return a.goal.id - b.goal.id;
      });

      let remainingCapacityToDistribute = availableCapacity;
      let monthRequiredTotal = 0;
      let monthAllocatedTotal = 0;
      const allocatedShares: MonthlyAllocatedShare[] = [];
      const conflictGoalIds: number[] = [];

      for (const demand of goalDemands) {
        const { goal, required } = demand;
        monthRequiredTotal += required;

        const maxCanReceive = Math.max(goal.targetAmount - (runningBalances[goal.id] || 0), 0);
        const allocation = Math.min(required, remainingCapacityToDistribute, maxCanReceive);

        remainingCapacityToDistribute -= allocation;
        monthAllocatedTotal += allocation;

        const newClosing = (runningBalances[goal.id] || 0) + allocation;
        runningBalances[goal.id] = newClosing;

        const shortfall = Math.max(required - allocation, 0);
        if (shortfall > 0) {
          conflictGoalIds.push(goal.id);
        }

        allocatedShares.push({
          goalId: goal.id,
          goalName: goal.name,
          requiredContribution: required,
          allocatedContribution: allocation,
          shortfall,
          closingBalance: newClosing,
          isFullyFunded: newClosing >= goal.targetAmount
        });
      }

      totalRequiredFunding += monthRequiredTotal;
      totalAllocatedFunding += monthAllocatedTotal;

      const monthlyDeficit = Math.max(monthRequiredTotal - availableCapacity, 0);
      const unallocatedSurplus = Math.max(remainingCapacityToDistribute, 0);
      const hasConflict = monthlyDeficit > 0 || conflictGoalIds.length > 0;

      if (hasConflict) {
        conflictMonthsCount++;
        if (monthlyDeficit > peakMonthlyDeficit) {
          peakMonthlyDeficit = monthlyDeficit;
          peakDeficitMonth = monthLabel;
        }
      }

      // Update cash reserve with any unallocated surplus
      runningCashReserve += unallocatedSurplus;

      timeline.push({
        monthIndex: mIdx,
        yearMonth,
        monthLabel,
        income: monthIncome,
        essentialExpenses: essentialExp,
        discretionaryExpenses: discretionaryExp,
        emiTotal: monthEmi,
        billsTotal: recurringBills,
        oneTimeShocks: monthShocks,
        availableCapacity,
        requiredGoalFunding: monthRequiredTotal,
        allocatedGoalFunding: monthAllocatedTotal,
        unallocatedSurplus,
        monthlyDeficit,
        goalAllocations: allocatedShares,
        activeGoalIds: activeGoalsThisMonth.map((g) => g.id),
        conflictGoalIds,
        hasConflict,
        closingReserveBuffer: runningCashReserve
      });
    }

    return {
      horizonMonths: horizon,
      startMonth: timeline[0]?.monthLabel || '',
      endMonth: timeline[timeline.length - 1]?.monthLabel || '',
      timeline,
      totalRequiredFunding,
      totalAllocatedFunding,
      peakDeficitMonth: peakDeficitMonth || 'None',
      peakMonthlyDeficit,
      conflictMonthsCount
    };
  }
};
