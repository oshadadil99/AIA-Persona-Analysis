import type { StructuredProfile, RiskAssessment, FundingGapAssumptions, FundingGapProjection } from "./types";
import { COST_ASSUMPTIONS, futureValueOfCostToday, futureValueOfAnnualContribution } from "./assumptions";

const FUNDING_GAP_ASSUMPTIONS: FundingGapAssumptions = {
  educationCostInflationPercent: COST_ASSUMPTIONS.generalCostInflationPercent,
  localDegreeCostTodayLkr: COST_ASSUMPTIONS.localDegreeCostTodayLkr,
  overseasDegreeCostTodayLkr: COST_ASSUMPTIONS.overseasDegreeCostTodayLkr,
  savingsGrowthScenariosPercent: COST_ASSUMPTIONS.savingsGrowthScenariosPercent,
  disclaimer: COST_ASSUMPTIONS.disclaimer,
};

export { FUNDING_GAP_ASSUMPTIONS };

// Step 2 of the pipeline (Section 3): funding-gap projection. Pure function,
// no LLM — the numbers here are arithmetic on stated assumptions, never
// model-generated.
export function assessFundingGap(profile: StructuredProfile): RiskAssessment {
  const reasons: string[] = [];
  const years = profile.yearsToEducationTarget;

  if (years == null) {
    reasons.push("No child education target year provided — cannot project a funding gap.");
  } else if (years <= 0) {
    reasons.push(`Target education year has already passed or is this year (${years} years away).`);
  }

  const needsManualReview = years == null || years <= 0;

  if (needsManualReview) {
    return {
      needsManualReview: true,
      reasons,
      yearsToTarget: years,
      assumptions: FUNDING_GAP_ASSUMPTIONS,
      projections: [],
    };
  }

  const annualContribution = profile.monthlyBudgetLkr * 12;

  const scenarios: { scenario: FundingGapProjection["scenario"]; costToday: number }[] = [
    { scenario: "local_degree", costToday: FUNDING_GAP_ASSUMPTIONS.localDegreeCostTodayLkr },
    { scenario: "overseas_degree", costToday: FUNDING_GAP_ASSUMPTIONS.overseasDegreeCostTodayLkr },
  ];

  const projections: FundingGapProjection[] = scenarios.map(({ scenario, costToday }) => {
    const projectedCostAtTargetLkr = futureValueOfCostToday(
      costToday,
      FUNDING_GAP_ASSUMPTIONS.educationCostInflationPercent,
      years,
    );

    const projectedSavingsByGrowthRateLkr: Record<string, number> = {};
    const fundingGapByGrowthRateLkr: Record<string, number> = {};

    for (const growthPercent of FUNDING_GAP_ASSUMPTIONS.savingsGrowthScenariosPercent) {
      const key = `${growthPercent}%`;
      const savings = futureValueOfAnnualContribution(annualContribution, growthPercent, years);
      projectedSavingsByGrowthRateLkr[key] = Math.round(savings);
      fundingGapByGrowthRateLkr[key] = Math.round(projectedCostAtTargetLkr - savings);
    }

    return {
      scenario,
      projectedCostAtTargetLkr: Math.round(projectedCostAtTargetLkr),
      projectedSavingsByGrowthRateLkr,
      fundingGapByGrowthRateLkr,
    };
  });

  return {
    needsManualReview: false,
    reasons,
    yearsToTarget: years,
    assumptions: FUNDING_GAP_ASSUMPTIONS,
    projections,
  };
}
