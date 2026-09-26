import { GoalItem, GoalFeasibilityResult } from '../../types/goalPlanning';

export interface GoalRiskBreakdown {
  goalId: number;
  goalName: string;
  overallRiskScore: number; // 0-100 (Higher = greater risk of failure)
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  factors: {
    deadlinePressure: number; // 0-25
    fundingGapPressure: number; // 0-35
    inflexibilityPressure: number; // 0-20
    interferenceExposure: number; // 0-20
  };
  explanation: string;
}

export const GoalRiskEngine = {
  /**
   * Evaluates multifaceted goal risk without confusing investment volatility with goal failure risk.
   */
  evaluateGoalRisk(
    goal: GoalItem,
    feasibility: GoalFeasibilityResult,
    incomingInterference: number = 0
  ): GoalRiskBreakdown {
    // 1. Deadline Pressure (Shorter deadline = higher pressure)
    const months = feasibility.monthsRemaining;
    const deadlinePressure = months <= 6 ? 25 : months <= 18 ? 18 : months <= 36 ? 10 : 5;

    // 2. Funding Gap Pressure
    const shortfallRatio = feasibility.requiredMonthlyContribution > 0
      ? Math.min(feasibility.monthlyShortfall / feasibility.requiredMonthlyContribution, 1)
      : 0;
    const fundingGapPressure = Math.round(shortfallRatio * 35);

    // 3. Inflexibility Pressure (Locked deadlines & unyielding targets are harder to recover)
    let inflexibilityPressure = 0;
    if (goal.hardDeadline) inflexibilityPressure += 12;
    if (goal.targetAmountLocked) inflexibilityPressure += 8;

    // 4. Interference Exposure
    const interferenceExposure = Math.min(Math.round((incomingInterference / 100) * 20), 20);

    const totalRisk = Math.min(
      Math.max(
        deadlinePressure + fundingGapPressure + inflexibilityPressure + interferenceExposure,
        5
      ),
      98
    );

    let riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (totalRisk >= 75) riskTier = 'CRITICAL';
    else if (totalRisk >= 50) riskTier = 'HIGH';
    else if (totalRisk >= 25) riskTier = 'MODERATE';

    let explanation = '';
    if (riskTier === 'CRITICAL') {
      explanation = `Severe risk of missing target: High monthly shortfall (₹${feasibility.monthlyShortfall.toLocaleString('en-IN')}/mo) coupled with strict hard deadline.`;
    } else if (riskTier === 'HIGH') {
      explanation = `Elevated risk: Competes heavily with other household goals and requires significant monthly allocation increase.`;
    } else if (riskTier === 'MODERATE') {
      explanation = `Manageable risk: Slight allocation shortfall, but flexible timeline provides recovery room.`;
    } else {
      explanation = `Low risk: Well on track with adequate funding runway.`;
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      overallRiskScore: totalRisk,
      riskTier,
      factors: {
        deadlinePressure,
        fundingGapPressure,
        inflexibilityPressure,
        interferenceExposure
      },
      explanation
    };
  }
};
