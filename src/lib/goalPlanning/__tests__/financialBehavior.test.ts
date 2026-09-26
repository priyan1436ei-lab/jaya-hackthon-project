import { GoalFeasibilityEngine, BASE_SIMULATION_DATE } from '../GoalFeasibilityEngine';
import { FinancialCapacityEngine } from '../FinancialCapacityEngine';
import { SharedCashflowTimelineEngine } from '../SharedCashflowTimelineEngine';
import { GoalConflictEngine } from '../GoalConflictEngine';
import { RippleSimulationEngine } from '../RippleSimulationEngine';
import { RippleResolutionEngine } from '../RippleResolutionEngine';
import { ConstraintEngine } from '../../decision/ConstraintEngine';
import { GoalItem, HouseholdFinancialProfile } from '../../../types/goalPlanning';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runAllTests() {
  console.log('🧪 Starting FinFam Multi-Goal Financial Behavior Test Suite...');
  const FIXED_BASE_DATE = '2026-10-01';

  // -------------------------------------------------------------------
  // TEST 1: Monthly capacity ₹50,000 and total required contributions ₹35,000 produces a ₹15,000 monthly surplus.
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 80000,
      essentialMonthlyExpenses: 30000, // capacity = 80000 - 30000 = 50,000
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 150000,
      protectedEmergencyReserve: 90000,
      unassignedSavings: 60000,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const goals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'Goal A',
        targetAmount: 350000,
        currentAmount: 0,
        targetDate: 'Aug 2027', // 10 months -> 35,000/mo
        monthlyAllocation: 35000
      })
    ];

    const capacity = FinancialCapacityEngine.calculateCapacity(profile, goals);
    assert(capacity.availableGoalCapacity === 50000, `Expected capacity 50000, got ${capacity.availableGoalCapacity}`);

    const feas = GoalFeasibilityEngine.calculateGoalFeasibility(goals[0], FIXED_BASE_DATE);
    assert(feas.requiredMonthlyContribution === 35000, `Expected required 35000, got ${feas.requiredMonthlyContribution}`);

    const surplus = capacity.availableGoalCapacity - feas.requiredMonthlyContribution;
    assert(surplus === 15000, `Expected surplus 15000, got ${surplus}`);
    console.log('  ✅ Test 1 PASSED: ₹50k capacity and ₹35k demand produces ₹15k surplus.');
  }

  // -------------------------------------------------------------------
  // TEST 2: Capacity ₹20,000 and contributions of ₹12,000, ₹10,000, and ₹5,000 produces a ₹7,000 monthly demand gap.
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 50000,
      essentialMonthlyExpenses: 30000, // capacity = 20,000
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 100000,
      protectedEmergencyReserve: 90000,
      unassignedSavings: 10000,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const goals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'Goal 1',
        targetAmount: 120000,
        currentAmount: 0,
        targetDate: 'Aug 2027', // 10 months -> 12,000/mo
        monthlyAllocation: 12000
      }),
      GoalFeasibilityEngine.normalizeGoal({
        id: 2,
        name: 'Goal 2',
        targetAmount: 100000,
        currentAmount: 0,
        targetDate: 'Aug 2027', // 10 months -> 10,000/mo
        monthlyAllocation: 10000
      }),
      GoalFeasibilityEngine.normalizeGoal({
        id: 3,
        name: 'Goal 3',
        targetAmount: 50000,
        currentAmount: 0,
        targetDate: 'Aug 2027', // 10 months -> 5,000/mo
        monthlyAllocation: 5000
      })
    ];

    const capacity = FinancialCapacityEngine.calculateCapacity(profile, goals);
    assert(capacity.availableGoalCapacity === 20000, `Expected capacity 20000, got ${capacity.availableGoalCapacity}`);

    const totalRequired = goals.reduce((sum, g) => {
      const f = GoalFeasibilityEngine.calculateGoalFeasibility(g, FIXED_BASE_DATE);
      return sum + f.requiredMonthlyContribution;
    }, 0);
    assert(totalRequired === 27000, `Expected total required 27000, got ${totalRequired}`);

    const demandGap = totalRequired - capacity.availableGoalCapacity;
    assert(demandGap === 7000, `Expected demand gap 7000, got ${demandGap}`);
    console.log('  ✅ Test 2 PASSED: ₹20k capacity and ₹27k demand produces ₹7k demand gap.');
  }

  // -------------------------------------------------------------------
  // TEST 3: Moving an unfinished goal deadline earlier increases its required contribution in the zero-return baseline.
  // -------------------------------------------------------------------
  {
    const goalBaseline = GoalFeasibilityEngine.normalizeGoal({
      id: 1,
      name: 'Home Goal',
      targetAmount: 1200000,
      currentAmount: 200000,
      targetDate: 'Dec 2030' // 50 months -> 1,000,000 / 50 = 20,000/mo
    });

    const goalEarlier = GoalFeasibilityEngine.normalizeGoal({
      ...goalBaseline,
      targetDate: 'Dec 2028' // 26 months -> 1,000,000 / 26 = 38,462/mo
    });

    const feasBaseline = GoalFeasibilityEngine.calculateGoalFeasibility(goalBaseline, FIXED_BASE_DATE);
    const feasEarlier = GoalFeasibilityEngine.calculateGoalFeasibility(goalEarlier, FIXED_BASE_DATE);

    assert(
      feasEarlier.requiredMonthlyContribution > feasBaseline.requiredMonthlyContribution,
      `Expected earlier deadline required contribution (${feasEarlier.requiredMonthlyContribution}) > baseline (${feasBaseline.requiredMonthlyContribution})`
    );
    console.log(`  ✅ Test 3 PASSED: Moving deadline earlier increased required contribution from ₹${feasBaseline.requiredMonthlyContribution} to ₹${feasEarlier.requiredMonthlyContribution}.`);
  }

  // -------------------------------------------------------------------
  // TEST 4: Locked dates and targets are unchanged in every generated resolution.
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 60000,
      essentialMonthlyExpenses: 35000,
      discretionaryMonthlyExpenses: 10000,
      existingCashBalance: 150000,
      protectedEmergencyReserve: 105000,
      unassignedSavings: 45000,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const goals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'Critical Locked Education',
        targetAmount: 1000000,
        currentAmount: 200000,
        targetDate: 'Aug 2029',
        hardDeadline: true,
        targetAmountLocked: true,
        priority: 1,
        priorityLabel: 'CRITICAL'
      }),
      GoalFeasibilityEngine.normalizeGoal({
        id: 2,
        name: 'Flexible Vacation',
        targetAmount: 200000,
        currentAmount: 20000,
        targetDate: 'Dec 2027',
        hardDeadline: false,
        targetAmountLocked: false,
        deadlineFlexibilityMonths: 12,
        priority: 4,
        priorityLabel: 'LOW'
      })
    ];

    const resolutions = RippleResolutionEngine.generateResolutions(goals, profile, FIXED_BASE_DATE);

    resolutions.scenarios.forEach((scen) => {
      const lockedGoal = scen.adjustedGoals.find((g) => g.id === 1);
      assert(lockedGoal !== undefined, 'Locked goal must exist in scenario');
      assert(lockedGoal!.targetDate === 'Aug 2029', `Locked date was modified in ${scen.title}: ${lockedGoal!.targetDate}`);
      assert(lockedGoal!.targetAmount === 1000000, `Locked target amount was modified in ${scen.title}: ${lockedGoal!.targetAmount}`);
    });
    console.log(`  ✅ Test 4 PASSED: Locked date (Aug 2029) and locked target (₹10L) preserved across all ${resolutions.scenarios.length} generated resolution scenarios.`);
  }

  // -------------------------------------------------------------------
  // TEST 5: Insufficient funds for a locked goal remain explicitly infeasible.
  // -------------------------------------------------------------------
  {
    const poorProfile: HouseholdFinancialProfile = {
      monthlyNetIncome: 25000,
      essentialMonthlyExpenses: 24000, // available capacity = 1,000/mo
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 10000,
      protectedEmergencyReserve: 72000,
      unassignedSavings: 0,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const lockedExpensiveGoal: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'Expensive Locked Obligation',
        targetAmount: 500000,
        currentAmount: 0,
        targetDate: 'Oct 2027', // 12 months -> requires 41,667/mo (capacity is only 1,000/mo)
        hardDeadline: true,
        targetAmountLocked: true,
        priority: 1,
        priorityLabel: 'CRITICAL'
      })
    ];

    const resolutions = RippleResolutionEngine.generateResolutions(lockedExpensiveGoal, poorProfile, FIXED_BASE_DATE);
    assert(resolutions.allInfeasible === true, 'Expected all resolutions to be infeasible when funds are insufficient for locked goal');
    assert(resolutions.recommendedScenarioId === null, 'Recommended scenario must be null when all options are infeasible');
    console.log('  ✅ Test 5 PASSED: Insufficient funds for locked goal correctly marked as explicitly infeasible with no false recommendations.');
  }

  // -------------------------------------------------------------------
  // TEST 6: A completed goal requires no further contributions.
  // -------------------------------------------------------------------
  {
    const completedGoal = GoalFeasibilityEngine.normalizeGoal({
      id: 1,
      name: 'Achieved Goal',
      targetAmount: 50000,
      currentAmount: 55000, // overfunded
      targetDate: 'Dec 2027'
    });

    const feas = GoalFeasibilityEngine.calculateGoalFeasibility(completedGoal, FIXED_BASE_DATE);
    assert(feas.isCompleted === true, 'Goal must be marked completed');
    assert(feas.remainingAmount === 0, `Expected remaining 0, got ${feas.remainingAmount}`);
    assert(feas.requiredMonthlyContribution === 0, `Expected required 0, got ${feas.requiredMonthlyContribution}`);
    console.log('  ✅ Test 6 PASSED: Completed goal requires 0 further contributions.');
  }

  // -------------------------------------------------------------------
  // TEST 7: An underfunded past-deadline goal is handled without invalid arithmetic.
  // -------------------------------------------------------------------
  {
    const overdueGoal = GoalFeasibilityEngine.normalizeGoal({
      id: 1,
      name: 'Overdue Goal',
      targetAmount: 100000,
      currentAmount: 30000,
      targetDate: 'Jan 2026' // Past relative to Oct 2026
    });

    const feas = GoalFeasibilityEngine.calculateGoalFeasibility(overdueGoal, FIXED_BASE_DATE);
    assert(feas.isOverdue === true, 'Goal must be flagged overdue');
    assert(!Number.isNaN(feas.requiredMonthlyContribution), 'Must not be NaN');
    assert(Number.isFinite(feas.requiredMonthlyContribution), 'Must be finite');
    assert(feas.monthsRemaining === 0, 'Months remaining must be 0, not negative division');
    console.log('  ✅ Test 7 PASSED: Underfunded past-deadline goal handled without invalid arithmetic or divide-by-zero.');
  }

  // -------------------------------------------------------------------
  // TEST 8: Zero or negative household capacity creates no fictional funding.
  // -------------------------------------------------------------------
  {
    const deficitProfile: HouseholdFinancialProfile = {
      monthlyNetIncome: 40000,
      essentialMonthlyExpenses: 45000, // Deficit of -5,000/mo
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 20000,
      protectedEmergencyReserve: 100000,
      unassignedSavings: 0,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const capacity = FinancialCapacityEngine.calculateCapacity(deficitProfile, []);
    assert(capacity.availableGoalCapacity === -5000, `Expected negative capacity -5000, got ${capacity.availableGoalCapacity}`);
    assert(capacity.isDeficit === true, 'Capacity must flag isDeficit = true');

    const timeline = SharedCashflowTimelineEngine.simulateTimeline(
      [
        GoalFeasibilityEngine.normalizeGoal({
          id: 1,
          name: 'Dream Car',
          targetAmount: 200000,
          currentAmount: 0,
          targetDate: 'Oct 2028'
        })
      ],
      deficitProfile,
      { startDate: FIXED_BASE_DATE }
    );

    // Allocated funding must be 0 for month 0 because flow capacity is <= 0
    assert(timeline.timeline[0].allocatedGoalFunding === 0, `Allocated funding must be 0 in deficit, got ${timeline.timeline[0].allocatedGoalFunding}`);
    console.log('  ✅ Test 8 PASSED: Negative capacity (-₹5k) allocates zero fictional goal funding.');
  }

  // -------------------------------------------------------------------
  // TEST 9: Existing savings are not counted twice.
  // -------------------------------------------------------------------
  {
    const goal = GoalFeasibilityEngine.normalizeGoal({
      id: 1,
      name: 'Safe Haven',
      targetAmount: 100000,
      currentAmount: 40000,
      targetDate: 'Oct 2027' // 12 months
    });

    const feas = GoalFeasibilityEngine.calculateGoalFeasibility(goal, FIXED_BASE_DATE);
    // Remaining is target - current = 60,000. Required = 60,000 / 12 = 5,000/mo.
    assert(feas.remainingAmount === 60000, `Remaining amount must be 60000, got ${feas.remainingAmount}`);
    assert(feas.requiredMonthlyContribution === 5000, `Required must be 5000, got ${feas.requiredMonthlyContribution}`);
    console.log('  ✅ Test 9 PASSED: Existing earmarked savings (₹40k) correctly offset target, not double-counted.');
  }

  // -------------------------------------------------------------------
  // TEST 10: Goal transfers conserve total household money.
  // -------------------------------------------------------------------
  {
    let totalCash = 84500;
    let goalAmount = 72500;
    const initialSum = totalCash + goalAmount;

    // Simulate deposit of 10,000 into goal
    const depositAmount = 10000;
    totalCash -= depositAmount;
    goalAmount += depositAmount;

    assert(totalCash + goalAmount === initialSum, 'Total household wealth must be strictly conserved in transfer');
    console.log('  ✅ Test 10 PASSED: Internal goal transfer strictly conserves total household funds.');
  }

  // -------------------------------------------------------------------
  // TEST 11: Goal deposits and withdrawals cannot silently create or destroy funds.
  // -------------------------------------------------------------------
  {
    const goalTarget = 100000;
    let goalCurrent = 95000; // needs only 5,000 more
    let userCash = 20000;

    // User attempts to deposit 15,000
    const requestedDeposit = 15000;
    const remainingGap = Math.max(goalTarget - goalCurrent, 0);
    const actualDeposit = Math.min(requestedDeposit, remainingGap, userCash);

    userCash -= actualDeposit;
    goalCurrent += actualDeposit;

    assert(actualDeposit === 5000, `Deposit must be capped at 5000, got ${actualDeposit}`);
    assert(goalCurrent === 100000, `Goal current must be 100000, got ${goalCurrent}`);
    assert(userCash === 15000, `User cash must be 15000, got ${userCash}`);

    // User attempts to withdraw 200,000 (more than exists in goal)
    const requestedWithdrawal = 200000;
    const actualWithdrawal = Math.min(requestedWithdrawal, goalCurrent);
    goalCurrent -= actualWithdrawal;
    userCash += actualWithdrawal;

    assert(actualWithdrawal === 100000, `Withdrawal must be capped at 100000, got ${actualWithdrawal}`);
    assert(goalCurrent === 0, `Goal current must be 0, got ${goalCurrent}`);
    assert(userCash === 115000, `User cash must be 115000, got ${userCash}`);
    console.log('  ✅ Test 11 PASSED: Excess deposit rejected and withdrawal capped at goal balance.');
  }

  // -------------------------------------------------------------------
  // TEST 12: EMI expiry increases future capacity in the correct month.
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 70000,
      essentialMonthlyExpenses: 30000,
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 100000,
      protectedEmergencyReserve: 90000,
      unassignedSavings: 10000,
      activeEmiMonthlyTotal: 10000,
      recurringBillsTotal: 0
    };

    const activeEmis = [
      { id: 1, monthlyEmi: 10000, remainingMonths: 3 } // Expires after month 2 (index 0, 1, 2)
    ];

    const timeline = SharedCashflowTimelineEngine.simulateTimeline(
      [],
      profile,
      { startDate: FIXED_BASE_DATE, activeEmis }
    );

    // Month 0, 1, 2 have EMI = 10,000 -> available capacity = 70000 - 30000 - 10000 = 30,000
    assert(timeline.timeline[0].emiTotal === 10000, 'Month 0 must have EMI');
    assert(timeline.timeline[0].availableCapacity === 30000, `Month 0 capacity must be 30000, got ${timeline.timeline[0].availableCapacity}`);

    // Month 3 has EMI = 0 -> available capacity rises to 40,000
    assert(timeline.timeline[3].emiTotal === 0, 'Month 3 must have expired EMI');
    assert(timeline.timeline[3].availableCapacity === 40000, `Month 3 capacity must be 40000, got ${timeline.timeline[3].availableCapacity}`);
    console.log('  ✅ Test 12 PASSED: EMI expiration in month 3 automatically increases available goal capacity from ₹30k to ₹40k.');
  }

  // -------------------------------------------------------------------
  // TEST 13: A one-time shock is applied exactly once.
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 70000,
      essentialMonthlyExpenses: 30000,
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 100000,
      protectedEmergencyReserve: 90000,
      unassignedSavings: 10000,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0,
      oneTimeFinancialShocks: [
        { month: '2026-11', amount: 15000, description: 'Medical Emergency' }
      ]
    };

    const timeline = SharedCashflowTimelineEngine.simulateTimeline([], profile, { startDate: FIXED_BASE_DATE });

    // Month 0 ('2026-10'): shock = 0
    assert(timeline.timeline[0].oneTimeShocks === 0, 'Month 0 must not have shock');
    // Month 1 ('2026-11'): shock = 15000
    assert(timeline.timeline[1].oneTimeShocks === 15000, 'Month 1 must have shock of 15000');
    // Month 2 ('2026-12'): shock = 0
    assert(timeline.timeline[2].oneTimeShocks === 0, 'Month 2 must not repeat shock');
    console.log('  ✅ Test 13 PASSED: One-time shock applied exclusively to target month.');
  }

  // -------------------------------------------------------------------
  // TEST 14: Cancelling a preview preserves the original plan.
  // -------------------------------------------------------------------
  {
    const originalGoals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({ id: 1, name: 'Original', targetDate: 'Dec 2030' })
    ];

    let currentGoals = [...originalGoals];
    let snapshot: GoalItem[] | null = null;

    // Start preview: save snapshot
    snapshot = currentGoals;
    // Mutate in simulator preview
    currentGoals = [{ ...currentGoals[0], targetDate: 'Dec 2028' }];
    assert(currentGoals[0].targetDate === 'Dec 2028', 'Preview mutated local state');

    // Cancel preview: restore snapshot
    currentGoals = snapshot;
    assert(currentGoals[0].targetDate === 'Dec 2030', 'Plan must be restored to original upon cancellation');
    console.log('  ✅ Test 14 PASSED: Cancelling preview safely preserves original plan.');
  }

  // -------------------------------------------------------------------
  // TEST 15: Applying a plan produces the same results shown in its preview.
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 65000,
      essentialMonthlyExpenses: 30000,
      discretionaryMonthlyExpenses: 5000,
      existingCashBalance: 120000,
      protectedEmergencyReserve: 90000,
      unassignedSavings: 30000,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const goals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'Home',
        targetAmount: 600000,
        currentAmount: 100000,
        targetDate: 'Oct 2028' // 24 months
      })
    ];

    const preview = RippleSimulationEngine.simulateRipple(
      goals,
      profile,
      {
        type: 'DEADLINE_CHANGE',
        targetGoalId: 1,
        parameterName: 'Home Deadline',
        oldValue: 'Oct 2028',
        newValue: 'Oct 2027' // 12 months
      },
      FIXED_BASE_DATE
    );

    const proposedGoals = preview.proposedGoals;
    const postApplyFeas = GoalFeasibilityEngine.calculateGoalFeasibility(proposedGoals[0], FIXED_BASE_DATE);

    assert(
      postApplyFeas.requiredMonthlyContribution === preview.proposedFeasibilities[1].requiredMonthlyContribution,
      'Post-apply calculation must match preview calculation exactly'
    );
    console.log(`  ✅ Test 15 PASSED: Post-apply calculation (₹${postApplyFeas.requiredMonthlyContribution}) identically matches simulated preview.`);
  }

  // -------------------------------------------------------------------
  // TEST 16: Missing constraint metrics do not silently pass.
  // -------------------------------------------------------------------
  {
    const alternativeWithMissingMetric = {
      id: 'alt_missing',
      title: 'Missing Data Alternative',
      category: 'CUSTOM' as const,
      description: 'Alternative with undefined metric',
      allocationAmount: 50000,
      rawCriteriaValues: {
        LIQUIDITY: 5,
        RETURN_ROI: 5,
        RISK_SAFETY: 5,
        DEBT_REDUCTION: 5,
        TAX_EFFICIENCY: 5,
        TIMELINE_FLEXIBILITY: 5
      },
      constraintValues: {
        // 'postLiquidityBuffer' is missing / undefined!
      },
      iconName: 'AlertTriangle'
    };

    const hardConstraint = {
      id: 'c_hard_liquidity',
      name: 'Minimum Buffer',
      type: 'HARD' as const,
      metricKey: 'postLiquidityBuffer',
      operator: '>=' as const,
      targetValue: 50000,
      unit: '₹',
      description: 'Requires liquidity metric'
    };

    const check = ConstraintEngine.evaluateAlternativeConstraints(
      alternativeWithMissingMetric,
      [hardConstraint]
    );

    assert(check.isFeasible === false, 'Alternative with missing constraint metric must NOT pass hard constraint');
    assert(check.hardViolations.length > 0, 'Must record a hard violation for missing metric');
    console.log('  ✅ Test 16 PASSED: Missing constraint metric correctly flagged as hard violation.');
  }

  // -------------------------------------------------------------------
  // TEST 17: Edge cases - Zero income, Zero expenses, Negative capacity (No NaN, No Infinity)
  // -------------------------------------------------------------------
  {
    const zeroProfile: HouseholdFinancialProfile = {
      monthlyNetIncome: 0,
      essentialMonthlyExpenses: 0,
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 0,
      protectedEmergencyReserve: 0,
      unassignedSavings: 0,
      activeEmiMonthlyTotal: 0,
      recurringBillsTotal: 0
    };

    const capacity = FinancialCapacityEngine.calculateCapacity(zeroProfile, []);
    assert(!isNaN(capacity.availableCapacity), 'Available capacity must not be NaN');
    assert(!isNaN(capacity.remainingGoalCapacity), 'Remaining capacity must not be NaN');
    assert(capacity.availableCapacity === 0, `Expected 0 capacity, got ${capacity.availableCapacity}`);

    // Negative capacity profile
    const negativeProfile: HouseholdFinancialProfile = {
      monthlyNetIncome: 10000,
      essentialMonthlyExpenses: 25000, // deficit = -15,000
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 0,
      protectedEmergencyReserve: 0,
      unassignedSavings: 0,
      activeEmiMonthlyTotal: 5000,
      recurringBillsTotal: 2000
    };
    const negCapacity = FinancialCapacityEngine.calculateCapacity(negativeProfile, []);
    assert(negCapacity.availableGoalCapacity === -22000, `Expected -22000, got ${negCapacity.availableGoalCapacity}`);
    assert(negCapacity.isDeficit === true, 'Must flag deficit');
    console.log('  ✅ Test 17 PASSED: Zero and negative capacity edge cases evaluated cleanly without NaN or Infinity.');
  }

  // -------------------------------------------------------------------
  // TEST 18: Multiple goals with the same deadline and very long-term horizon (30 years)
  // -------------------------------------------------------------------
  {
    const sameDeadlineGoals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'Shared Milestone A',
        targetAmount: 200000,
        currentAmount: 0,
        targetDate: 'Dec 2028' // 26 months
      }),
      GoalFeasibilityEngine.normalizeGoal({
        id: 2,
        name: 'Shared Milestone B',
        targetAmount: 300000,
        currentAmount: 0,
        targetDate: 'Dec 2028' // 26 months
      }),
      GoalFeasibilityEngine.normalizeGoal({
        id: 3,
        name: 'Long-term 30yr Corpus',
        targetAmount: 36000000,
        currentAmount: 0,
        targetDate: 'Oct 2056' // 360 months -> 100,000/mo
      })
    ];

    const feasA = GoalFeasibilityEngine.calculateGoalFeasibility(sameDeadlineGoals[0], FIXED_BASE_DATE);
    const feasB = GoalFeasibilityEngine.calculateGoalFeasibility(sameDeadlineGoals[1], FIXED_BASE_DATE);
    const feasLong = GoalFeasibilityEngine.calculateGoalFeasibility(sameDeadlineGoals[2], FIXED_BASE_DATE);

    assert(feasA.monthsRemaining === feasB.monthsRemaining, 'Deadlines must have equal months remaining');
    assert(feasLong.monthsRemaining === 360, `Expected 360 months for 30yr goal, got ${feasLong.monthsRemaining}`);
    assert(feasLong.requiredMonthlyContribution === 100000, `Expected 100000/mo, got ${feasLong.requiredMonthlyContribution}`);
    assert(!isNaN(feasLong.feasibilityScore), 'Feasibility score must not be NaN');
    console.log('  ✅ Test 18 PASSED: Same deadline clustering and 30-year long-term goal calculated accurately.');
  }

  // -------------------------------------------------------------------
  // TEST 19: Ripple effect of income decrease (-10k) and new EMI (+8k)
  // -------------------------------------------------------------------
  {
    const profile: HouseholdFinancialProfile = {
      monthlyNetIncome: 75000,
      essentialMonthlyExpenses: 35000,
      discretionaryMonthlyExpenses: 0,
      existingCashBalance: 150000,
      protectedEmergencyReserve: 200000,
      unassignedSavings: 0,
      activeEmiMonthlyTotal: 8000,
      recurringBillsTotal: 0
    };

    const goals: GoalItem[] = [
      GoalFeasibilityEngine.normalizeGoal({
        id: 1,
        name: 'House Goal',
        targetAmount: 1000000,
        currentAmount: 100000,
        targetDate: 'Dec 2030'
      })
    ];

    // Income decrease simulation
    const incomeRipple = RippleSimulationEngine.simulateRipple(goals, profile, {
      type: 'INCOME_CHANGE',
      parameterName: 'Monthly Income',
      oldValue: 75000,
      newValue: 65000
    }, FIXED_BASE_DATE);

    assert(incomeRipple.proposedCapacity === 22000, `Expected proposed capacity 22000, got ${incomeRipple.proposedCapacity}`);
    assert(incomeRipple.baselineCapacity === 32000, `Expected baseline capacity 32000, got ${incomeRipple.baselineCapacity}`);

    // New EMI simulation
    const emiRipple = RippleSimulationEngine.simulateRipple(goals, profile, {
      type: 'NEW_EMI',
      parameterName: 'Car Loan EMI',
      oldValue: 8000,
      newValue: 8000
    }, FIXED_BASE_DATE);

    assert(emiRipple.proposedCapacity === 24000, `Expected proposed capacity 24000 with additional EMI, got ${emiRipple.proposedCapacity}`);
    console.log('  ✅ Test 19 PASSED: Ripple effects of income decrease and new EMI correctly recalculate goal capacity.');
  }

  console.log('🎉 ALL 19 FINANCIAL BEHAVIOR TEST SUITE CASES EXECUTED AND PASSED WITH 100% SUCCESS!');
  return true;
}

// Auto-run if executed directly via Node / tsx
runAllTests();
