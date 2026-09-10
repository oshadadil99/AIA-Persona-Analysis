import type { ChildProfileInput } from "@/types/child-profile";
import { TYPICAL_HIGHER_EDUCATION_AGE } from "@/types/child-profile";
import {
  COST_ASSUMPTIONS,
  A_LEVEL_TUITION_ASSUMPTIONS,
  A_LEVEL_PERIOD_YEARS,
  A_LEVEL_MATERIALS_ASSUMPTIONS,
  LOCAL_PRIVATE_DEGREE_COSTS_BY_FIELD,
  LOCAL_PRIVATE_DEGREE_COST_SOURCE,
  LOCAL_PRIVATE_LIVING_EXPENSE_CATEGORIES,
  LOCAL_PRIVATE_LIVING_BUDGET_TIERS,
  GOVERNMENT_UNIVERSITY_TUITION_LKR,
  GOVERNMENT_UNIVERSITY_TUITION_SOURCE,
  GOVERNMENT_DEGREE_DURATION_YEARS_MIN,
  GOVERNMENT_DEGREE_DURATION_YEARS_MAX,
  GOVERNMENT_UNIVERSITY_LIVING_SCENARIOS,
  VOCATIONAL_TRAINING_TUITION_LKR,
  VOCATIONAL_TRAINING_TUITION_SOURCE,
  VOCATIONAL_TRAINING_DURATION_YEARS,
  VOCATIONAL_TRAINING_LIVING_EXPENSE_CATEGORIES,
  VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MIN,
  VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MAX,
  OVERSEAS_DEGREE_COST_BREAKDOWN,
  OVERSEAS_DEGREE_COST_SOURCE,
  futureValueOfCostToday,
  requiredAnnualContribution,
  totalOfGrowingAnnualCost,
} from "./assumptions";

interface LumpSumProjection {
  applicable: boolean;
  totalCostTodayLkrMin: number;
  totalCostTodayLkrMax: number;
  projectedCostLkrMin: number;
  projectedCostLkrMax: number;
}

