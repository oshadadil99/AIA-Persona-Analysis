import type { StructuredProfile, RiskAssessment, FundingGapAssumptions, FundingGapProjection } from "./types";

// PLACEHOLDER ASSUMPTIONS — rough public estimates as of Sep 2026, not
// verified against current AIA/market data. Override these as soon as real
// figures are available; every output carries them explicitly so nothing
// downstream (including the LLM explanation step) can present them as fact.
export const FUNDING_GAP_ASSUMPTIONS: FundingGapAssumptions = {
  educationCostInflationPercent: 8,
  localDegreeCostTodayLkr: 2_500_000,
  overseasDegreeCostTodayLkr: 35_000_000,
  savingsGrowthScenariosPercent: [4, 8, 10], // mirrors the plan's own sample illustration scenarios
  disclaimer:
    "These education cost and inflation figures are rough placeholder assumptions, not verified " +
    "market data or AIA-guaranteed figures. They must be confirmed before this appears in any " +
    "customer-facing report.",
};

function futureValueOfCostToday(costToday: number, inflationPercent: number, years: number): number {
  return costToday * Math.pow(1 + inflationPercent / 100, years);
}

function futureValueOfAnnualSavings(annualContribution: number, growthPercent: number, years: number): number {
  const r = growthPercent / 100;
  if (r === 0) return annualContribution * years;
  return annualContribution * ((Math.pow(1 + r, years) - 1) / r);
}

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
      const savings = futureValueOfAnnualSavings(annualContribution, growthPercent, years);
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
