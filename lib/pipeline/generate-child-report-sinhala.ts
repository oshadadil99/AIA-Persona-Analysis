import { callGemini } from "@/lib/gemini";
import type { ChildProfileInput } from "@/types/child-profile";
import type { ChildFutureProjection } from "./child-future-projection";

// LLM step: narrative connective text only, in Sinhala. Every number in the
// prompt comes from the deterministic projection — the model is instructed
// not to introduce any figure that isn't given to it (Section 3, step 4 rule).
export async function generateChildReportSinhala(
  profile: ChildProfileInput,
  projection: ChildFutureProjection,
): Promise<string> {
  const facts = buildFactsBlock(profile, projection);

  const prompt = `You are writing a plain-language financial planning report in SINHALA for a Sri Lankan
parent/guardian, based ONLY on the facts and numbers given below. This is an indicative, computer-generated
outlook — not a guarantee and not final insurance advice.

STRICT RULES:
- Write the entire report in Sinhala (Sinhala script), not English or Singlish.
- Do NOT invent, estimate, or adjust any number. Use only the exact figures given below.
- Every monetary figure you mention must come directly from the facts below.
- Clearly state that education/health cost figures are assumptions, not guaranteed facts.
- If the A/Level section applies, show the full breakdown for EACH cost category (tuition, learning materials,
  transport, exam fee) as a clear calculation, then a combined total — not just final numbers. The goal is for
  the parent to see exactly how each number is built and take it seriously, not to alarm them.
- Tone: constructive and informative, not fear-based.
- End with a line stating this is a computer-generated indicative report and final figures/advice should
  be confirmed with a licensed advisor.

FACTS:
${facts}

Write the report now, structured with short sections. If the A/Level section applies, it must be the first
substantive section, right after a brief intro line: (1) උසස් පෙළ (A/Level) කාලය තුළ වියදම් — covering tuition,
learning materials & stationery, transport, and exam fee as separate line items, then a combined total,
(2) දරුවාගේ අනාගත අධ්‍යාපන අවශ්‍යතාව, (3) මූල්‍යමය අභියෝගය, (4) සෞඛ්‍ය අවදානම (if applicable), (5) ක්‍රීඩා සම්බන්ධ
වියදම් (if applicable), (6) නිගමනය. If A/Level costs do not apply, skip that section and start from (2).`;

  const result = await callGemini(prompt);
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned no report text: ${JSON.stringify(result).slice(0, 300)}`);
  }
  return text;
}

function buildFactsBlock(profile: ChildProfileInput, projection: ChildFutureProjection): string {
  const lines: string[] = [];

  lines.push(`Child's current age: ${profile.childAge}`);
  lines.push(`Typical higher education entry age in Sri Lanka: 19`);
  lines.push(`Years until then: ${projection.yearsToHigherEducation}`);
  lines.push(`Province: ${profile.province}`);
  lines.push(`Household monthly income: LKR ${profile.householdMonthlyIncomeLkr.toLocaleString()}`);
  lines.push(`Stated higher education plan: ${profile.higherEducationPlan}`);
  lines.push(`Cost/inflation assumptions disclaimer: ${projection.assumptions.disclaimer}`);
  lines.push(`Assumed general cost inflation: ${projection.assumptions.generalCostInflationPercent}% per year`);

  for (const e of projection.education) {
    lines.push(
      `Scenario "${e.scenario}": projected cost at age 19 = LKR ${e.projectedCostAtAge19Lkr.toLocaleString()}. ` +
        `Required monthly saving by assumed investment growth rate: ${Object.entries(
          e.requiredMonthlySavingByGrowthRateLkr,
        )
          .map(([rate, amt]) => `${rate} growth -> LKR ${amt.toLocaleString()}/month`)
          .join("; ")}`,
    );
  }

  if (projection.alTuition.applicable) {
    const b = projection.alTuition.breakdown;
    const years = projection.alTuition.yearsUntilStart;

    lines.push(
      `A/Level period costs (applicable — child has not yet reached the typical A/Level start age of 17). ` +
        `Years until this child reaches A/Level age: ${years}. All figures below are LKR ranges (min-max).`,
    );

    lines.push(
      `1. Tuition classes — Per-class monthly fee: ${b.perClassMonthlyFeeLkrMin.toLocaleString()}-${b.perClassMonthlyFeeLkrMax.toLocaleString()}; ` +
        `Classes per month: ${b.classesPerMonth}; Monthly cost: ${b.monthlyCostLkrMin.toLocaleString()}-${b.monthlyCostLkrMax.toLocaleString()}; ` +
        `Duration: ${b.durationMonths} months (~2.5 years); Total today: ${projection.alTuition.totalCostTodayLkrMin.toLocaleString()}-${projection.alTuition.totalCostTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total: ${projection.alTuition.projectedCostLkrMin.toLocaleString()}-${projection.alTuition.projectedCostLkrMax.toLocaleString()}`,
    );

    lines.push(
      `2. Learning materials & stationery (books, past papers, model papers, lab workbooks, calculators) — ` +
        `Annual cost: ${projection.alMaterials.annualCostLkrMin.toLocaleString()}-${projection.alMaterials.annualCostLkrMax.toLocaleString()}; ` +
        `Total today (over ~2.5 years): ${projection.alMaterials.totalCostTodayLkrMin.toLocaleString()}-${projection.alMaterials.totalCostTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total: ${projection.alMaterials.projectedCostLkrMin.toLocaleString()}-${projection.alMaterials.projectedCostLkrMax.toLocaleString()}`,
    );

    lines.push(
      `3. Daily transport/commute (school and tuition, bus/train/three-wheeler) — ` +
        `Annual cost: ${projection.alTransport.annualCostLkrMin.toLocaleString()}-${projection.alTransport.annualCostLkrMax.toLocaleString()}; ` +
        `Total today (over ~2.5 years): ${projection.alTransport.totalCostTodayLkrMin.toLocaleString()}-${projection.alTransport.totalCostTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total: ${projection.alTransport.projectedCostLkrMin.toLocaleString()}-${projection.alTransport.projectedCostLkrMax.toLocaleString()}`,
    );

    lines.push(
      `4. Official exam registration fee — LKR ${projection.alExamFee.schoolCandidateLkr.toLocaleString()} if registered ` +
        `through school, LKR ${projection.alExamFee.privateCandidateLkrMin.toLocaleString()}-${projection.alExamFee.privateCandidateLkrMax.toLocaleString()} ` +
        `if a private candidate. Negligible amount, not inflation-adjusted.`,
    );

    lines.push(
      `Combined A/Level period total (tuition + materials + transport + exam fee) — Total today: ` +
        `LKR ${projection.alCombinedTotal.totalCostTodayLkrMin.toLocaleString()}-${projection.alCombinedTotal.totalCostTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total when this child reaches A/Level age: ` +
        `LKR ${projection.alCombinedTotal.projectedCostLkrMin.toLocaleString()}-${projection.alCombinedTotal.projectedCostLkrMax.toLocaleString()}`,
    );
  }

  if (projection.healthRisk.flagged) {
    lines.push(
      `Health flags: ${profile.criticalIllnesses.join(", ")}. ${projection.healthRisk.note}`,
    );
  }

  if (projection.sports.provided) {
    lines.push(
      `Sports plan: ${profile.sportsPlanDescription}. Estimated monthly cost: LKR ${profile.sportsMonthlyCostLkr?.toLocaleString()}. ` +
        `Total projected additional cost by age 19 (inflation-adjusted): LKR ${projection.sports.totalProjectedCostLkr.toLocaleString()}.`,
    );
  }

  return lines.join("\n");
}
