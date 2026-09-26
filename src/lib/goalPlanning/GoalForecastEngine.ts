import { GoalItem } from '../../types/goalPlanning';
import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from './GoalFeasibilityEngine';

export interface GoalForecastPoint {
  monthIndex: number;
  monthLabel: string;
  targetLine: number;
  currentTrajectory: number;
  recommendedTrajectory: number;
}

export const GoalForecastEngine = {
  /**
   * Generates month-by-month trajectory projections for a goal for Recharts.
   */
  generateForecast(
    goal: GoalItem,
    horizonMonths: number = 36,
    baseDateStr: string = BASE_SIMULATION_DATE
  ): GoalForecastPoint[] {
    const startYM = baseDateStr.slice(0, 7);
    const monthsRemaining = Math.max(
      GoalFeasibilityEngine.calculateMonthsRemaining(goal.targetDate, baseDateStr),
      1
    );

    const needed = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const requiredMonthly = Math.round(needed / monthsRemaining);
    const currentAllocation = goal.monthlyAllocation || 0;

    const points: GoalForecastPoint[] = [];
    let curAccum = goal.currentAmount;
    let recAccum = goal.currentAmount;

    for (let m = 0; m <= horizonMonths; m++) {
      const ym = GoalFeasibilityEngine.addMonthsToYearMonth(startYM, m);
      const label = GoalFeasibilityEngine.formatYearMonthLabel(ym);

      points.push({
        monthIndex: m,
        monthLabel: label,
        targetLine: goal.targetAmount,
        currentTrajectory: Math.min(Math.round(curAccum), goal.targetAmount * 1.1),
        recommendedTrajectory: Math.min(Math.round(recAccum), goal.targetAmount)
      });

      if (curAccum < goal.targetAmount) {
        curAccum += currentAllocation;
      }
      if (recAccum < goal.targetAmount) {
        recAccum += requiredMonthly;
      }
    }

    return points;
  }
};
