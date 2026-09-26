import {
  HouseholdFinancialProfile,
  FinancialCapacityResult,
  GoalItem
} from '../../types/goalPlanning';

export const FinancialCapacityEngine = {
  /**
   * Calculates the household goal funding capacity for a specific monthly snapshot.
   * Enforces that stocks (cash balance) and flows (monthly income) are separated.
   * If capacity is negative, preserves the household deficit honestly.
   */
  calculateCapacity(
    profile: HouseholdFinancialProfile,
    goals: GoalItem[],
    options: {
      excludeDiscretionary?: boolean;
      discretionaryReductionRatio?: number; // 0 to 1
    } = {}
  ): FinancialCapacityResult {
    const totalMonthlyIncome = Math.max(profile.monthlyNetIncome, 0);
    const essentialExpenses = Math.max(profile.essentialMonthlyExpenses, 0);

    const discretionaryReduction = options.discretionaryReductionRatio ?? 0;
    const baseDiscretionary = Math.max(profile.discretionaryMonthlyExpenses, 0);
    const discretionaryExpenses = options.excludeDiscretionary
      ? 0
      : Math.round(baseDiscretionary * (1 - discretionaryReduction));

    const emiCommitments = Math.max(profile.activeEmiMonthlyTotal, 0);
    const recurringBills = Math.max(profile.recurringBillsTotal, 0);

    // Goal Capacity = Income - (Essential + Discretionary + EMIs + Recurring Bills)
    const totalOutflows = essentialExpenses + discretionaryExpenses + emiCommitments + recurringBills;
    const availableGoalCapacity = totalMonthlyIncome - totalOutflows;

    // Sum of active goal allocations (excluding completed or archived goals)
    const activeGoals = goals.filter((g) => !g.archived && g.currentAmount < g.targetAmount);
    const currentGoalAllocations = activeGoals.reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);

    const remainingCapacity = availableGoalCapacity - currentGoalAllocations;
    const isDeficit = availableGoalCapacity < currentGoalAllocations || availableGoalCapacity < 0;
    const deficitAmount = isDeficit
      ? availableGoalCapacity < 0
        ? Math.abs(availableGoalCapacity) + currentGoalAllocations
        : currentGoalAllocations - availableGoalCapacity
      : 0;

    return {
      totalMonthlyIncome,
      essentialExpenses,
      discretionaryExpenses,
      emiCommitments,
      recurringBills,
      mandatoryReserveContribution: 0,
      availableGoalCapacity,
      currentGoalAllocations,
      remainingCapacity,
      isDeficit,
      deficitAmount,

      // Phase 3 exact specification aliases
      availableCapacity: availableGoalCapacity,
      income: totalMonthlyIncome,
      expenses: essentialExpenses + discretionaryExpenses,
      emi: emiCommitments,
      bills: recurringBills,
      emergencyAllocation: 0,
      existingGoalContributions: currentGoalAllocations,
      remainingGoalCapacity: remainingCapacity
    };
  }
};
