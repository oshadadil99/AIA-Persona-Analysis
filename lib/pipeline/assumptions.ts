import educationPlan from "@/data/education.json";

// PLACEHOLDER ASSUMPTIONS — rough public estimates as of Sep 2026, not
// verified against current market data. Override these as soon as real
// figures are available; every output carries them explicitly so nothing
// downstream (including any LLM explanation/report step) can present them
// as fact.
export const COST_ASSUMPTIONS = {
  generalCostInflationPercent: 8,
  localDegreeCostTodayLkr: 2_500_000,
  overseasDegreeCostTodayLkr: 35_000_000,
  savingsGrowthScenariosPercent: [4, 8, 10], // mirrors the plan's own sample illustration scenarios
  // Sourced from data/education.json's Critical Illness Cover rider — a real
  // figure from the policy document, not invented, used as a reference target
  // for health-risk savings (not a guarantee this cover level suits everyone).
  criticalIllnessCoverReferenceLkr:
    educationPlan.optional_additional_benefits_riders.find((r) => r.name === "Critical Illness Cover")
      ?.description ?? "LKR 3,000,000 (see policy document)",
  criticalIllnessCoverReferenceAmountLkr: 3_000_000,
  disclaimer:
    "Education and health cost figures below are rough placeholder assumptions, not verified " +
    "market data or AIA-guaranteed figures. They must be confirmed with real data before this " +
    "appears in any customer-facing report.",
};

// Operator-provided real-world figures (not placeholder guesses), given as a
// range since per-class tuition fees vary. Confirmed 2026-09-06:
// LKR 3,000-4,000 per class, ~3 classes/month -> LKR 10,000-12,000/month,
// over ~2.5 years (30 months) leading up to A/Levels -> LKR 300,000-360,000 total.
export const A_LEVEL_TUITION_ASSUMPTIONS = {
  typicalStartAge: 17,
  perClassMonthlyFeeLkrMin: 3_000,
  perClassMonthlyFeeLkrMax: 4_000,
  classesPerMonth: 3,
  monthlyCostLkrMin: 10_000,
  monthlyCostLkrMax: 12_000,
  durationMonths: 30,
  totalCostTodayLkrMin: 300_000,
  totalCostTodayLkrMax: 360_000,
  source: "Operator-provided estimate, confirmed 2026-09-06 — not a public-data placeholder.",
};

// A/Level period is ~2.5 years — shared across all A/Level cost categories
// below so materials/transport/exam-fee line up with the tuition duration.
export const A_LEVEL_PERIOD_YEARS = A_LEVEL_TUITION_ASSUMPTIONS.durationMonths / 12;

export const A_LEVEL_MATERIALS_ASSUMPTIONS = {
  // Books, past papers, model papers, lab workbooks, scientific calculators.
  annualCostLkrMin: 15_000,
  annualCostLkrMax: 35_000,
  source: "Operator-provided estimate, confirmed 2026-09-07.",
};

export const A_LEVEL_TRANSPORT_ASSUMPTIONS = {
  // Daily commute to school and tuition (bus/train/three-wheeler).
  annualCostLkrMin: 30_000,
  annualCostLkrMax: 75_000,
  source: "Operator-provided estimate, confirmed 2026-09-07.",
};

export const A_LEVEL_EXAM_FEE_ASSUMPTIONS = {
  // Official exam registration fee — negligible vs. other costs, not inflated.
  schoolCandidateLkr: 0,
  privateCandidateLkrMin: 250,
  privateCandidateLkrMax: 400,
  source: "Operator-provided estimate, confirmed 2026-09-07.",
};

export function futureValueOfCostToday(costToday: number, inflationPercent: number, years: number): number {
  return costToday * Math.pow(1 + inflationPercent / 100, years);
}

export function futureValueOfAnnualContribution(
  annualContribution: number,
  growthPercent: number,
  years: number,
): number {
  const r = growthPercent / 100;
  if (r === 0) return annualContribution * years;
  return annualContribution * ((Math.pow(1 + r, years) - 1) / r);
}

// Inverse of futureValueOfAnnualContribution: how much would need to be saved
// each year to reach a target future value.
export function requiredAnnualContribution(targetFutureValue: number, growthPercent: number, years: number): number {
  const r = growthPercent / 100;
  if (years <= 0) return targetFutureValue;
  if (r === 0) return targetFutureValue / years;
  return targetFutureValue / ((Math.pow(1 + r, years) - 1) / r);
}

// Sums a recurring annual cost that itself grows with inflation each year —
// used for the sports/extracurricular cost projection, which isn't a single
// future lump sum but a stream of yearly spend between now and the target age.
export function totalOfGrowingAnnualCost(annualCostToday: number, inflationPercent: number, years: number): number {
  let total = 0;
  for (let year = 1; year <= years; year++) {
    total += futureValueOfCostToday(annualCostToday, inflationPercent, year);
  }
  return total;
}