export interface ChildFutureProjection {
  yearsToHigherEducation: number;
  alreadyPastTypicalAge: boolean;
  assumptions: typeof COST_ASSUMPTIONS;
  education: {
    scenario: "local_degree" | "overseas_degree";
    fieldOfStudyLabel: string | null; // set when local_degree uses field-specific data
    source: string;
    durationYearsMin: number;
    durationYearsMax: number;
    // Set only when the university bills per-semester (local private degree
    // with field-specific source data) — null for free/government/vocational
    // and for overseas (billed annually, not per-semester).
    perSemesterLkrMin: number | null;
    perSemesterLkrMax: number | null;
    perYearCostTodayLkrMin: number;
    perYearCostTodayLkrMax: number;
    costTodayLkrMin: number;
    costTodayLkrMax: number;
    projectedCostAtAge19LkrMin: number;
    projectedCostAtAge19LkrMax: number;
    // Required monthly saving to cover the upper (max) end of the projected
    // range — the conservative/worst-case figure, per growth-rate scenario.
    requiredMonthlySavingByGrowthRateLkr: Record<string, number>;
  }[];
  healthRisk: {
    flagged: boolean;
    referenceAmountLkr: number;
    note: string;
  };
  sports: {
    provided: boolean;
    monthlyCostLkr: number | null;
    totalProjectedCostLkr: number;
  };
  alTuition: LumpSumProjection & {
    yearsUntilStart: number;
    breakdown: {
      perClassMonthlyFeeLkrMin: number;
      perClassMonthlyFeeLkrMax: number;
      classesPerMonth: number;
      monthlyCostLkrMin: number;
      monthlyCostLkrMax: number;
      durationMonths: number;
    };
  };
  alMaterials: LumpSumProjection & { annualCostLkrMin: number; annualCostLkrMax: number };
  alCombinedTotal: LumpSumProjection;
  // Only applicable when higherEducationPlan === "local_private_degree" —
  // living costs specific to that student type (hostel/boarding, food, etc).
  localPrivateLivingExpenses: {
    applicable: boolean;
    monthlyCategories: typeof LOCAL_PRIVATE_LIVING_EXPENSE_CATEGORIES;
    budgetTiers: typeof LOCAL_PRIVATE_LIVING_BUDGET_TIERS;
    degreeDurationYearsMin: number;
    degreeDurationYearsMax: number;
    totalLivingCostTodayLkrMin: number;
    totalLivingCostTodayLkrMax: number;
    projectedTotalLivingCostLkrMin: number;
    projectedTotalLivingCostLkrMax: number;
  };
  // Only applicable when higherEducationPlan === "local_government_degree" —
  // two distinct scenarios shown separately (never merged), since which one
  // applies depends on hostel allocation and Mahapola eligibility.
  governmentUniversityLivingExpenses: {
    applicable: boolean;
    degreeDurationYearsMin: number;
    degreeDurationYearsMax: number;
    scenarios: {
      label: string;
      accommodationLkrMin: number;
      accommodationLkrMax: number;
      accommodationNote: string;
      foodLkrMin: number;
      foodLkrMax: number;
      transportLkrMin: number;
      transportLkrMax: number;
      miscLkrMin: number;
      miscLkrMax: number;
      averageGrossMonthlyLkr: number;
      mahapolaMonthlyLkr: number | null;
      mahapolaMonthsPerYear: number | null;
      effectiveMonthlyAverageLkr: number;
      totalCostTodayLkrMin: number;
      totalCostTodayLkrMax: number;
      projectedTotalCostLkrMin: number;
      projectedTotalCostLkrMax: number;
    }[];
    // Envelope across both scenarios (best case to worst case) — used for the
    // grand total's living-cost component, not shown as a replacement for the
    // two scenarios above.
    combinedEnvelope: {
      totalCostTodayLkrMin: number;
      totalCostTodayLkrMax: number;
      projectedTotalCostLkrMin: number;
      projectedTotalCostLkrMax: number;
    };
  };
  // Only applicable when higherEducationPlan === "overseas_degree" —
  // itemized breakdown behind the overseas degree cost range shown in the
  // `education` array above.
  overseasDegreeCostBreakdown: {
    applicable: boolean;
    durationYears: number;
    tuitionLkrMin: number;
    tuitionLkrMax: number;
    accommodationLkrMin: number;
    accommodationLkrMax: number;
    foodLkrMin: number;
    foodLkrMax: number;
    healthInsuranceLkrMin: number;
    healthInsuranceLkrMax: number;
    transportCommunicationsLkrMin: number;
    transportCommunicationsLkrMax: number;
    grandTotalTodayLkrMin: number;
    grandTotalTodayLkrMax: number;
    projectedGrandTotalLkrMin: number;
    projectedGrandTotalLkrMax: number;
  };
  // Only applicable when higherEducationPlan === "vocational_training".
  vocationalTrainingLivingExpenses: {
    applicable: boolean;
    durationYears: number;
    monthlyCategories: typeof VOCATIONAL_TRAINING_LIVING_EXPENSE_CATEGORIES;
    averageMonthlyLkrMin: number;
    averageMonthlyLkrMax: number;
    totalCostTodayLkrMin: number;
    totalCostTodayLkrMax: number;
    projectedTotalCostLkrMin: number;
    projectedTotalCostLkrMax: number;
  };
  // How the household's EXISTING monthly expenses combine with the NEW
  // education-related monthly cost at each stage — shown separately for
  // A/Level and university since the new cost differs a lot between them.
  // Both the base expense and the new cost are inflated to the point each
  // stage actually starts, so they're on the same footing when summed.
  monthlyBudgetImpact: {
    aLevelPeriod: {
      applicable: boolean;
      yearsUntilStart: number;
      currentMonthlyExpenseLkr: number;
      newCostMonthlyLkrMin: number;
      newCostMonthlyLkrMax: number;
      projectedExpenseLkr: number;
      projectedNewCostLkrMin: number;
      projectedNewCostLkrMax: number;
      projectedTotalBurdenLkrMin: number;
      projectedTotalBurdenLkrMax: number;
    };
    universityPeriod: {
      applicable: boolean;
      yearsUntilStart: number;
      currentMonthlyExpenseLkr: number;
      newCostMonthlyLkrMin: number;
      newCostMonthlyLkrMax: number;
      projectedExpenseLkr: number;
      projectedNewCostLkrMin: number;
      projectedNewCostLkrMax: number;
      projectedTotalBurdenLkrMin: number;
      projectedTotalBurdenLkrMax: number;
    };
  };
  // Pre-computed sum of the sections above — never let the LLM add these
  // figures together itself.
  grandTotal: {
    components: {
      aLevelPeriodProjectedLkrMin: number;
      aLevelPeriodProjectedLkrMax: number;
      degreeCostProjectedLkrMin: number;
      degreeCostProjectedLkrMax: number;
      livingCostProjectedLkrMin: number;
      livingCostProjectedLkrMax: number;
    };
    projectedTotalLkrMin: number;
    projectedTotalLkrMax: number;
  };
}

