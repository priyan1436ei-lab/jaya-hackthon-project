import {
  GoalItem,
  HouseholdFinancialProfile,
  RippleTrigger,
  RippleEvent,
  RippleSimulationResult,
  GoalFeasibilityResult
} from '../../types/goalPlanning';
import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from './GoalFeasibilityEngine';
import { FinancialCapacityEngine } from './FinancialCapacityEngine';
import { GoalConflictEngine } from './GoalConflictEngine';
import { FinancialEngine } from '../financialEngine';

export const RippleSimulationEngine = {
  /**
   * Simulates a hypothetical parameter shift (deadline, target, income, EMI, shock, pause)
   * and computes the exact downstream ripple across the entire goal portfolio.
   * Does NOT mutate the original saved inputs.
   */
  simulateRipple(
    goals: GoalItem[],
    profile: HouseholdFinancialProfile,
    trigger: RippleTrigger,
    baseDateStr: string = BASE_SIMULATION_DATE
  ): RippleSimulationResult {
    // 1. Calculate Baseline State
    const baselineCapacityRes = FinancialCapacityEngine.calculateCapacity(profile, goals);
    const baselineCapacity = baselineCapacityRes.availableGoalCapacity;

    const baselineFeasibilities: Record<number, GoalFeasibilityResult> = {};
    goals.forEach((g) => {
      baselineFeasibilities[g.id] = GoalFeasibilityEngine.calculateGoalFeasibility(g, baseDateStr);
    });

    const baselineConflicts = GoalConflictEngine.detectConflicts(goals, profile, baseDateStr);

    // 2. Clone and Apply Proposed Modifications
    const proposedProfile: HouseholdFinancialProfile = {
      ...profile,
      oneTimeFinancialShocks: profile.oneTimeFinancialShocks ? [...profile.oneTimeFinancialShocks] : []
    };

    let proposedGoals: GoalItem[] = goals.map((g) => ({ ...g }));

    switch (trigger.type) {
      case 'DEADLINE_CHANGE':
        proposedGoals = proposedGoals.map((g) => {
          if (g.id === trigger.targetGoalId) {
            return { ...g, targetDate: String(trigger.newValue) };
          }
          return g;
        });
        break;

      case 'TARGET_CHANGE':
        proposedGoals = proposedGoals.map((g) => {
          if (g.id === trigger.targetGoalId) {
            return { ...g, targetAmount: Number(trigger.newValue) };
          }
          return g;
        });
        break;

      case 'PRIORITY_CHANGE':
        proposedGoals = proposedGoals.map((g) => {
          if (g.id === trigger.targetGoalId) {
            const p = Number(trigger.newValue);
            const label = p === 1 ? 'CRITICAL' : p === 2 ? 'HIGH' : p === 3 ? 'MEDIUM' : 'LOW';
            return { ...g, priority: p, priorityLabel: label };
          }
          return g;
        });
        break;

      case 'INCOME_CHANGE':
        proposedProfile.monthlyNetIncome = Number(trigger.newValue);
        break;

      case 'EXPENSE_CHANGE':
        proposedProfile.essentialMonthlyExpenses = Number(trigger.newValue);
        break;

      case 'NEW_EMI':
        proposedProfile.activeEmiMonthlyTotal += Number(trigger.newValue);
        break;

      case 'EMERGENCY_SHOCK':
        proposedProfile.existingCashBalance = Math.max(
          proposedProfile.existingCashBalance - Number(trigger.newValue),
          0
        );
        proposedProfile.oneTimeFinancialShocks = [
          ...(proposedProfile.oneTimeFinancialShocks || []),
          {
            month: baseDateStr.slice(0, 7),
            amount: Number(trigger.newValue),
            description: 'Simulated Emergency Shock'
          }
        ];
        break;

      case 'PAUSE_GOAL':
        proposedGoals = proposedGoals.map((g) => {
          if (g.id === trigger.targetGoalId) {
            return {
              ...g,
              pauseStartMonth: baseDateStr.slice(0, 7),
              pauseEndMonth: GoalFeasibilityEngine.addMonthsToYearMonth(baseDateStr.slice(0, 7), 6)
            };
          }
          return g;
        });
        break;
    }

    // 3. Recalculate Proposed State
    const proposedCapacityRes = FinancialCapacityEngine.calculateCapacity(proposedProfile, proposedGoals);
    const proposedCapacity = proposedCapacityRes.availableGoalCapacity;

    const proposedFeasibilities: Record<number, GoalFeasibilityResult> = {};
    proposedGoals.forEach((g) => {
      proposedFeasibilities[g.id] = GoalFeasibilityEngine.calculateGoalFeasibility(g, baseDateStr);
    });

    const proposedConflicts = GoalConflictEngine.detectConflicts(proposedGoals, proposedProfile, baseDateStr);

    // 4. Generate Deterministic Chain of Ripple Events
    const events: RippleEvent[] = [];
    let order = 1;

    // Trigger Primary Event
    events.push({
      order: order++,
      entity: trigger.targetGoalName || 'Household Financial Flow',
      metric: trigger.parameterName,
      before: trigger.oldValue,
      after: trigger.newValue,
      delta: typeof trigger.newValue === 'number' && typeof trigger.oldValue === 'number'
        ? (trigger.newValue - trigger.oldValue > 0 ? `+${trigger.newValue - trigger.oldValue}` : `${trigger.newValue - trigger.oldValue}`)
        : `${trigger.oldValue} → ${trigger.newValue}`,
      impactType: 'NEUTRAL',
      explanation: `User triggered adjustment on ${trigger.parameterName}.`
    });

    // Capacity Impact
    const capDelta = proposedCapacity - baselineCapacity;
    if (capDelta !== 0) {
      events.push({
        order: order++,
        entity: 'Household Budget',
        metric: 'Available Goal Capacity',
        before: FinancialEngine.formatINR(baselineCapacity),
        after: FinancialEngine.formatINR(proposedCapacity),
        delta: `${capDelta > 0 ? '+' : ''}${FinancialEngine.formatINR(capDelta)}/mo`,
        impactType: capDelta > 0 ? 'POSITIVE' : 'NEGATIVE',
        explanation: `Net disposable monthly capacity changed from ${FinancialEngine.formatINR(baselineCapacity)} to ${FinancialEngine.formatINR(proposedCapacity)}.`
      });
    }

    // Goal-specific Ripple Events
    proposedGoals.forEach((goal) => {
      const baseF = baselineFeasibilities[goal.id];
      const propF = proposedFeasibilities[goal.id];
      if (!baseF || !propF) return;

      const reqDelta = propF.requiredMonthlyContribution - baseF.requiredMonthlyContribution;
      if (reqDelta !== 0) {
        events.push({
          order: order++,
          entity: goal.name,
          metric: 'Required Monthly Saving',
          before: FinancialEngine.formatINR(baseF.requiredMonthlyContribution),
          after: FinancialEngine.formatINR(propF.requiredMonthlyContribution),
          delta: `${reqDelta > 0 ? '+' : ''}${FinancialEngine.formatINR(reqDelta)}/mo`,
          impactType: reqDelta < 0 ? 'POSITIVE' : 'NEGATIVE',
          explanation: reqDelta > 0
            ? `Compressing timeline or increasing target raises required monthly saving by ${FinancialEngine.formatINR(reqDelta)}/mo.`
            : `Relaxing timeline or target reduces monthly demand by ${FinancialEngine.formatINR(Math.abs(reqDelta))}/mo.`
        });
      }

      const scoreDelta = propF.feasibilityScore - baseF.feasibilityScore;
      if (Math.abs(scoreDelta) >= 4) {
        events.push({
          order: order++,
          entity: goal.name,
          metric: 'Feasibility Score',
          before: `${baseF.feasibilityScore}%`,
          after: `${propF.feasibilityScore}%`,
          delta: `${scoreDelta > 0 ? '+' : ''}${scoreDelta} pts`,
          impactType: scoreDelta > 0 ? 'POSITIVE' : 'NEGATIVE',
          explanation: `Feasibility shifted from ${baseF.feasibilityScore}% (${baseF.status}) to ${propF.feasibilityScore}% (${propF.status}).`
        });
      }
    });

    // Conflict Deltas
    const resolvedConflictsCount = baselineConflicts.filter(
      (bc) => !proposedConflicts.some((pc) => pc.id === bc.id)
    ).length;

    const newConflictsCount = proposedConflicts.filter(
      (pc) => !baselineConflicts.some((bc) => bc.id === pc.id)
    ).length;

    if (newConflictsCount > 0) {
      events.push({
        order: order++,
        entity: 'Portfolio Risk Shield',
        metric: 'Active Conflict Alerts',
        before: `${baselineConflicts.length} Conflicts`,
        after: `${proposedConflicts.length} Conflicts`,
        delta: `+${newConflictsCount} new`,
        impactType: 'NEGATIVE',
        explanation: `${newConflictsCount} new resource conflict(s) triggered by this parameter shift.`
      });
    } else if (resolvedConflictsCount > 0) {
      events.push({
        order: order++,
        entity: 'Portfolio Risk Shield',
        metric: 'Active Conflict Alerts',
        before: `${baselineConflicts.length} Conflicts`,
        after: `${proposedConflicts.length} Conflicts`,
        delta: `-${resolvedConflictsCount} resolved`,
        impactType: 'POSITIVE',
        explanation: `Successfully resolved ${resolvedConflictsCount} conflict(s).`
      });
    }

    // Summary Narrative
    const summaryNarrative =
      newConflictsCount > 0
        ? `This adjustment triggers a negative ripple: Available capacity drops or demands surge, creating ${newConflictsCount} new conflict(s). Consider exploring Resolution Lab scenarios to rebalance funding.`
        : resolvedConflictsCount > 0
        ? `This adjustment creates a positive ripple: Frees up surplus and resolves ${resolvedConflictsCount} previously active funding conflict(s).`
        : `This adjustment alters portfolio required allocations without creating new critical conflicts.`;

    return {
      trigger,
      events,
      baselineCapacity,
      proposedCapacity,
      baselineFeasibilities,
      proposedFeasibilities,
      baselineConflicts,
      proposedConflicts,
      resolvedConflictsCount,
      newConflictsCount,
      summaryNarrative,
      proposedGoals
    };
  }
};
