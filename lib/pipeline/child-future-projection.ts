import type { ChildProfileInput } from "@/types/child-profile";
import { TYPICAL_HIGHER_EDUCATION_AGE } from "@/types/child-profile";
import {
  COST_ASSUMPTIONS,
  A_LEVEL_TUITION_ASSUMPTIONS,
  futureValueOfCostToday,
  requiredAnnualContribution,
  totalOfGrowingAnnualCost,
} from "./assumptions";

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
  alTuition: {
    applicable: boolean;
    yearsUntilStart: number;
    breakdown: {
      perClassMonthlyFeeLkrMin: number;
      perClassMonthlyFeeLkrMax: number;
      classesPerMonth: number;
      monthlyCostLkrMin: number;
      monthlyCostLkrMax: number;
      durationMonths: number;
    };
    totalCostTodayLkrMin: number;
    totalCostTodayLkrMax: number;
    projectedCostLkrMin: number;
    projectedCostLkrMax: number;
  };
}

// Deterministic projection for the child-future-report agent. Pure function,
// no LLM — arithmetic on stated assumptions only. The narrative/Sinhala step
// consumes this output verbatim and must not invent its own numbers.
export function projectChildFuture(profile: ChildProfileInput): ChildFutureProjection {
  const yearsToHigherEducation = Math.max(TYPICAL_HIGHER_EDUCATION_AGE - profile.childAge, 0);
  const alreadyPastTypicalAge = profile.childAge >= TYPICAL_HIGHER_EDUCATION_AGE;

  const scenarios: { scenario: "local_degree" | "overseas_degree"; costToday: number }[] = [
    { scenario: "local_degree", costToday: COST_ASSUMPTIONS.localDegreeCostTodayLkr },
    { scenario: "overseas_degree", costToday: COST_ASSUMPTIONS.overseasDegreeCostTodayLkr },
  ];

  const education = scenarios.map(({ scenario, costToday }) => {
    const projectedCostAtAge19Lkr = Math.round(
      futureValueOfCostToday(costToday, COST_ASSUMPTIONS.generalCostInflationPercent, yearsToHigherEducation),
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
          totalOfGrowingAnnualCost(
            profile.sportsMonthlyCostLkr! * 12,
            COST_ASSUMPTIONS.generalCostInflationPercent,
            yearsToHigherEducation,
          ),
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
          futureValueOfCostToday(
            A_LEVEL_TUITION_ASSUMPTIONS.totalCostTodayLkrMin,
            COST_ASSUMPTIONS.generalCostInflationPercent,
            yearsUntilALStart,
          ),
        )
      : 0,
    projectedCostLkrMax: alApplicable
      ? Math.round(
          futureValueOfCostToday(
            A_LEVEL_TUITION_ASSUMPTIONS.totalCostTodayLkrMax,
            COST_ASSUMPTIONS.generalCostInflationPercent,
            yearsUntilALStart,
          ),
        )
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
  };
}
