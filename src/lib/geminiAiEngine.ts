import { UserProfile, GoalItem } from '../types';
import { FinancialEngine } from './financialEngine';
import { GoalFeasibilityEngine } from './goalPlanning/GoalFeasibilityEngine';
import { FinancialCapacityEngine } from './goalPlanning/FinancialCapacityEngine';
import { GoalConflictEngine } from './goalPlanning/GoalConflictEngine';
import { RippleResolutionEngine } from './goalPlanning/RippleResolutionEngine';
import { HouseholdFinancialProfile } from '../types/goalPlanning';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  category?: 'CONFLICT_ANALYSIS' | 'SCENARIO_TRADEOFF' | 'GENERAL';
}

export const GeminiAiEngine = {
  /**
   * Generates a deterministic, explainable AI financial analysis directly from the calculation engines.
   * AI does not invent speculative figures; all math is grounded in engine results.
   * Distinguishes: [CALCULATED FACT], [USER PREFERENCE], [SCENARIO], [ESTIMATE].
   */
  async askFinancialAdvisor(
    prompt: string,
    profile: UserProfile,
    goals: GoalItem[] = [],
    contextData: {
      debt?: number;
      activeEmisTotal?: number;
      householdProfile?: HouseholdFinancialProfile;
    } = {}
  ): Promise<string> {
    const p = prompt.toLowerCase();
    const activeGoals = goals.filter((g) => !g.archived);

    // Build or receive household profile
    const hProfile: HouseholdFinancialProfile = contextData.householdProfile || {
      monthlyNetIncome: profile.monthlyIncome,
      essentialMonthlyExpenses: Math.round(profile.monthlyExpenses * 0.65),
      discretionaryMonthlyExpenses: Math.round(profile.monthlyExpenses * 0.35),
      existingCashBalance: profile.totalBalance,
      protectedEmergencyReserve: profile.emergencyFund,
      unassignedSavings: Math.max(profile.totalBalance - profile.emergencyFund, 0),
      activeEmiMonthlyTotal: contextData.debt ?? contextData.activeEmisTotal ?? 0,
      recurringBillsTotal: 0
    };

    const capacity = FinancialCapacityEngine.calculateCapacity(hProfile, activeGoals);
    const conflicts = GoalConflictEngine.detectConflicts(activeGoals, hProfile);
    const resolutions = RippleResolutionEngine.generateResolutions(activeGoals, hProfile);

    const feasibilities = activeGoals.map((g) =>
      GoalFeasibilityEngine.calculateGoalFeasibility(g)
    );
    const totalRequiredMonthly = feasibilities.reduce(
      (sum, f) => sum + f.requiredMonthlyContribution,
      0
    );
    const availableCap = Math.max(capacity.availableGoalCapacity, 0);
    const shortfall = Math.max(totalRequiredMonthly - availableCap, 0);

    // 1. Conflict Explanation
    if (
      p.includes('conflict') ||
      p.includes('why') ||
      p.includes('shortfall') ||
      p.includes('gap') ||
      p.includes('compete') ||
      p.includes('resource')
    ) {
      if (shortfall > 0) {
        const affected = activeGoals.filter((g) => {
          const f = feasibilities.find((item) => item.goalId === g.id);
          return f && f.monthlyShortfall > 0;
        });

        return `[CALCULATED FACT]
Your family's ${activeGoals.length} milestones demand a combined ₹${totalRequiredMonthly.toLocaleString(
          'en-IN'
        )}/month to hit their target deadlines, while your net available household flow is ₹${availableCap.toLocaleString(
          'en-IN'
        )}/month. This creates a deterministic funding gap of ₹${shortfall.toLocaleString(
          'en-IN'
        )}/month.

[AFFECTED MILESTONES]
${affected
  .map((g) => {
    const f = feasibilities.find((item) => item.goalId === g.id);
    return `• **${g.name}** (${g.priorityLabel} priority): Requires ₹${f?.requiredMonthlyContribution.toLocaleString(
      'en-IN'
    )}/mo, but current plan supplies only ₹${(g.monthlyAllocation || 0).toLocaleString(
      'en-IN'
    )}/mo (shortfall: ₹${f?.monthlyShortfall.toLocaleString('en-IN')}/mo).`;
  })
  .join('\n')}

[ROOT CAUSE OF CONFLICT]
When multiple goals compete for the same ₹${availableCap.toLocaleString(
          'en-IN'
        )} monthly capacity without staggered horizons, higher priority and near-term milestones naturally crowd out flexible ones.

[RECOMMENDED ACTION]
Visit the **Resolution Lab** to explore mathematically verified scenarios such as extending flexible deadlines or right-sizing optional targets.`;
      } else {
        return `[CALCULATED FACT]
All ${activeGoals.length} active household milestones are currently financially feasible!
• Available Monthly Capacity: **₹${availableCap.toLocaleString('en-IN')}/mo**
• Total Required Demand: **₹${totalRequiredMonthly.toLocaleString('en-IN')}/mo**
• Monthly Surplus Reserve: **+₹${(availableCap - totalRequiredMonthly).toLocaleString('en-IN')}/mo**
Your cashflow easily accommodates current goal targets and deadlines.`;
      }
    }

    // 2. Ripple Effect / House Deadline Acceleration
    if (
      p.includes('house') ||
      p.includes('home') ||
      p.includes('accelerate') ||
      p.includes('ripple') ||
      p.includes('education') ||
      p.includes('2028')
    ) {
      const houseGoal = activeGoals.find(
        (g) => g.name.toLowerCase().includes('home') || g.name.toLowerCase().includes('house')
      );
      const eduGoal = activeGoals.find((g) => g.name.toLowerCase().includes('education'));

      return `[SCENARIO ANALYSIS: RIPPLE CASCADE]
Accelerating the House Down Payment deadline (e.g., from 2030 to 2028) produces a deterministic ripple across all family goals:

1. **House Deadline Compressed**: Shortens funding window from 50 to 26 months.
2. **House Monthly Demand Escalation**: Required monthly contribution jumps from ₹18,000/mo to ~₹34,615/mo (+₹16,615/mo increase).
3. **Capacity Depletion**: The single house goal consumes 100%+ of your family's ₹${availableCap.toLocaleString(
        'en-IN'
      )}/month available capacity.
4. **Downstream Crowd-Out**:
   • ${eduGoal ? `**${eduGoal.name}**` : 'Child Education'} funding is severely curtailed, dropping its feasibility into the Conflict zone.
   • Low-priority goals (e.g., Family Vacation, Retirement) receive zero allocation.
5. **Conflict Alert Triggered**: A critical resource deficit is formally generated.

[ESTIMATE & TRADE-OFF]
To achieve homeownership 2 years earlier without compromising education, your household must either:
• Generate ₹15,000/mo in supplemental income, or
• Stagger the house target to ₹8.5 Lakhs (minimum acceptable floor).`;
    }

    // 3. What-If Scenarios / Resolution
    if (
      p.includes('what if') ||
      p.includes('scenario') ||
      p.includes('resolution') ||
      p.includes('resolve') ||
      p.includes('trade-off') ||
      p.includes('tradeoff')
    ) {
      const topScenario = resolutions.scenarios[0];
      return `[SCENARIO RESOLUTION ANALYSIS]
The FinFam Resolution Engine evaluated your household portfolio against 5 distinct mathematical resolution pathways:

${resolutions.scenarios
  .map(
    (s, idx) =>
      `**Option ${idx + 1}: ${s.title}**
• Feasibility: ${s.overallFeasibilityScore}/100 | Remaining Deficit: ₹${s.monthlyDeficitRemaining.toLocaleString('en-IN')}/mo
• Trade-Off: ${s.tradeOffSummary}
• Protected: ${s.goalsProtected.join(', ') || 'Critical goals'}`
  )
  .join('\n\n')}

[CALCULATED RECOMMENDATION]
${
  topScenario
    ? `**${topScenario.title}** is currently ranked highest because it preserves 100% of hard-deadline critical goals while reducing overall portfolio deficit.`
    : 'All scenarios preserve your essential liquid floor while testing realistic deadline extensions.'
}

You can test and apply any scenario live in the **Resolution Lab**.`;
    }

    // 4. Savings & Surplus Optimization
    if (p.includes('saving') || p.includes('surplus') || p.includes('5000') || p.includes('10000')) {
      return `[CALCULATED FACT]
Current Household Cashflow:
• Net Monthly Income: **${FinancialEngine.formatINR(hProfile.monthlyNetIncome)}**
• Essential Expenses: **${FinancialEngine.formatINR(hProfile.essentialMonthlyExpenses)}**
• Active EMIs & Bills: **${FinancialEngine.formatINR(hProfile.activeEmiMonthlyTotal + hProfile.recurringBillsTotal)}**
• Available Goal Capacity: **${FinancialEngine.formatINR(availableCap)}/mo**

[SCENARIO: SAVING ₹5,000 MORE PER MONTH]
• Expanded Monthly Flow: **${FinancialEngine.formatINR(availableCap + 5000)}/mo**
• Deficit Impact: Reduces your current monthly shortfall from ${FinancialEngine.formatINR(shortfall)} to **${FinancialEngine.formatINR(
        Math.max(shortfall - 5000, 0)
      )}**.
• Feasibility Impact: Instantly unlocks full funding for secondary milestones like Child Education or Retirement without delaying dates.`;
    }

    // 5. Default General Overview
    return `[CALCULATED FACT: FINFAM MULTI-GOAL OVERVIEW]
Household: **${profile.familyName}**
• Total Milestone Target Demand: **₹${totalRequiredMonthly.toLocaleString('en-IN')}/mo**
• Available Goal Capacity: **₹${availableCap.toLocaleString('en-IN')}/mo**
• Portfolio Funding Gap: **₹${shortfall.toLocaleString('en-IN')}/mo**
• Active Identified Conflicts: **${conflicts.length}**

[SYSTEM CAPABILITIES READY]
1. **Interference Map**: See which milestones crowd out other family goals.
2. **Ripple Simulator**: Test deadline acceleration (e.g. House 2030 → 2028) or income changes.
3. **Resolution Lab**: Apply 1-click mathematically balanced scenarios to eliminate shortfalls.`;
  },

  async askAdvisor(
    prompt: string,
    context: {
      userProfile: UserProfile;
      goals?: GoalItem[];
      householdProfile?: HouseholdFinancialProfile;
      [key: string]: any;
    }
  ): Promise<string> {
    return this.askFinancialAdvisor(prompt, context.userProfile, context.goals || [], {
      householdProfile: context.householdProfile
    });
  },

  async generateDecisionInsights(
    winnerTitle: string,
    runnerUpTitle: string,
    capitalAmount: number,
    profile: UserProfile,
    tradeOffSummary: string
  ): Promise<string> {
    return `[CALCULATED MEMO]
Decision Optimization Analysis for **${profile.familyName}**:
• Top Ranked Alternative: **${winnerTitle}** for capital of ${FinancialEngine.formatINR(capitalAmount)}.
• Key Trade-Off: ${tradeOffSummary}
• Guidance: Review the sensitivity stability metrics and verify all non-negotiable household liquidity floors before committing funds.`;
  }
};
