import React, { useState } from 'react';
import { useFinFam } from './context/FinFamContext';
import { FinFamTopAppBar } from './components/FinFamTopAppBar';
import { FinFamBottomNavBar } from './components/FinFamBottomNavBar';
import { HomeScreen } from './screens/HomeScreen';
import { MonthlySpendingTrendsScreen } from './screens/MonthlySpendingTrendsScreen';
import { EmiCalculatorScreen } from './screens/EmiCalculatorScreen';
import { EmiManagerScreen } from './screens/EmiManagerScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { GoalsAndBudgetsScreen } from './screens/GoalsAndBudgetsScreen';
import { FamilyAndBillsScreen } from './screens/FamilyAndBillsScreen';
import { AiAdvisorScreen } from './screens/AiAdvisorScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RealTimeDataTransferScreen } from './screens/RealTimeDataTransferScreen';
import {
  DecisionOptimizerScreen,
  DecisionResultsScreen,
  DecisionExplanationScreen,
  SensitivityAnalysisScreen,
  DecisionHistoryScreen,
  GoalPortfolioDashboardScreen,
  GoalInterferenceMapScreen,
  RippleSimulatorScreen,
  ResolutionLabScreen,
  GoalTimelineScreen
} from './screens/index';
import {
  AddExpenseModal,
  AddIncomeModal,
  AddGoalModal,
  AddBudgetModal,
  TopUpGoalModal,
  AddBillModal,
  AddEmiModal,
  ScanReceiptModal
} from './components/Dialogs';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import {
  DecisionCriterion,
  DecisionConstraint,
  DecisionAlternative,
  AlternativeEvaluation,
  PairwiseTradeOff,
  SensitivityAnalysisResult,
  DecisionConfidenceResult,
  DecisionHistoryRecord
} from './types/decisionOptimizer';
import { GoalItem } from './types';
import {
  SCENARIO_PRESETS,
  DecisionOptimizerEngine,
  TradeOffAnalyzer,
  SensitivityAnalysisEngine,
  DecisionConfidenceEngine
} from './lib/decision';

