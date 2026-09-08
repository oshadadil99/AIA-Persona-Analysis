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
  } =
    profile.higherEducationPlan === "local_government_degree"
      ? {
          scenario: "local_degree",
          fieldOfStudyLabel: null,
          source: GOVERNMENT_UNIVERSITY_TUITION_SOURCE,
          costTodayLkrMin: GOVERNMENT_UNIVERSITY_TUITION_LKR,
          costTodayLkrMax: GOVERNMENT_UNIVERSITY_TUITION_LKR,
        }
      : localField
        ? {
            scenario: "local_degree",
            fieldOfStudyLabel: localField.label,
            source: LOCAL_PRIVATE_DEGREE_COST_SOURCE,
            costTodayLkrMin: localField.totalDegreeLkrMin,
            costTodayLkrMax: localField.totalDegreeLkrMax,
          }
        : {
            scenario: "local_degree",
            fieldOfStudyLabel: null,
            source: COST_ASSUMPTIONS.disclaimer,
            costTodayLkrMin: COST_ASSUMPTIONS.localDegreeCostTodayLkr,
            costTodayLkrMax: COST_ASSUMPTIONS.localDegreeCostTodayLkr,
          };

  const scenarios: {
    scenario: "local_degree" | "overseas_degree";
    fieldOfStudyLabel: string | null;
    source: string;
    costTodayLkrMin: number;
    costTodayLkrMax: number;
  }[] = [
    localDegreeScenario,
    {
      scenario: "overseas_degree",
      fieldOfStudyLabel: null,
      source: COST_ASSUMPTIONS.disclaimer,
      costTodayLkrMin: COST_ASSUMPTIONS.overseasDegreeCostTodayLkr,
      costTodayLkrMax: COST_ASSUMPTIONS.overseasDegreeCostTodayLkr,
    },
  ];

  const education = scenarios.map(({ scenario, fieldOfStudyLabel, source, costTodayLkrMin, costTodayLkrMax }) => {
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

    return {
      scenario,
      fieldOfStudyLabel,
      source,
      costTodayLkrMin,
      costTodayLkrMax,
      projectedCostAtAge19LkrMin,
      projectedCostAtAge19LkrMax,
      requiredMonthlySavingByGrowthRateLkr,
    };
  });

  const healthFlagged = profile.criticalIllnesses.length > 0;
  const healthRisk = {
    flagged: healthFlagged,
    referenceAmountLkr: COST_ASSUMPTIONS.criticalIllnessCoverReferenceAmountLkr,
    note: healthFlagged
      ? `Health flags noted. As a reference point (not a recommendation of any specific cover amount), ` +
        `AIA's own Critical Illness Cover rider covers up to LKR ${COST_ASSUMPTIONS.criticalIllnessCoverReferenceAmountLkr.toLocaleString()} ` +
        `for 22 listed illnesses — a licensed advisor should confirm what cover level actually fits this child's specific condition(s).`
      : "No health flags noted.",
  };

  const sportsProvided = !!profile.sportsPlanDescription && !!profile.sportsMonthlyCostLkr;
  const sports = {
    provided: sportsProvided,
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
      : 0;
  const livingCostProjectedLkrMax = localPrivateLivingExpenses.applicable
    ? localPrivateLivingExpenses.projectedTotalLivingCostLkrMax
    : governmentUniversityLivingExpenses.applicable
      ? governmentUniversityLivingExpenses.combinedEnvelope.projectedTotalCostLkrMax
      : 0;

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
    grandTotal,
  };
}
