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

// Operator-provided local private university cost ranges by field of study,
// confirmed 2026-09-08. These are estimates, not fixed prices — actual fees
// vary by specific institution and can change year to year.
export const LOCAL_PRIVATE_DEGREE_COSTS_BY_FIELD: Record<
  import("@/types/child-profile").LocalPrivateDegreeField,
  {
    label: string;
    perSemesterLkrMin: number;
    perSemesterLkrMax: number;
    totalDegreeLkrMin: number;
    totalDegreeLkrMax: number;
    durationYearsMin: number;
    durationYearsMax: number;
  }
> = {
  business_management: {
    label: "Business & Management (BBA, Marketing, HR, Finance)",
    perSemesterLkrMin: 220_000,
    perSemesterLkrMax: 340_000,
    totalDegreeLkrMin: 1_800_000,
    totalDegreeLkrMax: 2_720_000,
    durationYearsMin: 3,
    durationYearsMax: 4,
  },
  humanities_social_healthcare: {
    label: "Humanities, Social Sciences & Healthcare (Psychology, Biotech, Nursing, BEd)",
    perSemesterLkrMin: 200_000,
    perSemesterLkrMax: 390_000,
    totalDegreeLkrMin: 1_600_000,
    totalDegreeLkrMax: 3_120_000,
    durationYearsMin: 3,
    durationYearsMax: 4,
  },
  computing_it: {
    label: "Computing & IT (Software Engineering, CS, Cyber Security, Data Science)",
    perSemesterLkrMin: 320_000,
    perSemesterLkrMax: 400_000,
    totalDegreeLkrMin: 2_400_000,
    totalDegreeLkrMax: 3_200_000,
    durationYearsMin: 4,
    durationYearsMax: 4,
  },
  engineering_built_environment: {
    label: "Engineering & Built Environment (Civil, Mechanical, Architecture, Quantity Surveying)",
    perSemesterLkrMin: 340_000,
    perSemesterLkrMax: 430_000,
    totalDegreeLkrMin: 2_580_000,
    totalDegreeLkrMax: 3_440_000,
    durationYearsMin: 3,
    durationYearsMax: 4,
  },
};
export const LOCAL_PRIVATE_DEGREE_COST_SOURCE =
  "Operator-provided estimate, confirmed 2026-09-08 — actual fees vary by institution, not fixed prices.";

// Monthly living-expense categories for a LOCAL PRIVATE UNIVERSITY student —
// ONLY these three categories, per operator instruction. No transport or
// mobile/internet line items. Accommodation and Food & Meals are each a
// single combined range (not broken into shared/single room or
// self-catering/eating-out sub-options) — confirmed 2026-09-08.
export const LOCAL_PRIVATE_LIVING_EXPENSE_CATEGORIES = {
  accommodationLkrMin: 10_000,
  accommodationLkrMax: 35_000,
  foodLkrMin: 15_000,
  foodLkrMax: 40_000,
  miscLkrMin: 5_000,
  miscLkrMax: 12_000,
};

// Pre-bundled realistic monthly budget tiers (not a naive sum of category
// maxes, which would overstate cost — a student picks a consistent lifestyle,
// not the most expensive option in every category at once).
export const LOCAL_PRIVATE_LIVING_BUDGET_TIERS = {
  saverLkrMin: 35_000,
  saverLkrMax: 45_000,
  saverDescription:
    "Shared hostel room close to campus, eating mostly canteen or home-cooked food, relying on public buses.",
  moderateLkrMin: 50_000,
  moderateLkrMax: 65_000,
  moderateDescription: "Single boarding room, mix of canteen and eating out, occasional PickMe/Uber rides.",
};

export const LOCAL_PRIVATE_LIVING_COST_SOURCE =
  "Operator-provided estimate, confirmed 2026-09-08 — for local private university students specifically, not fixed prices.";

// Sri Lankan government universities do not charge tuition fees.
export const GOVERNMENT_UNIVERSITY_TUITION_LKR = 0;
export const GOVERNMENT_UNIVERSITY_TUITION_SOURCE =
  "Government (state) universities in Sri Lanka do not charge tuition fees — free education.";

// General Sri Lankan undergraduate degree duration — not government-specific
// data from the operator, reused as a reasonable default (same as the local
// private degree fallback) since no government-specific duration was given.
export const GOVERNMENT_DEGREE_DURATION_YEARS_MIN = 3;
export const GOVERNMENT_DEGREE_DURATION_YEARS_MAX = 4;

// Living-cost scenarios for a LOCAL GOVERNMENT UNIVERSITY undergraduate,
// confirmed 2026-09-08. Two distinct scenarios depending on circumstances
// outside full control (hostel allocation is competitive; Mahapola
// eligibility is means-tested) — shown separately, never merged into one.
export const GOVERNMENT_UNIVERSITY_LIVING_SCENARIOS = {
  hostelWithMahapola: {
    label: "University-subsidized hostel + Mahapola scholarship",
    accommodationLkrMin: 0,
    accommodationLkrMax: 0,
    accommodationNote: "University-subsidized hostel — free.",
    foodLkrMin: 9_000,
    foodLkrMax: 16_000,
    transportLkrMin: 1_500,
    transportLkrMax: 4_000,
    miscLkrMin: 2_500,
    miscLkrMax: 5_000,
    averageGrossMonthlyLkr: 20_000,
    mahapolaMonthlyLkr: 10_000,
    mahapolaMonthsPerYear: 10,
  },
  privateBoardingNoMahapola: {
    label: "Private boarding (hostel unavailable, not Mahapola-eligible)",
    accommodationLkrMin: 6_000,
    accommodationLkrMax: 12_000,
    accommodationNote: "Shared room in a private boarding house near campus.",
    foodLkrMin: 9_000,
    foodLkrMax: 16_000,
    transportLkrMin: 1_500,
    transportLkrMax: 4_000,
    miscLkrMin: 2_500,
    miscLkrMax: 5_000,
    averageGrossMonthlyLkr: 35_000,
    mahapolaMonthlyLkr: null,
    mahapolaMonthsPerYear: null,
  },
};

export const GOVERNMENT_UNIVERSITY_LIVING_SOURCE =
  "Operator-provided estimate, confirmed 2026-09-08 — for local government university undergraduates specifically, not fixed prices.";

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
