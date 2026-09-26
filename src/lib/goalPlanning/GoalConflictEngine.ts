import {
  GoalItem,
  HouseholdFinancialProfile,
  GoalConflictItem,
  ConflictSeverity
} from '../../types/goalPlanning';
import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from './GoalFeasibilityEngine';
import { FinancialCapacityEngine } from './FinancialCapacityEngine';
import { SharedCashflowTimelineEngine } from './SharedCashflowTimelineEngine';

export const GoalConflictEngine = {
  /**
   * Scans household goals and monthly timeline to identify all active and projected financial conflicts.
   */
  detectConflicts(
    goals: GoalItem[],
    profile: HouseholdFinancialProfile,
    baseDateStr: string = BASE_SIMULATION_DATE
  ): GoalConflictItem[] {
    const conflicts: GoalConflictItem[] = [];

    // 1. Capacity Deficit Check
    const capacity = FinancialCapacityEngine.calculateCapacity(profile, goals);
    const activeGoals = goals.filter((g) => !g.archived && g.currentAmount < g.targetAmount);

    const feasibilities = activeGoals.map((g) =>
      GoalFeasibilityEngine.calculateGoalFeasibility(g, baseDateStr)
    );

    const totalRequiredMonthly = feasibilities.reduce((sum, f) => sum + f.requiredMonthlyContribution, 0);

    if (totalRequiredMonthly > capacity.availableGoalCapacity) {
      const deficit = totalRequiredMonthly - Math.max(capacity.availableGoalCapacity, 0);
      const affectedGoals = activeGoals.filter((g) => (g.monthlyAllocation || 0) < (feasibilities.find(f => f.goalId === g.id)?.requiredMonthlyContribution || 0));

      const ratio = deficit / Math.max(capacity.availableGoalCapacity, 1);
      const severity: ConflictSeverity = ratio > 0.5 ? 'CRITICAL' : ratio > 0.25 ? 'HIGH' : 'MEDIUM';
      const severityScore = Math.min(Math.round(ratio * 100), 98);

      conflicts.push({
        id: 'conflict_capacity_deficit',
        type: 'CAPACITY_DEFICIT',
        conflictType: 'RESOURCE_CONFLICT',
        severity,
        severityScore,
        title: 'Monthly Goal Demand Exceeds Available Flow Capacity',
        reason: `Total required monthly contribution across ${activeGoals.length} goals is ₹${totalRequiredMonthly.toLocaleString('en-IN')}, which exceeds net household capacity of ₹${Math.max(capacity.availableGoalCapacity, 0).toLocaleString('en-IN')}/mo by ₹${deficit.toLocaleString('en-IN')}/mo.`,
        affectedGoalIds: (affectedGoals.length > 0 ? affectedGoals : activeGoals).map((g) => g.id),
        affectedGoalNames: (affectedGoals.length > 0 ? affectedGoals : activeGoals).map((g) => g.name),
        affectedPeriod: 'Ongoing Monthly Flow',
        monthlyShortfall: deficit,
        monthlyImpact: deficit,
        finalShortfall: deficit * 12, // Distinct estimate
        relevantCalculation: `Total Demand (₹${totalRequiredMonthly.toLocaleString('en-IN')}) - Capacity (₹${Math.max(capacity.availableGoalCapacity, 0).toLocaleString('en-IN')}) = ₹${deficit.toLocaleString('en-IN')}`,
        suggestedActionTypes: [
          'Delay flexible goal deadlines',
          'Reduce optional goal targets',
          'Pause low-priority goals',
          'Reduce discretionary expenses'
        ],
        goalA: activeGoals[0]?.name,
        goalB: activeGoals[1]?.name,
        affectedMonths: 'Continuous'
      });
    }

    // 2. Locked Goal Infeasibility Check
    // If a goal is marked hardDeadline or targetAmountLocked, but current allocation falls short
    activeGoals.forEach((goal) => {
      const feas = feasibilities.find((f) => f.goalId === goal.id);
      if (feas && goal.hardDeadline && feas.monthlyShortfall > 0) {
        const severity: ConflictSeverity = goal.priority === 1 ? 'CRITICAL' : 'HIGH';
        conflicts.push({
          id: `conflict_locked_${goal.id}`,
          type: 'LOCKED_GOAL_INFEASIBLE',
          severity,
          severityScore: goal.priority === 1 ? 95 : 80,
          title: `Locked Goal Infeasible: ${goal.name}`,
          reason: `"${goal.name}" has a non-negotiable hard deadline of ${goal.targetDate} and requires ₹${feas.requiredMonthlyContribution.toLocaleString('en-IN')}/mo, but current funding allocation provides only ₹${(goal.monthlyAllocation || 0).toLocaleString('en-IN')}/mo (shortfall of ₹${feas.monthlyShortfall.toLocaleString('en-IN')}/mo).`,
          affectedGoalIds: [goal.id],
          affectedGoalNames: [goal.name],
          affectedPeriod: goal.targetDate,
          monthlyShortfall: feas.monthlyShortfall,
          finalShortfall: feas.monthlyShortfall * feas.monthsRemaining,
          relevantCalculation: `Target: ₹${goal.targetAmount.toLocaleString('en-IN')}, Remaining: ₹${feas.remainingAmount.toLocaleString('en-IN')} across ${feas.monthsRemaining} months`,
          suggestedActionTypes: [
            'Reallocate capacity from lower-priority flexible goals',
            'Protect this critical goal in Resolution Lab',
            'Channel unallocated cash reserve'
          ]
        });
      }
    });

    // 3. Deadline Clustering / Overlap Check (Phase 8: High Goal Concentration)
    const activeGoalDeadlines = activeGoals.map((g) => ({
      goal: g,
      ym: GoalFeasibilityEngine.parseTargetYearMonth(g.targetDate),
      months: GoalFeasibilityEngine.calculateMonthsRemaining(g.targetDate, baseDateStr)
    })).sort((a, b) => a.months - b.months);

    for (let i = 0; i < activeGoalDeadlines.length; i++) {
      const cluster = [activeGoalDeadlines[i]];
      for (let j = i + 1; j < activeGoalDeadlines.length; j++) {
        if (activeGoalDeadlines[j].months - activeGoalDeadlines[i].months <= 8) {
          cluster.push(activeGoalDeadlines[j]);
        }
      }
      if (cluster.length >= 2) {
        const totalClusterTarget = cluster.reduce((sum, item) => sum + (item.goal.targetAmount - item.goal.currentAmount), 0);
        if (totalClusterTarget >= 500000 && !conflicts.some((c) => c.type === 'DEADLINE_OVERLAP')) {
          conflicts.push({
            id: `conflict_cluster_${cluster[0].goal.id}`,
            type: 'DEADLINE_OVERLAP',
            severity: 'HIGH',
            severityScore: 78,
            title: 'High Goal Concentration: Multiple Large Deadlines in Narrow Window',
            reason: `${cluster.length} major goals (${cluster.map(c => c.goal.name).join(', ')}) require funding within an 8-month window (${cluster[0].goal.targetDate} – ${cluster[cluster.length - 1].goal.targetDate}), creating intense timeline pressure.`,
            affectedGoalIds: cluster.map((c) => c.goal.id),
            affectedGoalNames: cluster.map((c) => c.goal.name),
            affectedPeriod: `${cluster[0].goal.targetDate} – ${cluster[cluster.length - 1].goal.targetDate}`,
            monthlyShortfall: 0,
            finalShortfall: totalClusterTarget,
            relevantCalculation: `Combined capital demand of ₹${totalClusterTarget.toLocaleString('en-IN')} across ${cluster.length} overlapping milestones`,
            suggestedActionTypes: [
              'Stagger flexible deadlines across alternate quarters',
              'Postpone optional milestones past major critical dates'
            ]
          });
        }
      }
    }

    // 4. Emergency Reserve Violation Check
    const minSafeReserve = profile.essentialMonthlyExpenses * 3;
    if (profile.existingCashBalance < minSafeReserve) {
      const gap = minSafeReserve - profile.existingCashBalance;
      conflicts.push({
        id: 'conflict_emergency_buffer',
        type: 'EMERGENCY_RESERVE_VIOLATION',
        severity: 'CRITICAL',
        severityScore: 92,
        title: 'Liquid Emergency Reserve Below 3-Month Minimum Floor',
        reason: `Household liquid cash balance (₹${profile.existingCashBalance.toLocaleString('en-IN')}) is below the safe minimum threshold of 3 months essential expenses (₹${minSafeReserve.toLocaleString('en-IN')}).`,
        affectedGoalIds: [],
        affectedGoalNames: ['Household Safety Floor'],
        affectedPeriod: 'Immediate',
        monthlyShortfall: Math.round(gap / 6),
        finalShortfall: gap,
        relevantCalculation: `Required Buffer (₹${minSafeReserve.toLocaleString('en-IN')}) - Existing Liquid Cash (₹${profile.existingCashBalance.toLocaleString('en-IN')}) = Deficit ₹${gap.toLocaleString('en-IN')}`,
        suggestedActionTypes: [
          'Mandate a monthly reserve replenishment contribution',
          'Pause discretionary vacation funding until safety floor is restored'
        ]
      });
    }

    // 5. Overdue Goals Check
    activeGoals.forEach((goal) => {
      const months = GoalFeasibilityEngine.calculateMonthsRemaining(goal.targetDate, baseDateStr);
      if (months <= 0 && goal.currentAmount < goal.targetAmount) {
        const gap = goal.targetAmount - goal.currentAmount;
        conflicts.push({
          id: `conflict_overdue_${goal.id}`,
          type: 'OVERDUE_GOAL',
          severity: 'HIGH',
          severityScore: 82,
          title: `Milestone Overdue: ${goal.name}`,
          reason: `Target date "${goal.targetDate}" has passed with an unfunded deficit of ₹${gap.toLocaleString('en-IN')}.`,
          affectedGoalIds: [goal.id],
          affectedGoalNames: [goal.name],
          affectedPeriod: goal.targetDate,
          monthlyShortfall: gap,
          finalShortfall: gap,
          relevantCalculation: `Target ₹${goal.targetAmount.toLocaleString('en-IN')} - Saved ₹${goal.currentAmount.toLocaleString('en-IN')} = Shortfall ₹${gap.toLocaleString('en-IN')}`,
          suggestedActionTypes: [
            'Update milestone target date to a realistic future quarter',
            'Archive or settle milestone'
          ]
        });
      }
    });

    return conflicts;
  }
};