export const App: React.FC = () => {
  const {
    decisionHistory,
    saveDecisionRecord,
    deleteDecisionRecord,
    updateDecisionStatus,
    isPaymentGatewayOpen,
    activeGatewayOrder,
    closePaymentGateway,
    handleGatewayPaymentSuccess
  } = useFinFam();

  const [currentRoute, setCurrentRoute] = useState<string>('home');

  // Modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isAddEmiOpen, setIsAddEmiOpen] = useState(false);
  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);
  const [isTopUpGoalOpen, setIsTopUpGoalOpen] = useState(false);
  const [selectedGoalForTopUp, setSelectedGoalForTopUp] = useState<GoalItem | null>(null);

  // Decision Optimizer active scenario state
  const initialPreset = SCENARIO_PRESETS[0];
  const initialEvaluations = DecisionOptimizerEngine.optimize(
    initialPreset.alternatives,
    initialPreset.criteria,
    initialPreset.constraints
  );
  const initialTradeOffs = TradeOffAnalyzer.generateAllTradeOffs(
    initialEvaluations,
    initialPreset.criteria
  );
  const initialSensitivity = SensitivityAnalysisEngine.analyzeSensitivity(
    initialPreset.alternatives,
    initialPreset.criteria,
    initialPreset.constraints
  );
  const initialConfidence = DecisionConfidenceEngine.calculateConfidence(
    initialEvaluations,
    initialSensitivity
  );

  const [decisionPayload, setDecisionPayload] = useState<{
    title: string;
    scenarioDilemma: string;
    capitalAmount: number;
    criteria: DecisionCriterion[];
    constraints: DecisionConstraint[];
    alternatives: DecisionAlternative[];
    evaluations: AlternativeEvaluation[];
    tradeOffs: PairwiseTradeOff[];
    sensitivityResults: SensitivityAnalysisResult[];
    confidence: DecisionConfidenceResult;
  }>({
    title: initialPreset.title,
    scenarioDilemma: initialPreset.dilemmaDescription,
    capitalAmount: initialPreset.capitalAmount,
    criteria: initialPreset.criteria,
    constraints: initialPreset.constraints,
    alternatives: initialPreset.alternatives,
    evaluations: initialEvaluations,
    tradeOffs: initialTradeOffs,
    sensitivityResults: initialSensitivity,
    confidence: initialConfidence
  });

  const handleRunOptimization = (payload: typeof decisionPayload) => {
    setDecisionPayload(payload);
    setCurrentRoute('optimizer_results');
  };

  const handleSaveCurrentScenarioToVault = () => {
    const winner = decisionPayload.evaluations[0];
    if (!winner) return;

    const weightsSnapshot: Record<string, number> = {};
    decisionPayload.criteria.forEach((c) => {
      weightsSnapshot[c.key] = c.weight;
    });

    saveDecisionRecord({
      scenarioTitle: decisionPayload.title,
      capitalAmount: decisionPayload.capitalAmount,
      winningAlternativeId: winner.alternative.id,
      winningAlternativeTitle: winner.alternative.title,
      winningScore: winner.finalScore,
      confidenceScore: decisionPayload.confidence.confidenceScore,
      confidenceTier: decisionPayload.confidence.confidenceTier,
      implementationStatus: 'PENDING',
      criteriaWeightsSnapshot: weightsSnapshot,
      topTradeOffSummary:
        decisionPayload.tradeOffs[0]?.opportunityCostSummary ||
        'Optimized via Weighted Sum Model with verified household liquidity constraints.'
    });

    setCurrentRoute('optimizer_history');
  };

  const handleLoadHistoryRecord = (record: DecisionHistoryRecord) => {
    const preset =
      SCENARIO_PRESETS.find((p) => p.title === record.scenarioTitle) || SCENARIO_PRESETS[0];
    const evals = DecisionOptimizerEngine.optimize(
      preset.alternatives,
      preset.criteria,
      preset.constraints
    );
    const tradeOffs = TradeOffAnalyzer.generateAllTradeOffs(evals, preset.criteria);
    const sens = SensitivityAnalysisEngine.analyzeSensitivity(
      preset.alternatives,
      preset.criteria,
      preset.constraints
    );
    const conf = DecisionConfidenceEngine.calculateConfidence(evals, sens);

    setDecisionPayload({
      title: record.scenarioTitle,
      scenarioDilemma: preset.dilemmaDescription,
      capitalAmount: record.capitalAmount,
      criteria: preset.criteria,
      constraints: preset.constraints,
      alternatives: preset.alternatives,
      evaluations: evals,
      tradeOffs,
      sensitivityResults: sens,
      confidence: conf
    });

    setCurrentRoute('optimizer_results');
  };

  const renderActiveScreen = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={(route) => setCurrentRoute(route)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
            onSelectGoalForTopUp={(goal) => {
              setSelectedGoalForTopUp(goal);
              setIsTopUpGoalOpen(true);
            }}
          />
        );

      case 'optimizer':
        return (
          <DecisionOptimizerScreen
            onRunOptimization={handleRunOptimization}
            onNavigateToHistory={() => setCurrentRoute('optimizer_history')}
          />
        );

      case 'optimizer_results':
        return (
          <DecisionResultsScreen
            scenarioTitle={decisionPayload.title}
            scenarioDilemma={decisionPayload.scenarioDilemma}
            capitalAmount={decisionPayload.capitalAmount}
            criteria={decisionPayload.criteria}
            constraints={decisionPayload.constraints}
            evaluations={decisionPayload.evaluations}
            tradeOffs={decisionPayload.tradeOffs}
            sensitivityResults={decisionPayload.sensitivityResults}
            confidence={decisionPayload.confidence}
            onNavigateToExplanation={() => setCurrentRoute('optimizer_explanation')}
            onNavigateToSensitivity={() => setCurrentRoute('optimizer_sensitivity')}
            onSaveScenario={handleSaveCurrentScenarioToVault}
            onReconfigure={() => setCurrentRoute('optimizer')}
          />
        );

      case 'optimizer_explanation':
        return (
          <DecisionExplanationScreen
            scenarioTitle={decisionPayload.title}
            capitalAmount={decisionPayload.capitalAmount}
            evaluations={decisionPayload.evaluations}
            criteria={decisionPayload.criteria}
            tradeOffs={decisionPayload.tradeOffs}
            onBackToResults={() => setCurrentRoute('optimizer_results')}
          />
        );

      case 'optimizer_sensitivity':
        return (
          <SensitivityAnalysisScreen
            scenarioTitle={decisionPayload.title}
            initialCriteria={decisionPayload.criteria}
            constraints={decisionPayload.constraints}
            alternatives={decisionPayload.alternatives}
            sensitivityResults={decisionPayload.sensitivityResults}
            onBackToResults={() => setCurrentRoute('optimizer_results')}
          />
        );

      case 'optimizer_history':
        return (
          <DecisionHistoryScreen
            historyRecords={decisionHistory}
            onLoadRecord={handleLoadHistoryRecord}
            onDeleteRecord={deleteDecisionRecord}
            onUpdateStatus={updateDecisionStatus}
            onBackToOptimizer={() => setCurrentRoute('optimizer')}
          />
        );

      case 'trends':
        return <MonthlySpendingTrendsScreen />;

      case 'emi':
        return (
          <EmiCalculatorScreen
            onNavigateToManager={() => setCurrentRoute('emimanager')}
          />
        );

      case 'emimanager':
        return (
          <EmiManagerScreen
            onOpenAddEmi={() => setIsAddEmiOpen(true)}
            onNavigateToCalculator={() => setCurrentRoute('emi')}
          />
        );

      case 'payment':
        return (
          <PaymentScreen
            onNavigateToTransfer={() => setCurrentRoute('transfer')}
          />
        );

      case 'analytics':
        return (
          <AnalyticsScreen
            onNavigateToAiCoach={() => setCurrentRoute('advisor')}
          />
        );

      case 'goals':
        return (
          <GoalsAndBudgetsScreen
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onOpenAddBudget={() => setIsAddBudgetOpen(true)}
            onSelectGoalForTopUp={(goal) => {
              setSelectedGoalForTopUp(goal);
              setIsTopUpGoalOpen(true);
            }}
            onNavigate={(route) => setCurrentRoute(route)}
          />
        );

      case 'goal_portfolio':
        return (
          <GoalPortfolioDashboardScreen
            onNavigate={(route) => setCurrentRoute(route)}
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onSelectGoalForTopUp={(goal) => {
              setSelectedGoalForTopUp(goal);
              setIsTopUpGoalOpen(true);
            }}
          />
        );

      case 'goal_interference':
        return (
          <GoalInterferenceMapScreen
            onNavigate={(route) => setCurrentRoute(route)}
          />
        );

      case 'what_if':
      case 'ripple_simulator':
        return (
          <RippleSimulatorScreen
            onNavigate={(route) => setCurrentRoute(route)}
          />
        );

      case 'resolution_lab':
        return (
          <ResolutionLabScreen
            onNavigate={(route) => setCurrentRoute(route)}
            onRunMCDAOptimization={(payload) => {
              const evals = DecisionOptimizerEngine.optimize(
                payload.alternatives,
                payload.criteria,
                payload.constraints
              );
              const tradeOffs = TradeOffAnalyzer.generateAllTradeOffs(evals, payload.criteria);
              const sens = SensitivityAnalysisEngine.analyzeSensitivity(
                payload.alternatives,
                payload.criteria,
                payload.constraints
              );
              const conf = DecisionConfidenceEngine.calculateConfidence(evals, sens);

              setDecisionPayload({
                title: payload.title,
                scenarioDilemma: payload.scenarioDilemma,
                capitalAmount: payload.capitalAmount,
                criteria: payload.criteria,
                constraints: payload.constraints,
                alternatives: payload.alternatives,
                evaluations: evals,
                tradeOffs,
                sensitivityResults: sens,
                confidence: conf
              });
              setCurrentRoute('optimizer_results');
            }}
          />
        );

      case 'goal_timeline':
        return (
          <GoalTimelineScreen
            onNavigate={(route) => setCurrentRoute(route)}
          />
        );

      case 'family':
        return (
          <FamilyAndBillsScreen
            onOpenAddBill={() => setIsAddBillOpen(true)}
          />
        );

      case 'advisor':
        return <AiAdvisorScreen />;

      case 'profile':
        return (
          <ProfileScreen
            onNavigateToDecisionOptimizer={() => setCurrentRoute('optimizer')}
            onNavigateToSubscription={() => setCurrentRoute('payment')}
          />
        );

      case 'transfer':
        return <RealTimeDataTransferScreen />;

      default:
        return (
          <HomeScreen
            onNavigate={(route) => setCurrentRoute(route)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
            onSelectGoalForTopUp={(goal) => {
              setSelectedGoalForTopUp(goal);
              setIsTopUpGoalOpen(true);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col selection:bg-cyan-500 selection:text-[#050816]">
      {/* Top Header App Bar */}
      <FinFamTopAppBar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {renderActiveScreen()}
      </main>

      {/* Persistent Bottom Navigation */}
      <FinFamBottomNavBar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
      />

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
      />
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
      />
      <AddBudgetModal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
      />
      <TopUpGoalModal
        isOpen={isTopUpGoalOpen}
        onClose={() => setIsTopUpGoalOpen(false)}
        goal={selectedGoalForTopUp}
      />
      <AddBillModal
        isOpen={isAddBillOpen}
        onClose={() => setIsAddBillOpen(false)}
      />
      <AddEmiModal
        isOpen={isAddEmiOpen}
        onClose={() => setIsAddEmiOpen(false)}
      />
      <ScanReceiptModal
        isOpen={isScanReceiptOpen}
        onClose={() => setIsScanReceiptOpen(false)}
      />
      {/* Real-time Interactive Payment Gateway Checkout Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentGatewayOpen}
        onClose={closePaymentGateway}
        orderData={activeGatewayOrder}
        onPaymentSuccess={handleGatewayPaymentSuccess}
      />
    </div>
  );
};