// Projects a cost that's given as an annual figure, recurring over the whole
// ~2.5-year A/Level period, as a single lump sum inflated to when the period
// starts. Same simplifying method used for tuition — treats the multi-year
// period's total as one future value rather than modeling year-by-year spend.
function projectAnnualCostOverALPeriod(
  annualCostLkrMin: number,
  annualCostLkrMax: number,
  applicable: boolean,
  yearsUntilStart: number,
  inflationPercent: number,
): LumpSumProjection & { annualCostLkrMin: number; annualCostLkrMax: number } {
  const totalCostTodayLkrMin = Math.round(annualCostLkrMin * A_LEVEL_PERIOD_YEARS);
  const totalCostTodayLkrMax = Math.round(annualCostLkrMax * A_LEVEL_PERIOD_YEARS);

  return {
    applicable,
    annualCostLkrMin,
    annualCostLkrMax,
    totalCostTodayLkrMin,
    totalCostTodayLkrMax,
    projectedCostLkrMin: applicable
      ? Math.round(futureValueOfCostToday(totalCostTodayLkrMin, inflationPercent, yearsUntilStart))
      : 0,
    projectedCostLkrMax: applicable
      ? Math.round(futureValueOfCostToday(totalCostTodayLkrMax, inflationPercent, yearsUntilStart))
      : 0,
  };
}

