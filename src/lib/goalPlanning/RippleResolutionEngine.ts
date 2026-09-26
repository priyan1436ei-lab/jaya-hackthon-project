import {
  GoalItem,
  HouseholdFinancialProfile,
  ResolutionScenario,
  ResolutionComparisonResult,
  ResolutionAction
} from '../../types/goalPlanning';
import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from './GoalFeasibilityEngine';
import { FinancialCapacityEngine } from './FinancialCapacityEngine';
import { GoalConflictEngine } from './GoalConflictEngine';
import { FinancialEngine } from '../financialEngine';

export const RippleResolutionEngine = {
  /**
   * Generates multiple distinct resolution scenarios to eliminate or minimize funding conflicts.
   * Respects hard deadlines, locked targets, and minimum acceptable targets.
   */
  generateResolutions(
    goals: GoalItem[],
    profile: HouseholdFinancialProfile,
    baseDateStr: string = BASE_SIMULATION_DATE
  ): ResolutionComparisonResult {
    const activeGoals = goals.filter((g) => !g.archived && g.currentAmount < g.targetAmount);
    const capacity = FinancialCapacityEngine.calculateCapacity(profile, goals);
    const baselineConflicts = GoalConflictEngine.detectConflicts(goals, profile, baseDateStr);

    const scenarios: ResolutionScenario[] = [];

    // Identify flexible vs locked goals
    const flexibleGoals = activeGoals.filter((g) => !g.hardDeadline && (g.deadlineFlexibilityMonths || 0) > 0);
    const reducibleGoals = activeGoals.filter((g) => g.canReduceTarget && !g.targetAmountLocked && g.minimumAcceptableAmount < g.targetAmount);
    const pausableGoals = activeGoals.filter((g) => g.canPause && g.priority >= 3);
    const criticalGoals = activeGoals.filter((g) => g.priority === 1 || g.hardDeadline);

    // -------------------------------------------------------------
    // SCENARIO 1: Extend Flexible Deadlines (Timeline Staggering)
    // -------------------------------------------------------------
    if (flexibleGoals.length > 0) {
      const actions: ResolutionAction[] = [];
      const delayedNames: string[] = [];

      const adjustedGoals = activeGoals.map((g) => {
        if (!g.hardDeadline && (g.deadlineFlexibilityMonths || 0) > 0) {
          const extension = Math.min(g.deadlineFlexibilityMonths || 12, 12);
          const currentYM = GoalFeasibilityEngine.parseTargetYearMonth(g.targetDate);
          const newYM = GoalFeasibilityEngine.addMonthsToYearMonth(currentYM, extension);
          const newLabel = GoalFeasibilityEngine.formatYearMonthLabel(newYM);

          actions.push({
            type: 'DELAY_GOAL',
            goalId: g.id,
            goalName: g.name,
            description: `Extend "${g.name}" deadline by ${extension} months (${g.targetDate} → ${newLabel})`,
            magnitude: extension,
            unit: 'months'
          });
          delayedNames.push(g.name);

          return { ...g, targetDate: newLabel };
        }
        return g;
      });

      const scenario = this.evaluateScenario(
        'scen_extend_deadlines',
        'Timeline Relaxation & Deadline Staggering',
        'Postpones flexible goals within permitted leeway, reducing immediate monthly pressure.',
        adjustedGoals,
        profile,
        baseDateStr,
        actions,
        criticalGoals.map((g) => g.name),
        delayedNames,
        0
      );
      scenarios.push(scenario);
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Right-Size Flexible Targets (Target Trimming)
    // -------------------------------------------------------------
    if (reducibleGoals.length > 0) {
      const actions: ResolutionAction[] = [];
      const adjustedNames: string[] = [];

      const adjustedGoals = activeGoals.map((g) => {
        if (g.canReduceTarget && !g.targetAmountLocked && g.minimumAcceptableAmount < g.targetAmount) {
          const trimAmount = Math.round((g.targetAmount - g.minimumAcceptableAmount) * 0.7);
          const newTarget = Math.max(g.targetAmount - trimAmount, g.minimumAcceptableAmount);

          actions.push({
            type: 'REDUCE_TARGET',
            goalId: g.id,
            goalName: g.name,
            description: `Trim "${g.name}" target from ${FinancialEngine.formatINR(g.targetAmount)} to ${FinancialEngine.formatINR(newTarget)} (above minimum floor)`,
            magnitude: trimAmount,
            unit: '₹'
          });
          adjustedNames.push(g.name);

          return { ...g, targetAmount: newTarget };
        }
        return g;
      });

      const scenario = this.evaluateScenario(
        'scen_target_trimming',
        'Pragmatic Target Right-Sizing',
        'Lowers discretionary targets to acceptable minimums while leaving timelines intact.',
        adjustedGoals,
        profile,
        baseDateStr,
        actions,
        criticalGoals.map((g) => g.name),
        adjustedNames,
        0
      );
      scenarios.push(scenario);
    }

    // -------------------------------------------------------------
    // SCENARIO 3: Budget Optimization (Discretionary Expenditure Cap)
    // -------------------------------------------------------------
    if (profile.discretionaryMonthlyExpenses > 5000) {
      const reduction = Math.min(Math.round(profile.discretionaryMonthlyExpenses * 0.25), 6000);
      const optimizedProfile: HouseholdFinancialProfile = {
        ...profile,
        discretionaryMonthlyExpenses: profile.discretionaryMonthlyExpenses - reduction
      };

      const actions: ResolutionAction[] = [
        {
          type: 'REDUCE_DISCRETIONARY',
          description: `Trim discretionary shopping & dining by ${FinancialEngine.formatINR(reduction)}/mo to expand goal flow`,
          magnitude: reduction,
          unit: '₹/mo'
        }
      ];

      const scenario = this.evaluateScenario(
        'scen_discretionary_reduction',
        'Discretionary Spending Discipline',
        'Consolidates household surplus by curbing non-essential lifestyle spend.',
        activeGoals,
        optimizedProfile,
        baseDateStr,
        actions,
        activeGoals.map((g) => g.name),
        [],
        reduction
      );
      scenarios.push(scenario);
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Pause Low-Priority Goals (6-Month Strategic Sabbatical)
    // -------------------------------------------------------------
    if (pausableGoals.length > 0) {
      const actions: ResolutionAction[] = [];
      const pausedNames: string[] = [];

      const adjustedGoals = activeGoals.map((g) => {
        if (g.canPause && g.priority >= 3) {
          const startYM = baseDateStr.slice(0, 7);
          const endYM = GoalFeasibilityEngine.addMonthsToYearMonth(startYM, 6);

          actions.push({
            type: 'PAUSE_GOAL',
            goalId: g.id,
            goalName: g.name,
            description: `Pause "${g.name}" contributions for 6 months (${GoalFeasibilityEngine.formatYearMonthLabel(startYM)} - ${GoalFeasibilityEngine.formatYearMonthLabel(endYM)})`,
            magnitude: 6,
            unit: 'months'
          });
          pausedNames.push(g.name);

          return { ...g, pauseStartMonth: startYM, pauseEndMonth: endYM };
        }
        return g;
      });

      const scenario = this.evaluateScenario(
        'scen_pause_low_priority',
        'Temporary Low-Priority Milestone Pause',
        'Pauses optional lifestyle goals for 6 months, liberating capacity for high-priority commitments.',
        adjustedGoals,
        profile,
        baseDateStr,
        actions,
        criticalGoals.map((g) => g.name),
        pausedNames,
        0
      );
      scenarios.push(scenario);
    }

    // -------------------------------------------------------------
    // SCENARIO 5: Balanced Multi-Lever Hybrid Plan
    // -------------------------------------------------------------
    {
      const actions: ResolutionAction[] = [];
      const delayedOrAdjusted: string[] = [];

      // Combine mild deadline extension on flexible + mild discretionary trim
      const mildTrim = Math.min(Math.round(profile.discretionaryMonthlyExpenses * 0.15), 3500);
      if (mildTrim > 0) {
        actions.push({
          type: 'REDUCE_DISCRETIONARY',
          description: `Moderate discretionary trim of ${FinancialEngine.formatINR(mildTrim)}/month`,
          magnitude: mildTrim,
          unit: '₹/mo'
        });
      }

      const hybridGoals = activeGoals.map((g) => {
        if (!g.hardDeadline && g.priority >= 3 && (g.deadlineFlexibilityMonths || 0) >= 6) {
          const currentYM = GoalFeasibilityEngine.parseTargetYearMonth(g.targetDate);
          const newYM = GoalFeasibilityEngine.addMonthsToYearMonth(currentYM, 6);
          const newLabel = GoalFeasibilityEngine.formatYearMonthLabel(newYM);

          actions.push({
            type: 'DELAY_GOAL',
            goalId: g.id,
            goalName: g.name,
            description: `Minor 6-month extension for "${g.name}" (${g.targetDate} → ${newLabel})`,
            magnitude: 6,
            unit: 'months'
          });
          delayedOrAdjusted.push(g.name);
          return { ...g, targetDate: newLabel };
        }
        return g;
      });

      const hybridProfile: HouseholdFinancialProfile = {
        ...profile,
        discretionaryMonthlyExpenses: profile.discretionaryMonthlyExpenses - mildTrim
      };

      const scenario = this.evaluateScenario(
        'scen_balanced_hybrid',
        'Balanced Multi-Lever Hybrid',
        'Blends a gentle 6-month timeline extension on optional goals with a modest spending trim.',
        hybridGoals,
        hybridProfile,
        baseDateStr,
        actions,
        criticalGoals.map((g) => g.name),
        delayedOrAdjusted,
        mildTrim
      );
      scenarios.push(scenario);
    }

    // Sort scenarios:
    // Feasible first (highest score), then infeasible (highest score)
    scenarios.sort((a, b) => {
      if (a.isFeasible && !b.isFeasible) return -1;
      if (!a.isFeasible && b.isFeasible) return 1;
      return b.overallFeasibilityScore - a.overallFeasibilityScore;
    });

    // Assign ranking
    scenarios.forEach((s, idx) => {
      s.recommendationRank = idx + 1;
    });

    const allInfeasible = scenarios.every((s) => !s.isFeasible);
    const recommendedScenarioId = allInfeasible ? null : scenarios[0]?.id || null;
    const bestPartialScenarioId = allInfeasible ? scenarios[0]?.id || null : null;

    const infeasibilityReason = allInfeasible
      ? 'No fully feasible plan exists under current fixed income and locked deadlines. Increasing household income or relaxing hard deadlines is required.'
      : undefined;

    return {
      scenarios,
      recommendedScenarioId,
      allInfeasible,
      bestPartialScenarioId,
      infeasibilityReason
    };
  },

  /**
   * Evaluates a candidate scenario deterministically through the complete feasibility engine.
   */
  evaluateScenario(
    id: string,
    title: string,
    tagline: string,
    candidateGoals: GoalItem[],
    candidateProfile: HouseholdFinancialProfile,
    baseDateStr: string,
    actions: ResolutionAction[],
    goalsProtected: string[],
    goalsDelayedOrAdjusted: string[],
    monthlyBudgetDelta: number
  ): ResolutionScenario {
    const capacityRes = FinancialCapacityEngine.calculateCapacity(candidateProfile, candidateGoals);
    const conflicts = GoalConflictEngine.detectConflicts(candidateGoals, candidateProfile, baseDateStr);

    const feasibilities = candidateGoals.map((g) =>
      GoalFeasibilityEngine.calculateGoalFeasibility(g, baseDateStr)
    );

    const totalRequired = feasibilities.reduce((sum, f) => sum + f.requiredMonthlyContribution, 0);
    const monthlyDeficitRemaining = Math.max(totalRequired - Math.max(capacityRes.availableGoalCapacity, 0), 0);

    // Hard constraints check:
    // 1) All critical / locked goals must have zero monthlyShortfall
    // 2) Emergency buffer must remain >= 3 months essential expenses
    // 3) Monthly deficit must be zero
    let hardConstraintsPassed = true;

    for (const g of candidateGoals) {
      if (g.hardDeadline || g.priority === 1) {
        const f = feasibilities.find((item) => item.goalId === g.id);
        if (f && f.monthlyShortfall > 0) {
          hardConstraintsPassed = false;
          break;
        }
      }
    }

    const minBuffer = candidateProfile.essentialMonthlyExpenses * 3;
    if (candidateProfile.existingCashBalance < minBuffer) {
      hardConstraintsPassed = false;
    }

    if (monthlyDeficitRemaining > 0) {
      hardConstraintsPassed = false;
    }

    const avgScore = feasibilities.reduce((sum, f) => sum + f.feasibilityScore, 0) / Math.max(feasibilities.length, 1);
    const overallFeasibilityScore = hardConstraintsPassed
      ? Math.round(avgScore)
      : Math.min(Math.round(avgScore * 0.6), 48);

    const remainingShortfallTotal = feasibilities.reduce((sum, f) => sum + (f.monthlyShortfall * f.monthsRemaining), 0);

    const tradeOffSummary = actions.length > 0
      ? actions.map((a) => a.description).join('; ')
      : 'Maintains current plan configuration without adjustments.';

    const whyThisWorks = hardConstraintsPassed
      ? `Eliminates monthly deficit and guarantees full funding for ${goalsProtected.join(', ')} while maintaining adequate emergency liquidity.`
      : `Partially reduces monthly gap by ${FinancialEngine.formatINR(capacityRes.availableGoalCapacity)}, but leaves ₹${FinancialEngine.formatINR(monthlyDeficitRemaining)}/mo unfunded under strict constraints.`;

    return {
      id,
      title,
      tagline,
      isFeasible: hardConstraintsPassed,
      hardConstraintsPassed,
      overallFeasibilityScore,
      monthlyDeficitRemaining,
      remainingShortfallTotal,
      actions,
      goalsProtected,
      goalsDelayedOrAdjusted,
      monthlyBudgetDelta,
      recommendationRank: 1,
      tradeOffSummary,
      whyThisWorks,
      adjustedGoals: candidateGoals,
      householdProfileChanges: candidateProfile
    };
  }
};
