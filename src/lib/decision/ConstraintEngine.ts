import {
  DecisionConstraint,
  DecisionAlternative,
  ConstraintCheckResult
} from '../../types/decisionOptimizer';

export const ConstraintEngine = {
  /**
   * Evaluates all constraints (hard and soft) for a given alternative.
   */
  evaluateAlternativeConstraints(
    alternative: DecisionAlternative,
    constraints: DecisionConstraint[]
  ): {
    isFeasible: boolean;
    hardViolations: string[];
    softPenalty: number;
    results: ConstraintCheckResult[];
  } {
    const results: ConstraintCheckResult[] = [];
    const hardViolations: string[] = [];
    let softPenalty = 0;

    for (const constraint of constraints) {
      const rawVal = alternative.constraintValues[constraint.metricKey];
      const isMissing = rawVal === undefined || rawVal === null || Number.isNaN(rawVal) || !Number.isFinite(rawVal);
      const actualVal = isMissing ? NaN : Number(rawVal);
      let passed = false;

      if (isMissing) {
        passed = false;
      } else {
        switch (constraint.operator) {
          case '>=':
            passed = actualVal >= constraint.targetValue;
            break;
          case '<=':
            passed = actualVal <= constraint.targetValue;
            break;
          case '>':
            passed = actualVal > constraint.targetValue;
            break;
          case '==':
            passed = Math.abs(actualVal - constraint.targetValue) < 0.0001;
            break;
          default:
            passed = true;
        }
      }

      let penalty = 0;
      let violationMsg: string | undefined;

      if (!passed) {
        if (isMissing) {
          violationMsg = `Constraint metric missing: ${constraint.name} (${constraint.metricKey} is undefined)`;
          if (constraint.type === 'HARD') {
            hardViolations.push(violationMsg);
          } else {
            softPenalty += 0.35;
          }
        } else if (constraint.type === 'HARD') {
          violationMsg = `Violates hard constraint: ${constraint.name} (Actual: ${actualVal}${constraint.unit}, Required: ${constraint.operator} ${constraint.targetValue}${constraint.unit})`;
          hardViolations.push(violationMsg);
        } else {
          // Soft constraint penalty proportional to deviation (capped at 0.35 max penalty)
          const target = Math.max(Math.abs(constraint.targetValue), 1);
          const deviationRatio = Math.abs(actualVal - constraint.targetValue) / target;
          penalty = Math.min(deviationRatio * 0.15, 0.35);
          softPenalty += penalty;
          violationMsg = `Soft constraint deviation: ${constraint.name} by ${(deviationRatio * 100).toFixed(0)}%`;
        }
      }

      results.push({
        constraintId: constraint.id,
        constraintName: constraint.name,
        isHard: constraint.type === 'HARD',
        passed,
        actualValue: actualVal,
        targetValue: constraint.targetValue,
        unit: constraint.unit,
        penalty,
        violationMessage: violationMsg
      });
    }

    // Soft penalties cumulative reduction factor capped at 60%
    const cappedSoftPenalty = Math.min(softPenalty, 0.60);

    return {
      isFeasible: hardViolations.length === 0,
      hardViolations,
      softPenalty: cappedSoftPenalty,
      results
    };
  },

  /**
   * Generates intelligent, context-aware default constraints based on live family financial figures.
   */
  generateDefaultConstraints(monthlyExpenses: number, currentEmergencyFund: number, totalBalance: number): DecisionConstraint[] {
    const minSafeReserveMonths = 3;
    const targetBuffer = Math.round(monthlyExpenses * minSafeReserveMonths);

    return [
      {
        id: 'c_liquidity_floor',
        name: 'Minimum Emergency Buffer Floor',
        type: 'HARD',
        metricKey: 'postLiquidityBuffer',
        operator: '>=',
        targetValue: targetBuffer,
        unit: '₹',
        description: `Ensures at least ${minSafeReserveMonths} months of essential household expenses (₹${targetBuffer.toLocaleString('en-IN')}) remain liquid.`
      },
      {
        id: 'c_max_risk',
        name: 'Risk Tolerance Ceiling',
        type: 'HARD',
        metricKey: 'riskScore',
        operator: '<=',
        targetValue: 7.5,
        unit: '/10',
        description: 'Disallows high-volatility speculative options exceeding household risk appetite.'
      },
      {
        id: 'c_lock_in_tenure',
        name: 'Maximum Capital Lock-in Period',
        type: 'SOFT',
        metricKey: 'lockInMonths',
        operator: '<=',
        targetValue: 36,
        unit: 'Months',
        description: 'Prefers alternatives with flexibility to reallocate capital within 3 years.'
      },
      {
        id: 'c_min_roi',
        name: 'Inflation Hurdle Rate',
        type: 'SOFT',
        metricKey: 'expectedReturnRate',
        operator: '>=',
        targetValue: 6.5,
        unit: '%',
        description: 'Targets real purchasing power preservation over long-term Indian CPI inflation (~6%).'
      }
    ];
  }
};
