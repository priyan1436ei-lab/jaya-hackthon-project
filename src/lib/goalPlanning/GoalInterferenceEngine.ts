import {
  GoalItem,
  HouseholdFinancialProfile,
  InterferenceNode,
  InterferenceEdge,
  InterferenceMatrixResult,
  ConflictSeverity
} from '../../types/goalPlanning';
import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from './GoalFeasibilityEngine';
import { SharedCashflowTimelineEngine } from './SharedCashflowTimelineEngine';
import { FinancialCapacityEngine } from './FinancialCapacityEngine';

export const GoalInterferenceEngine = {
  /**
   * Computes the Goal Interference Graph and Matrix using counterfactual comparison.
   * Measures how much removing or reducing Goal A's demand improves Goal B's funding.
   */
  analyzeInterference(
    goals: GoalItem[],
    profile: HouseholdFinancialProfile,
    baseDateStr: string = BASE_SIMULATION_DATE
  ): InterferenceMatrixResult {
    const activeGoals = goals.filter((g) => !g.archived && g.currentAmount < g.targetAmount);

    // Compute baseline feasibility for each goal
    const baselineFeasibilities = activeGoals.map((g) =>
      GoalFeasibilityEngine.calculateGoalFeasibility(g, baseDateStr)
    );

    const capacity = FinancialCapacityEngine.calculateCapacity(profile, goals);
    const availableCap = Math.max(capacity.availableGoalCapacity, 0);

    // Baseline shared simulation
    const baselineSim = SharedCashflowTimelineEngine.simulateTimeline(activeGoals, profile, {
      startDate: baseDateStr,
      priorityAwareAllocation: true
    });

    const nodes: InterferenceNode[] = [];
    const edges: InterferenceEdge[] = [];
    const matrix: Record<number, Record<number, number>> = {};
    const incomingScores: Record<number, number> = {};
    const outgoingScores: Record<number, number> = {};

    activeGoals.forEach((g) => {
      matrix[g.id] = {};
      incomingScores[g.id] = 0;
      outgoingScores[g.id] = 0;
    });

    // Pairwise counterfactual evaluation
    for (let i = 0; i < activeGoals.length; i++) {
      const goalA = activeGoals[i];
      const feasA = baselineFeasibilities.find((f) => f.goalId === goalA.id)!;

      for (let j = 0; j < activeGoals.length; j++) {
        if (i === j) {
          matrix[goalA.id][goalA.id] = 0;
          continue;
        }

        const goalB = activeGoals[j];
        const feasB = baselineFeasibilities.find((f) => f.goalId === goalB.id)!;

        // Counterfactual simulation: Remove Goal A's demand and see how Goal B benefits
        const goalsWithoutA = activeGoals.filter((g) => g.id !== goalA.id);
        const simWithoutA = SharedCashflowTimelineEngine.simulateTimeline(goalsWithoutA, profile, {
          startDate: baseDateStr,
          priorityAwareAllocation: true
        });

        // Measure allocated funding to Goal B in baseline vs counterfactual
        let totalAllocatedB_baseline = 0;
        let totalAllocatedB_withoutA = 0;

        const maxMonthsToCheck = Math.max(feasB.monthsRemaining, 12);

        baselineSim.timeline.slice(0, maxMonthsToCheck).forEach((month) => {
          const alloc = month.goalAllocations.find((a) => a.goalId === goalB.id);
          if (alloc) totalAllocatedB_baseline += alloc.allocatedContribution;
        });

        simWithoutA.timeline.slice(0, maxMonthsToCheck).forEach((month) => {
          const alloc = month.goalAllocations.find((a) => a.goalId === goalB.id);
          if (alloc) totalAllocatedB_withoutA += alloc.allocatedContribution;
        });

        const fundingGainForB = Math.max(totalAllocatedB_withoutA - totalAllocatedB_baseline, 0);

        // Timeline overlap: Count overlapping months between goal A and goal B funding periods
        const overlapMonths = Math.min(feasA.monthsRemaining, feasB.monthsRemaining);

        // Compute interference score based on:
        // 1) Relative funding gain if A is removed
        // 2) Goal A's consumption share of capacity
        // 3) Priority dynamics (Higher priority A crowds out lower priority B)
        const monthlyDemandA = feasA.requiredMonthlyContribution;
        const capacityShareA = availableCap > 0 ? Math.min(monthlyDemandA / availableCap, 1) : 1;

        let rawScore = 0;
        const monthlyShortfallB = feasB.monthlyShortfall;

        if (monthlyShortfallB > 0 && availableCap > 0) {
          const recoveredMonthly = overlapMonths > 0 ? Math.round(fundingGainForB / overlapMonths) : 0;
          const recoveryRatio = Math.min(recoveredMonthly / monthlyShortfallB, 1);
          rawScore = recoveryRatio * 60 + capacityShareA * 40;
        } else if (availableCap <= 0) {
          rawScore = Math.min(50 + capacityShareA * 50, 95);
        } else {
          // Both currently funded, but overlap creates competition buffer reduction
          const bufferStress = Math.min((monthlyDemandA + feasB.requiredMonthlyContribution) / availableCap, 1.5);
          rawScore = bufferStress > 0.85 ? Math.round((bufferStress - 0.85) * 100) : 15;
        }

        // Adjust for priority dominance:
        // If A is higher priority than B, A pushes B down forcefully
        if (goalA.priority < goalB.priority) {
          rawScore = Math.min(rawScore * 1.25, 100);
        } else if (goalA.priority > goalB.priority) {
          // If A is lower priority than B, under priority-aware allocation A only interferes if B is flexible
          rawScore = Math.round(rawScore * 0.65);
        }

        const interferenceScore = Math.min(Math.max(Math.round(rawScore), 5), 98);
        matrix[goalA.id][goalB.id] = interferenceScore;

        outgoingScores[goalA.id] = Math.max(outgoingScores[goalA.id], interferenceScore);
        incomingScores[goalB.id] = Math.max(incomingScores[goalB.id], interferenceScore);

        const severity: ConflictSeverity =
          interferenceScore >= 76
            ? 'CRITICAL'
            : interferenceScore >= 51
            ? 'HIGH'
            : interferenceScore >= 26
            ? 'MEDIUM'
            : 'LOW';

        const monthlyImpact = overlapMonths > 0
          ? Math.min(Math.round(fundingGainForB / overlapMonths), feasA.requiredMonthlyContribution)
          : Math.round(feasA.requiredMonthlyContribution * 0.3);

        const reason =
          interferenceScore >= 51
            ? `"${goalA.name}" (Req: ₹${feasA.requiredMonthlyContribution.toLocaleString('en-IN')}/mo) heavily crowds out "${goalB.name}" during their ${overlapMonths}-month overlapping funding period, contributing to a ₹${monthlyImpact.toLocaleString('en-IN')}/mo shortfall for "${goalB.name}".`
            : `"${goalA.name}" competes moderately with "${goalB.name}" for household surplus across ${overlapMonths} overlapping months.`;

        edges.push({
          sourceGoalId: goalA.id,
          sourceGoalName: goalA.name,
          targetGoalId: goalB.id,
          targetGoalName: goalB.name,
          interferenceScore,
          severity,
          monthlyImpact,
          overlappingConflictMonths: overlapMonths,
          reason
        });
      }
    }

    // Build node data
    activeGoals.forEach((goal) => {
      const feas = baselineFeasibilities.find((f) => f.goalId === goal.id)!;
      nodes.push({
        goalId: goal.id,
        goalName: goal.name,
        emoji: goal.emoji,
        category: goal.category,
        priorityLabel: goal.priorityLabel,
        targetAmount: goal.targetAmount,
        requiredMonthly: feas.requiredMonthlyContribution,
        allocatedMonthly: goal.monthlyAllocation || 0,
        feasibilityScore: feas.feasibilityScore,
        incomingInterferenceScore: incomingScores[goal.id] || 0,
        outgoingInterferenceScore: outgoingScores[goal.id] || 0,
        status: feas.status
      });
    });

    // Sort edges by interference descending
    edges.sort((a, b) => b.interferenceScore - a.interferenceScore);

    const highestInterferenceEdge = edges[0] || null;
    const avgScore = edges.length > 0 ? edges.reduce((sum, e) => sum + e.interferenceScore, 0) / edges.length : 0;
    const overallCompetitionDensity = Math.round(avgScore);

    return {
      nodes,
      edges,
      matrix,
      highestInterferenceEdge,
      overallCompetitionDensity
    };
  }
};