// Deterministic projection for the child-future-report agent. Pure function,
// no LLM — arithmetic on stated assumptions only. The narrative/Sinhala step
// consumes this output verbatim and must not invent its own numbers.
export function projectChildFuture(profile: ChildProfileInput): ChildFutureProjection {
  const yearsToHigherEducation = Math.max(TYPICAL_HIGHER_EDUCATION_AGE - profile.childAge, 0);
  const alreadyPastTypicalAge = profile.childAge >= TYPICAL_HIGHER_EDUCATION_AGE;
  const inflation = COST_ASSUMPTIONS.generalCostInflationPercent;

  // Local degree cost: use the field-specific range when the operator picked
  // "local_private_degree" and a field of study; otherwise fall back to the
  // generic placeholder range (shown as a degenerate min=max range so the
  // output shape stays consistent — always a range, per instruction).
  const localField =
    profile.higherEducationPlan === "local_private_degree" && profile.localPrivateDegreeField
      ? LOCAL_PRIVATE_DEGREE_COSTS_BY_FIELD[profile.localPrivateDegreeField]
      : null;

  const localDegreeScenario: {
    scenario: "local_degree";
    fieldOfStudyLabel: string | null;
    source: string;
    costTodayLkrMin: number;
    costTodayLkrMax: number;
    durationYearsMin: number;
    durationYearsMax: number;
    perSemesterLkrMin: number | null;
    perSemesterLkrMax: number | null;
  } =
    profile.higherEducationPlan === "local_government_degree"
      ? {
          scenario: "local_degree",
          fieldOfStudyLabel: null,
          source: GOVERNMENT_UNIVERSITY_TUITION_SOURCE,
          costTodayLkrMin: GOVERNMENT_UNIVERSITY_TUITION_LKR,
          costTodayLkrMax: GOVERNMENT_UNIVERSITY_TUITION_LKR,
          durationYearsMin: GOVERNMENT_DEGREE_DURATION_YEARS_MIN,
          durationYearsMax: GOVERNMENT_DEGREE_DURATION_YEARS_MAX,
          perSemesterLkrMin: null,
          perSemesterLkrMax: null,
        }
      : profile.higherEducationPlan === "vocational_training"
        ? {
            scenario: "local_degree",
            fieldOfStudyLabel: null,
            source: VOCATIONAL_TRAINING_TUITION_SOURCE,
            costTodayLkrMin: VOCATIONAL_TRAINING_TUITION_LKR,
            costTodayLkrMax: VOCATIONAL_TRAINING_TUITION_LKR,
            durationYearsMin: VOCATIONAL_TRAINING_DURATION_YEARS,
            durationYearsMax: VOCATIONAL_TRAINING_DURATION_YEARS,
            perSemesterLkrMin: null,
            perSemesterLkrMax: null,
          }
      : localField
        ? {
            scenario: "local_degree",
            fieldOfStudyLabel: localField.label,
            source: LOCAL_PRIVATE_DEGREE_COST_SOURCE,
            costTodayLkrMin: localField.totalDegreeLkrMin,
            costTodayLkrMax: localField.totalDegreeLkrMax,
            durationYearsMin: localField.durationYearsMin,
            durationYearsMax: localField.durationYearsMax,
            perSemesterLkrMin: localField.perSemesterLkrMin,
            perSemesterLkrMax: localField.perSemesterLkrMax,
          }
        : {
            scenario: "local_degree",
            fieldOfStudyLabel: null,
            source: COST_ASSUMPTIONS.disclaimer,
            costTodayLkrMin: COST_ASSUMPTIONS.localDegreeCostTodayLkr,
            costTodayLkrMax: COST_ASSUMPTIONS.localDegreeCostTodayLkr,
            durationYearsMin: 3,
            durationYearsMax: 4,
            perSemesterLkrMin: null,
            perSemesterLkrMax: null,
          };

  const scenarios: {
    scenario: "local_degree" | "overseas_degree";
    fieldOfStudyLabel: string | null;
    source: string;
    costTodayLkrMin: number;
    costTodayLkrMax: number;
    durationYearsMin: number;
    durationYearsMax: number;
    perSemesterLkrMin: number | null;
    perSemesterLkrMax: number | null;
  }[] = [
    localDegreeScenario,
    {
      scenario: "overseas_degree",
      fieldOfStudyLabel: null,
      source: OVERSEAS_DEGREE_COST_SOURCE,
      costTodayLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.grandTotalLkrMin,
      costTodayLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.grandTotalLkrMax,
      durationYearsMin: OVERSEAS_DEGREE_COST_BREAKDOWN.durationYears,
      durationYearsMax: OVERSEAS_DEGREE_COST_BREAKDOWN.durationYears,
      // Overseas is billed annually, not per-semester.
      perSemesterLkrMin: null,
      perSemesterLkrMax: null,
    },
  ];

  const education = scenarios.map(
    ({
      scenario,
      fieldOfStudyLabel,
      source,
      costTodayLkrMin,
      costTodayLkrMax,
      durationYearsMin,
      durationYearsMax,
      perSemesterLkrMin,
      perSemesterLkrMax,
    }) => {
      const projectedCostAtAge19LkrMin = Math.round(
        futureValueOfCostToday(costTodayLkrMin, inflation, yearsToHigherEducation),
      );
      const projectedCostAtAge19LkrMax = Math.round(
        futureValueOfCostToday(costTodayLkrMax, inflation, yearsToHigherEducation),
      );

      const requiredMonthlySavingByGrowthRateLkr: Record<string, number> = {};
      for (const growthPercent of COST_ASSUMPTIONS.savingsGrowthScenariosPercent) {
        const key = `${growthPercent}%`;
        const annual = requiredAnnualContribution(
          projectedCostAtAge19LkrMax,
          growthPercent,
          yearsToHigherEducation,
        );
        requiredMonthlySavingByGrowthRateLkr[key] = Math.round(annual / 12);
      }

      // "Per year" is a simple average (total / duration) — a transparent
      // derived figure, not a separately-sourced number.
      const perYearCostTodayLkrMin = Math.round(costTodayLkrMin / durationYearsMax);
      const perYearCostTodayLkrMax = Math.round(costTodayLkrMax / durationYearsMin);

      return {
        scenario,
        fieldOfStudyLabel,
        source,
        durationYearsMin,
        durationYearsMax,
        perSemesterLkrMin,
        perSemesterLkrMax,
        perYearCostTodayLkrMin,
        perYearCostTodayLkrMax,
        costTodayLkrMin,
        costTodayLkrMax,
        projectedCostAtAge19LkrMin,
        projectedCostAtAge19LkrMax,
        requiredMonthlySavingByGrowthRateLkr,
      };
    },
  );

  const healthFlagged = profile.criticalIllnesses.length > 0;
  const healthRisk = {
    flagged: healthFlagged,
    referenceAmountLkr: COST_ASSUMPTIONS.criticalIllnessCoverReferenceAmountLkr,
    note: healthFlagged
      ? `Health flags noted. As a reference point (not a recommendation of any specific cover amount), ` +
        `the policy's own Critical Illness Cover rider covers up to LKR ${COST_ASSUMPTIONS.criticalIllnessCoverReferenceAmountLkr.toLocaleString()} ` +
        `for 22 listed illnesses — a licensed advisor should confirm what cover level actually fits this child's specific condition(s).`
      : "No health flags noted.",
  };

  const sportsProvided = !!profile.sportsPlanDescription && !!profile.sportsMonthlyCostLkr;
  const sports = {
    provided: sportsProvided,
    monthlyCostLkr: sportsProvided ? profile.sportsMonthlyCostLkr! : null,
    totalProjectedCostLkr: sportsProvided
      ? Math.round(
          totalOfGrowingAnnualCost(profile.sportsMonthlyCostLkr! * 12, inflation, yearsToHigherEducation),
        )
      : 0,
  };

  const alApplicable = profile.childAge < A_LEVEL_TUITION_ASSUMPTIONS.typicalStartAge;
  const yearsUntilALStart = Math.max(A_LEVEL_TUITION_ASSUMPTIONS.typicalStartAge - profile.childAge, 0);

  const alTuition = {
    applicable: alApplicable,
    yearsUntilStart: yearsUntilALStart,
    breakdown: {
      perClassMonthlyFeeLkrMin: A_LEVEL_TUITION_ASSUMPTIONS.perClassMonthlyFeeLkrMin,
      perClassMonthlyFeeLkrMax: A_LEVEL_TUITION_ASSUMPTIONS.perClassMonthlyFeeLkrMax,
      classesPerMonth: A_LEVEL_TUITION_ASSUMPTIONS.classesPerMonth,
      monthlyCostLkrMin: A_LEVEL_TUITION_ASSUMPTIONS.monthlyCostLkrMin,
      monthlyCostLkrMax: A_LEVEL_TUITION_ASSUMPTIONS.monthlyCostLkrMax,
      durationMonths: A_LEVEL_TUITION_ASSUMPTIONS.durationMonths,
    },
    totalCostTodayLkrMin: A_LEVEL_TUITION_ASSUMPTIONS.totalCostTodayLkrMin,
    totalCostTodayLkrMax: A_LEVEL_TUITION_ASSUMPTIONS.totalCostTodayLkrMax,
    projectedCostLkrMin: alApplicable
      ? Math.round(
          futureValueOfCostToday(A_LEVEL_TUITION_ASSUMPTIONS.totalCostTodayLkrMin, inflation, yearsUntilALStart),
        )
      : 0,
    projectedCostLkrMax: alApplicable
      ? Math.round(
          futureValueOfCostToday(A_LEVEL_TUITION_ASSUMPTIONS.totalCostTodayLkrMax, inflation, yearsUntilALStart),
        )
      : 0,
  };

  const alMaterials = projectAnnualCostOverALPeriod(
    A_LEVEL_MATERIALS_ASSUMPTIONS.annualCostLkrMin,
    A_LEVEL_MATERIALS_ASSUMPTIONS.annualCostLkrMax,
    alApplicable,
    yearsUntilALStart,
    inflation,
  );

  // Combined total: tuition + materials.
  const combinedTodayMin = alTuition.totalCostTodayLkrMin + alMaterials.totalCostTodayLkrMin;
  const combinedTodayMax = alTuition.totalCostTodayLkrMax + alMaterials.totalCostTodayLkrMax;

  const alCombinedTotal: LumpSumProjection = {
    applicable: alApplicable,
    totalCostTodayLkrMin: combinedTodayMin,
    totalCostTodayLkrMax: combinedTodayMax,
    projectedCostLkrMin: alApplicable
      ? Math.round(futureValueOfCostToday(combinedTodayMin, inflation, yearsUntilALStart))
      : 0,
    projectedCostLkrMax: alApplicable
      ? Math.round(futureValueOfCostToday(combinedTodayMax, inflation, yearsUntilALStart))
      : 0,
  };

  const livingApplicable = profile.higherEducationPlan === "local_private_degree";
  const degreeDurationYearsMin = localField?.durationYearsMin ?? 3;
  const degreeDurationYearsMax = localField?.durationYearsMax ?? 4;

  const totalLivingCostTodayLkrMin = LOCAL_PRIVATE_LIVING_BUDGET_TIERS.saverLkrMin * 12 * degreeDurationYearsMin;
  const totalLivingCostTodayLkrMax = LOCAL_PRIVATE_LIVING_BUDGET_TIERS.moderateLkrMax * 12 * degreeDurationYearsMax;

  const localPrivateLivingExpenses = {
    applicable: livingApplicable,
    monthlyCategories: LOCAL_PRIVATE_LIVING_EXPENSE_CATEGORIES,
    budgetTiers: LOCAL_PRIVATE_LIVING_BUDGET_TIERS,
    degreeDurationYearsMin,
    degreeDurationYearsMax,
    totalLivingCostTodayLkrMin,
    totalLivingCostTodayLkrMax,
    projectedTotalLivingCostLkrMin: livingApplicable
      ? Math.round(futureValueOfCostToday(totalLivingCostTodayLkrMin, inflation, yearsToHigherEducation))
      : 0,
    projectedTotalLivingCostLkrMax: livingApplicable
      ? Math.round(futureValueOfCostToday(totalLivingCostTodayLkrMax, inflation, yearsToHigherEducation))
      : 0,
  };

  const governmentLivingApplicable = profile.higherEducationPlan === "local_government_degree";
  const govDegreeDurationYearsMin = GOVERNMENT_DEGREE_DURATION_YEARS_MIN;
  const govDegreeDurationYearsMax = GOVERNMENT_DEGREE_DURATION_YEARS_MAX;

  const governmentScenarioInputs = [
    GOVERNMENT_UNIVERSITY_LIVING_SCENARIOS.hostelWithMahapola,
    GOVERNMENT_UNIVERSITY_LIVING_SCENARIOS.privateBoardingNoMahapola,
  ];

  const governmentScenarios = governmentScenarioInputs.map((s) => {
    // When Mahapola applies, it only offsets the cost for 10 of 12 months —
    // the other 2 months are paid at the full gross rate. This weighted
    // average is real arithmetic on the operator's own given figures, not an
    // invented number.
    const effectiveMonthlyAverageLkr =
      s.mahapolaMonthlyLkr != null && s.mahapolaMonthsPerYear != null
        ? Math.round(
            (s.mahapolaMonthsPerYear * (s.averageGrossMonthlyLkr - s.mahapolaMonthlyLkr) +
              (12 - s.mahapolaMonthsPerYear) * s.averageGrossMonthlyLkr) /
              12,
          )
        : s.averageGrossMonthlyLkr;

    const totalCostTodayLkrMin = effectiveMonthlyAverageLkr * 12 * govDegreeDurationYearsMin;
    const totalCostTodayLkrMax = effectiveMonthlyAverageLkr * 12 * govDegreeDurationYearsMax;

    return {
      label: s.label,
      accommodationLkrMin: s.accommodationLkrMin,
      accommodationLkrMax: s.accommodationLkrMax,
      accommodationNote: s.accommodationNote,
      foodLkrMin: s.foodLkrMin,
      foodLkrMax: s.foodLkrMax,
      transportLkrMin: s.transportLkrMin,
      transportLkrMax: s.transportLkrMax,
      miscLkrMin: s.miscLkrMin,
      miscLkrMax: s.miscLkrMax,
      averageGrossMonthlyLkr: s.averageGrossMonthlyLkr,
      mahapolaMonthlyLkr: s.mahapolaMonthlyLkr,
      mahapolaMonthsPerYear: s.mahapolaMonthsPerYear,
      effectiveMonthlyAverageLkr,
      totalCostTodayLkrMin,
      totalCostTodayLkrMax,
      projectedTotalCostLkrMin: governmentLivingApplicable
        ? Math.round(futureValueOfCostToday(totalCostTodayLkrMin, inflation, yearsToHigherEducation))
        : 0,
      projectedTotalCostLkrMax: governmentLivingApplicable
        ? Math.round(futureValueOfCostToday(totalCostTodayLkrMax, inflation, yearsToHigherEducation))
        : 0,
    };
  });

  // Envelope: best case (hostel+Mahapola, shortest duration) to worst case
  // (private boarding, longest duration) — used only for the grand total.
  const govEnvelopeTodayMin = Math.min(...governmentScenarios.map((s) => s.totalCostTodayLkrMin));
  const govEnvelopeTodayMax = Math.max(...governmentScenarios.map((s) => s.totalCostTodayLkrMax));

  const governmentUniversityLivingExpenses = {
    applicable: governmentLivingApplicable,
    degreeDurationYearsMin: govDegreeDurationYearsMin,
    degreeDurationYearsMax: govDegreeDurationYearsMax,
    scenarios: governmentScenarios,
    combinedEnvelope: {
      totalCostTodayLkrMin: govEnvelopeTodayMin,
      totalCostTodayLkrMax: govEnvelopeTodayMax,
      projectedTotalCostLkrMin: governmentLivingApplicable
        ? Math.round(futureValueOfCostToday(govEnvelopeTodayMin, inflation, yearsToHigherEducation))
        : 0,
      projectedTotalCostLkrMax: governmentLivingApplicable
        ? Math.round(futureValueOfCostToday(govEnvelopeTodayMax, inflation, yearsToHigherEducation))
        : 0,
    },
  };

  const overseasApplicable = profile.higherEducationPlan === "overseas_degree";
  const overseasDegreeCostBreakdown = {
    applicable: overseasApplicable,
    durationYears: OVERSEAS_DEGREE_COST_BREAKDOWN.durationYears,
    tuitionLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.tuitionLkrMin,
    tuitionLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.tuitionLkrMax,
    accommodationLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.accommodationLkrMin,
    accommodationLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.accommodationLkrMax,
    foodLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.foodLkrMin,
    foodLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.foodLkrMax,
    healthInsuranceLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.healthInsuranceLkrMin,
    healthInsuranceLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.healthInsuranceLkrMax,
    transportCommunicationsLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.transportCommunicationsLkrMin,
    transportCommunicationsLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.transportCommunicationsLkrMax,
    grandTotalTodayLkrMin: OVERSEAS_DEGREE_COST_BREAKDOWN.grandTotalLkrMin,
    grandTotalTodayLkrMax: OVERSEAS_DEGREE_COST_BREAKDOWN.grandTotalLkrMax,
    projectedGrandTotalLkrMin: overseasApplicable
      ? Math.round(
          futureValueOfCostToday(OVERSEAS_DEGREE_COST_BREAKDOWN.grandTotalLkrMin, inflation, yearsToHigherEducation),
        )
      : 0,
    projectedGrandTotalLkrMax: overseasApplicable
      ? Math.round(
          futureValueOfCostToday(OVERSEAS_DEGREE_COST_BREAKDOWN.grandTotalLkrMax, inflation, yearsToHigherEducation),
        )
      : 0,
  };

  const vocationalApplicable = profile.higherEducationPlan === "vocational_training";
  const vocationalTotalTodayLkrMin =
    VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MIN * 12 * VOCATIONAL_TRAINING_DURATION_YEARS;
  const vocationalTotalTodayLkrMax =
    VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MAX * 12 * VOCATIONAL_TRAINING_DURATION_YEARS;

  const vocationalTrainingLivingExpenses = {
    applicable: vocationalApplicable,
    durationYears: VOCATIONAL_TRAINING_DURATION_YEARS,
    monthlyCategories: VOCATIONAL_TRAINING_LIVING_EXPENSE_CATEGORIES,
    averageMonthlyLkrMin: VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MIN,
    averageMonthlyLkrMax: VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MAX,
    totalCostTodayLkrMin: vocationalTotalTodayLkrMin,
    totalCostTodayLkrMax: vocationalTotalTodayLkrMax,
    projectedTotalCostLkrMin: vocationalApplicable
      ? Math.round(futureValueOfCostToday(vocationalTotalTodayLkrMin, inflation, yearsToHigherEducation))
      : 0,
    projectedTotalCostLkrMax: vocationalApplicable
      ? Math.round(futureValueOfCostToday(vocationalTotalTodayLkrMax, inflation, yearsToHigherEducation))
      : 0,
  };

  // Grand total: A/Level costs + the degree cost that matches the ACTUAL
  // stated plan + living expenses (if applicable). Computed here in code, not
  // left for the LLM to add up itself — three separately-inflated figures
  // (each anchored to a different future point) summed is exactly the kind
  // of arithmetic an LLM can get subtly wrong, so it must never do this math.
  const chosenEducationScenario =
    education.find((e) => e.scenario === (profile.higherEducationPlan === "overseas_degree" ? "overseas_degree" : "local_degree")) ??
    education[0];

  const livingCostProjectedLkrMin = localPrivateLivingExpenses.applicable
    ? localPrivateLivingExpenses.projectedTotalLivingCostLkrMin
    : governmentUniversityLivingExpenses.applicable
      ? governmentUniversityLivingExpenses.combinedEnvelope.projectedTotalCostLkrMin
      : vocationalTrainingLivingExpenses.applicable
        ? vocationalTrainingLivingExpenses.projectedTotalCostLkrMin
        : 0;
  const livingCostProjectedLkrMax = localPrivateLivingExpenses.applicable
    ? localPrivateLivingExpenses.projectedTotalLivingCostLkrMax
    : governmentUniversityLivingExpenses.applicable
      ? governmentUniversityLivingExpenses.combinedEnvelope.projectedTotalCostLkrMax
      : vocationalTrainingLivingExpenses.applicable
        ? vocationalTrainingLivingExpenses.projectedTotalCostLkrMax
        : 0;

  // --- Monthly budget impact: existing expense + new education cost, at
  // each stage, both inflated to the point that stage actually starts. ---
  const householdExpenseLkr = profile.householdMonthlyExpenseLkr;

  const alNewCostMonthlyLkrMin = alTuition.breakdown.monthlyCostLkrMin + alMaterials.annualCostLkrMin / 12;
  const alNewCostMonthlyLkrMax = alTuition.breakdown.monthlyCostLkrMax + alMaterials.annualCostLkrMax / 12;
  const alProjectedExpenseLkr = alTuition.applicable
    ? Math.round(futureValueOfCostToday(householdExpenseLkr, inflation, yearsUntilALStart))
    : 0;
  const alProjectedNewCostLkrMin = alTuition.applicable
    ? Math.round(futureValueOfCostToday(alNewCostMonthlyLkrMin, inflation, yearsUntilALStart))
    : 0;
  const alProjectedNewCostLkrMax = alTuition.applicable
    ? Math.round(futureValueOfCostToday(alNewCostMonthlyLkrMax, inflation, yearsUntilALStart))
    : 0;

  const aLevelPeriodBudgetImpact = {
    applicable: alTuition.applicable,
    yearsUntilStart: yearsUntilALStart,
    currentMonthlyExpenseLkr: householdExpenseLkr,
    newCostMonthlyLkrMin: Math.round(alNewCostMonthlyLkrMin),
    newCostMonthlyLkrMax: Math.round(alNewCostMonthlyLkrMax),
    projectedExpenseLkr: alProjectedExpenseLkr,
    projectedNewCostLkrMin: alProjectedNewCostLkrMin,
    projectedNewCostLkrMax: alProjectedNewCostLkrMax,
    projectedTotalBurdenLkrMin: alProjectedExpenseLkr + alProjectedNewCostLkrMin,
    projectedTotalBurdenLkrMax: alProjectedExpenseLkr + alProjectedNewCostLkrMax,
  };

  // University-period new cost: tuition (simple per-year average) + living
  // cost, using whichever living-cost source matches the stated plan —
  // except overseas, where the sourced grand total already bundles tuition
  // and living together, so it's used directly instead of summed separately.
  const uniTuitionMonthlyMin = chosenEducationScenario.perYearCostTodayLkrMin / 12;
  const uniTuitionMonthlyMax = chosenEducationScenario.perYearCostTodayLkrMax / 12;

  let uniLivingMonthlyMin = 0;
  let uniLivingMonthlyMax = 0;
  if (profile.higherEducationPlan === "local_private_degree") {
    uniLivingMonthlyMin = LOCAL_PRIVATE_LIVING_BUDGET_TIERS.saverLkrMin;
    uniLivingMonthlyMax = LOCAL_PRIVATE_LIVING_BUDGET_TIERS.moderateLkrMax;
  } else if (profile.higherEducationPlan === "local_government_degree") {
    const monthlies = governmentScenarios.map((s) => s.effectiveMonthlyAverageLkr);
    uniLivingMonthlyMin = Math.min(...monthlies);
    uniLivingMonthlyMax = Math.max(...monthlies);
  } else if (profile.higherEducationPlan === "vocational_training") {
    uniLivingMonthlyMin = VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MIN;
    uniLivingMonthlyMax = VOCATIONAL_TRAINING_AVERAGE_MONTHLY_LKR_MAX;
  }

  const isOverseasPlan = profile.higherEducationPlan === "overseas_degree";
  const uniNewCostMonthlyLkrMin = isOverseasPlan
    ? overseasDegreeCostBreakdown.grandTotalTodayLkrMin / (overseasDegreeCostBreakdown.durationYears * 12)
    : uniTuitionMonthlyMin + uniLivingMonthlyMin;
  const uniNewCostMonthlyLkrMax = isOverseasPlan
    ? overseasDegreeCostBreakdown.grandTotalTodayLkrMax / (overseasDegreeCostBreakdown.durationYears * 12)
    : uniTuitionMonthlyMax + uniLivingMonthlyMax;

  const uniProjectedExpenseLkr = Math.round(
    futureValueOfCostToday(householdExpenseLkr, inflation, yearsToHigherEducation),
  );
  const uniProjectedNewCostLkrMin = Math.round(
    futureValueOfCostToday(uniNewCostMonthlyLkrMin, inflation, yearsToHigherEducation),
  );
  const uniProjectedNewCostLkrMax = Math.round(
    futureValueOfCostToday(uniNewCostMonthlyLkrMax, inflation, yearsToHigherEducation),
  );

  const universityPeriodBudgetImpact = {
    applicable: true,
    yearsUntilStart: yearsToHigherEducation,
    currentMonthlyExpenseLkr: householdExpenseLkr,
    newCostMonthlyLkrMin: Math.round(uniNewCostMonthlyLkrMin),
    newCostMonthlyLkrMax: Math.round(uniNewCostMonthlyLkrMax),
    projectedExpenseLkr: uniProjectedExpenseLkr,
    projectedNewCostLkrMin: uniProjectedNewCostLkrMin,
    projectedNewCostLkrMax: uniProjectedNewCostLkrMax,
    projectedTotalBurdenLkrMin: uniProjectedExpenseLkr + uniProjectedNewCostLkrMin,
    projectedTotalBurdenLkrMax: uniProjectedExpenseLkr + uniProjectedNewCostLkrMax,
  };

  const monthlyBudgetImpact = {
    aLevelPeriod: aLevelPeriodBudgetImpact,
    universityPeriod: universityPeriodBudgetImpact,
  };

  const grandTotal = {
    components: {
      aLevelPeriodProjectedLkrMin: alCombinedTotal.projectedCostLkrMin,
      aLevelPeriodProjectedLkrMax: alCombinedTotal.projectedCostLkrMax,
      degreeCostProjectedLkrMin: chosenEducationScenario.projectedCostAtAge19LkrMin,
      degreeCostProjectedLkrMax: chosenEducationScenario.projectedCostAtAge19LkrMax,
      livingCostProjectedLkrMin,
      livingCostProjectedLkrMax,
    },
    projectedTotalLkrMin:
      alCombinedTotal.projectedCostLkrMin + chosenEducationScenario.projectedCostAtAge19LkrMin + livingCostProjectedLkrMin,
    projectedTotalLkrMax:
      alCombinedTotal.projectedCostLkrMax + chosenEducationScenario.projectedCostAtAge19LkrMax + livingCostProjectedLkrMax,
  };

  return {
    yearsToHigherEducation,
    alreadyPastTypicalAge,
    assumptions: COST_ASSUMPTIONS,
    education,
    healthRisk,
    sports,
    alTuition,
    alMaterials,
    alCombinedTotal,
    localPrivateLivingExpenses,
    governmentUniversityLivingExpenses,
    overseasDegreeCostBreakdown,
    vocationalTrainingLivingExpenses,
    monthlyBudgetImpact,
    grandTotal,
  };
}
