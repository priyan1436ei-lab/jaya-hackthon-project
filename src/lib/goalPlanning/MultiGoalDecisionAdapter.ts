import {
  DecisionAlternative,
  DecisionCriterion,
  DecisionConstraint
} from '../../types/decisionOptimizer';
import { ResolutionScenario, GoalItem, HouseholdFinancialProfile } from '../../types/goalPlanning';

export interface MultiGoalOptimizerPayload {
  title: string;
  scenarioDilemma: string;
  capitalAmount: number;
  criteria: DecisionCriterion[];
  constraints: DecisionConstraint[];
  alternatives: DecisionAlternative[];
}

export const MultiGoalDecisionAdapter = {
  /**
   * Adapts multi-goal resolution scenarios into Decision Alternatives for the MCDA Decision Optimizer.
   */
  adaptScenariosToOptimizer(
    scenarios: ResolutionScenario[],
    goals: GoalItem[],
    profile: HouseholdFinancialProfile
  ): MultiGoalOptimizerPayload {
    const alternatives: DecisionAlternative[] = scenarios.map((scen, idx) => {
      const liquidReserve = scen.householdProfileChanges?.existingCashBalance ?? profile.existingCashBalance;
      const essentialExp = scen.householdProfileChanges?.essentialMonthlyExpenses ?? profile.essentialMonthlyExpenses;
      const reserveMonths = essentialExp > 0 ? liquidReserve / essentialExp : 6;

      const liquidityScore = Math.min(Math.round(reserveMonths * 15), 100);
      const completionRate = scen.overallFeasibilityScore;
      const safetyScore = scen.hardConstraintsPassed ? 95 : 35;
      const discretionarySavings = Math.max(scen.monthlyBudgetDelta, 0);
      const timelineStability = Math.max(100 - scen.goalsDelayedOrAdjusted.length * 20, 20);

      return {
        id: scen.id,
        title: scen.title,
        category: 'CUSTOM',
        description: scen.tagline,
        allocationAmount: profile.monthlyNetIncome,
        iconName: scen.isFeasible ? 'CheckCircle2' : 'AlertTriangle',
        badge: scen.isFeasible ? 'Feasible Plan' : 'Constrained',
        rawCriteriaValues: {
          LIQUIDITY: liquidityScore / 10, // 0-10 scale
          RETURN_ROI: completionRate, // 0-100%
          RISK_SAFETY: safetyScore / 10, // 0-10 scale
          DEBT_REDUCTION: Math.min(discretionarySavings / 500, 10), // savings score
          TAX_EFFICIENCY: scen.isFeasible ? 8.5 : 4.0,
          TIMELINE_FLEXIBILITY: timelineStability / 10
        },
        constraintValues: {
          postLiquidityBuffer: liquidReserve,
          riskScore: scen.hardConstraintsPassed ? 3.0 : 8.5,
          lockInMonths: scen.goalsDelayedOrAdjusted.length * 6,
          expectedReturnRate: completionRate / 10
        }
      };
    });

    const criteria: DecisionCriterion[] = [
      {
        key: 'RETURN_ROI',
        name: 'Goal Funding Completion',
        shortName: 'Completion',
        weight: 0.30,
        isBeneficial: true,
        unit: '%',
        minRange: 0,
        maxRange: 100,
        description: 'Percentage of household financial goals fully funded on schedule.'
      },
      {
        key: 'RISK_SAFETY',
        name: 'Constraint Adherence',
        shortName: 'Safety',
        weight: 0.25,
        isBeneficial: true,
        unit: '/10',
        minRange: 0,
        maxRange: 10,
        description: 'Guarantees critical milestones and emergency floors remain inviolable.'
      },
      {
        key: 'LIQUIDITY',
        name: 'Emergency Reserve Buffer',
        shortName: 'Liquidity',
        weight: 0.20,
        isBeneficial: true,
        unit: 'mo',
        minRange: 0,
        maxRange: 10,
        description: 'Months of essential household expenses preserved in liquid cash.'
      },
      {
        key: 'TIMELINE_FLEXIBILITY',
        name: 'Timeline Stability',
        shortName: 'Timeline',
        weight: 0.15,
        isBeneficial: true,
        unit: '/10',
        minRange: 0,
        maxRange: 10,
        description: 'Minimizes delays to originally scheduled family milestone dates.'
      },
      {
        key: 'DEBT_REDUCTION',
        name: 'Discretionary Surplus Expansion',
        shortName: 'Surplus',
        weight: 0.10,
        isBeneficial: true,
        unit: 'pts',
        minRange: 0,
        maxRange: 10,
        description: 'Household cashflow surplus liberated without lifestyle disruption.'
      }
    ];

    const minBuffer = profile.essentialMonthlyExpenses * 3;
    const constraints: DecisionConstraint[] = [
      {
        id: 'c_goal_liquidity_floor',
        name: 'Emergency Floor (3-Month Minimum)',
        type: 'HARD',
        metricKey: 'postLiquidityBuffer',
        operator: '>=',
        targetValue: minBuffer,
        unit: '₹',
        description: 'Strict non-negotiable floor: Household emergency fund must cover 3+ months of essentials.'
      },
      {
        id: 'c_goal_max_risk',
        name: 'Implementation Risk Ceiling',
        type: 'HARD',
        metricKey: 'riskScore',
        operator: '<=',
        targetValue: 6.0,
        unit: '/10',
        description: 'Bars plans that leave critical family goals underfunded.'
      },
      {
        id: 'c_goal_max_delay',
        name: 'Max Milestone Extension Window',
        type: 'SOFT',
        metricKey: 'lockInMonths',
        operator: '<=',
        targetValue: 18,
        unit: 'Mo',
        description: 'Prefers solutions that avoid extending flexible milestones by over 18 cumulative months.'
      }
    ];

    return {
      title: 'Multi-Goal Conflict Resolution Optimization',
      scenarioDilemma: 'Balancing limited monthly household surplus across competing family goals, emergency reserves, and milestone deadlines.',
      capitalAmount: profile.monthlyNetIncome,
      criteria,
      constraints,
      alternatives
    };
  }
};
