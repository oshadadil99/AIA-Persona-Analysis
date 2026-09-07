import type { ChildProfileInput } from "@/types/child-profile";
import { TYPICAL_HIGHER_EDUCATION_AGE } from "@/types/child-profile";
import {
  COST_ASSUMPTIONS,
  A_LEVEL_TUITION_ASSUMPTIONS,
  A_LEVEL_PERIOD_YEARS,
  A_LEVEL_MATERIALS_ASSUMPTIONS,
  A_LEVEL_TRANSPORT_ASSUMPTIONS,
  A_LEVEL_EXAM_FEE_ASSUMPTIONS,
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
    projectedCostAtAge19Lkr: number;
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
  alTransport: LumpSumProjection & { annualCostLkrMin: number; annualCostLkrMax: number };
  alExamFee: {
    applicable: boolean;
    schoolCandidateLkr: number;
    privateCandidateLkrMin: number;
    privateCandidateLkrMax: number;
  };
  alCombinedTotal: LumpSumProjection;
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

  const scenarios: { scenario: "local_degree" | "overseas_degree"; costToday: number }[] = [
    { scenario: "local_degree", costToday: COST_ASSUMPTIONS.localDegreeCostTodayLkr },
    { scenario: "overseas_degree", costToday: COST_ASSUMPTIONS.overseasDegreeCostTodayLkr },
  ];

  const education = scenarios.map(({ scenario, costToday }) => {
    const projectedCostAtAge19Lkr = Math.round(
      futureValueOfCostToday(costToday, inflation, yearsToHigherEducation),
    );

    const requiredMonthlySavingByGrowthRateLkr: Record<string, number> = {};
    for (const growthPercent of COST_ASSUMPTIONS.savingsGrowthScenariosPercent) {
      const key = `${growthPercent}%`;
      const annual = requiredAnnualContribution(projectedCostAtAge19Lkr, growthPercent, yearsToHigherEducation);
      requiredMonthlySavingByGrowthRateLkr[key] = Math.round(annual / 12);
    }

    return { scenario, projectedCostAtAge19Lkr, requiredMonthlySavingByGrowthRateLkr };
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

  const alTransport = projectAnnualCostOverALPeriod(
    A_LEVEL_TRANSPORT_ASSUMPTIONS.annualCostLkrMin,
    A_LEVEL_TRANSPORT_ASSUMPTIONS.annualCostLkrMax,
    alApplicable,
    yearsUntilALStart,
    inflation,
  );

  const alExamFee = {
    applicable: alApplicable,
    schoolCandidateLkr: A_LEVEL_EXAM_FEE_ASSUMPTIONS.schoolCandidateLkr,
    privateCandidateLkrMin: A_LEVEL_EXAM_FEE_ASSUMPTIONS.privateCandidateLkrMin,
    privateCandidateLkrMax: A_LEVEL_EXAM_FEE_ASSUMPTIONS.privateCandidateLkrMax,
  };

  // Combined total: tuition + materials + transport + exam fee. Min uses the
  // school-candidate (free) exam fee, max uses the private-candidate fee.
  const combinedTodayMin =
    alTuition.totalCostTodayLkrMin + alMaterials.totalCostTodayLkrMin + alTransport.totalCostTodayLkrMin +
    A_LEVEL_EXAM_FEE_ASSUMPTIONS.schoolCandidateLkr;
  const combinedTodayMax =
    alTuition.totalCostTodayLkrMax + alMaterials.totalCostTodayLkrMax + alTransport.totalCostTodayLkrMax +
    A_LEVEL_EXAM_FEE_ASSUMPTIONS.privateCandidateLkrMax;

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

  return {
    yearsToHigherEducation,
    alreadyPastTypicalAge,
    assumptions: COST_ASSUMPTIONS,
    education,
    healthRisk,
    sports,
    alTuition,
    alMaterials,
    alTransport,
    alExamFee,
    alCombinedTotal,
  };
}
