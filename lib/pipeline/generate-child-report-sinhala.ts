import { callGemini } from "@/lib/gemini";
import type { ChildProfileInput } from "@/types/child-profile";
import { HIGHER_EDUCATION_PLANS, LOCAL_PRIVATE_DEGREE_FIELDS } from "@/types/child-profile";
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
- Do NOT perform arithmetic yourself — including adding multiple section totals together into a grand total.
  If a combined/grand total is needed, use the pre-computed "Grand total" figure given in the facts below,
  never compute your own sum even if the addition seems simple.
- Every monetary figure you mention must come directly from the facts below.
- Clearly state that education/health cost figures are assumptions, not guaranteed facts.
- Only show a "breakdown then summary" structure when there is an ACTUAL multi-step calculation behind the
  number (e.g. per-class fee x classes/month x duration = total; or a cost figure broken into required monthly
  saving per growth-rate scenario). In those cases, show the calculation steps, then the resulting total.
  If a fact is just a single flat figure or range with nothing to calculate (e.g. "Accommodation: LKR
  10,000-35,000/month"), state it ONCE — do not invent a "breakdown" section and a "summary" section that
  just repeat the same number twice. Never restate an identical figure under two different headings.
- When multiple named items exist side by side (e.g. the Saver tier and Moderate tier), list them as they are
  — do not collapse or merge them into a single fabricated combined range (e.g. do not turn two separate tiers
  into one "35,000-65,000" figure that doesn't correspond to any real value in the facts).
- Tone: Friendly, empathetic, and encouraging—written in a warm, polite Sri Lankan style (approachable, supportive, and conversational yet respectful). Avoid heavy academic or rigid corporate Sinhala. Informative and constructive, not fear-based or overwhelming.
  End the output with a polite closing statement:
  "මෙය පරිගණකයක් මගින් සකස් කරන ලද දළ වාර්තාවක් (computer-generated indicative report) වන අතර, අවසාන සංඛ්‍යාලේඛන සහ මූල්‍ය උපදෙස් සඳහා බලපත්‍රලාභී මූල්‍ය උපදේශකයෙකු හමු වී තහවුරු කරගන්න."

FACTS:
${facts}

Write the report now, structured with short sections. If the A/Level section applies, it must be the first
substantive section, right after a brief intro line: (1) උසස් පෙළ (A/Level) කාලය තුළ වියදම් — covering tuition
and learning materials & stationery as separate line items, then a combined total,
(2) දරුවාගේ අනාගත අධ්‍යාපන අවශ්‍යතාව, (3) විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම් —
  if the plan is a LOCAL PRIVATE degree: covering ONLY accommodation, food & meals, and miscellaneous/personal
  expenses as separate line items (no transport, no mobile/internet — do not add categories beyond these
  three; state each figure once, no breakdown/summary duplication since these are flat figures with nothing to
  calculate), then list the Saver and Moderate budget tiers as the two separate named options they are (do not
  merge them into one range);
  if the plan is a LOCAL GOVERNMENT university degree: present BOTH scenarios separately (hostel+Mahapola, and
  private boarding without Mahapola) — for each, list accommodation/food/transport/personal-care as flat
  figures (state once, no duplication), then for the Mahapola scenario show the real calculation of the
  effective monthly average accounting for the 10-of-12-months payment (breakdown then summary), then each
  scenario's total cost for the whole degree today and inflation-adjusted;
(4) මූල්‍යමය අභියෝගය — this section must present the pre-computed
"Grand total" fact (A/Level + degree + living cost components, then the grand total) rather than adding any
numbers together itself, (5) සෞඛ්‍ය අවදානම (if applicable), (6) ක්‍රීඩා සම්බන්ධ වියදම් (if applicable), (7) නිගමනය.
Skip any section whose "applicable"/condition is not met.`;

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
  const planLabel =
    HIGHER_EDUCATION_PLANS.find((p) => p.value === profile.higherEducationPlan)?.label ??
    profile.higherEducationPlan;
  const fieldLabel = profile.localPrivateDegreeField
    ? LOCAL_PRIVATE_DEGREE_FIELDS.find((f) => f.value === profile.localPrivateDegreeField)?.label
    : null;
  lines.push(`Stated higher education plan: ${planLabel}${fieldLabel ? ` — field of study: ${fieldLabel}` : ""}`);
  lines.push(`Cost/inflation assumptions disclaimer: ${projection.assumptions.disclaimer}`);
  lines.push(`Assumed general cost inflation: ${projection.assumptions.generalCostInflationPercent}% per year`);

  for (const e of projection.education) {
    const label = e.fieldOfStudyLabel ? ` (${e.fieldOfStudyLabel})` : "";
    lines.push(
      `Scenario "${e.scenario}"${label}: cost range today = LKR ${e.costTodayLkrMin.toLocaleString()}-${e.costTodayLkrMax.toLocaleString()}. ` +
        `Projected cost range at age 19 (inflation-adjusted) = LKR ${e.projectedCostAtAge19LkrMin.toLocaleString()}-${e.projectedCostAtAge19LkrMax.toLocaleString()}. ` +
        `Source: ${e.source} ` +
        `Required monthly saving (to cover the upper end of the range) by assumed investment growth rate: ${Object.entries(
          e.requiredMonthlySavingByGrowthRateLkr,
        )
          .map(([rate, amt]) => `${rate} growth -> LKR ${amt.toLocaleString()}/month`)
          .join("; ")}`,
    );
  }

  if (projection.localPrivateLivingExpenses.applicable) {
    const le = projection.localPrivateLivingExpenses;
    const c = le.monthlyCategories;
    const t = le.budgetTiers;

    lines.push(
      `University living expenses (applicable — plan is a local private degree). This is specific to local ` +
        `private university students, not overseas/government-university students. Degree duration: ` +
        `${le.degreeDurationYearsMin}-${le.degreeDurationYearsMax} years. All figures below are monthly LKR ranges unless noted.`,
    );

    lines.push(
      `1. Accommodation (hostel/shared room/boarding): ${c.accommodationLkrMin.toLocaleString()}-${c.accommodationLkrMax.toLocaleString()}/month`,
    );

    lines.push(
      `2. Food & meals: ${c.foodLkrMin.toLocaleString()}-${c.foodLkrMax.toLocaleString()}/month`,
    );

    lines.push(
      `3. Miscellaneous & personal expenses (printouts, leisure, cafe, snacks): ${c.miscLkrMin.toLocaleString()}-${c.miscLkrMax.toLocaleString()}/month`,
    );

    lines.push(
      `Monthly budget tiers (pre-bundled realistic combinations, not a sum of the maximum of every category above): ` +
        `Saver/budget tier: ${t.saverLkrMin.toLocaleString()}-${t.saverLkrMax.toLocaleString()}/month (${t.saverDescription}); ` +
        `Moderate/average tier: ${t.moderateLkrMin.toLocaleString()}-${t.moderateLkrMax.toLocaleString()}/month (${t.moderateDescription})`,
    );

    lines.push(
      `Total living cost for the whole degree (saver tier x shortest duration, to moderate tier x longest ` +
        `duration) — Total today: LKR ${le.totalLivingCostTodayLkrMin.toLocaleString()}-${le.totalLivingCostTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total when this child starts university: ` +
        `LKR ${le.projectedTotalLivingCostLkrMin.toLocaleString()}-${le.projectedTotalLivingCostLkrMax.toLocaleString()}`,
    );
  }

  if (projection.governmentUniversityLivingExpenses.applicable) {
    const ge = projection.governmentUniversityLivingExpenses;

    lines.push(
      `University living expenses (applicable — plan is a local GOVERNMENT university degree). Government ` +
        `universities charge no tuition fee (see degree cost scenario above, LKR 0). Degree duration: ` +
        `${ge.degreeDurationYearsMin}-${ge.degreeDurationYearsMax} years. Two distinct scenarios exist depending ` +
        `on hostel allocation and Mahapola scholarship eligibility — present BOTH separately, do not merge them.`,
    );

    for (const [i, s] of ge.scenarios.entries()) {
      const mahapolaText =
        s.mahapolaMonthlyLkr != null && s.mahapolaMonthsPerYear != null
          ? ` Mahapola Higher Education Scholarship: LKR ${s.mahapolaMonthlyLkr.toLocaleString()}/month, paid for ` +
            `${s.mahapolaMonthsPerYear} of 12 months per academic year (not paid the other ${12 - s.mahapolaMonthsPerYear} months). ` +
            `This is a real calculation: (${s.mahapolaMonthsPerYear} months x LKR ${(s.averageGrossMonthlyLkr - s.mahapolaMonthlyLkr).toLocaleString()} after scholarship, ` +
            `plus ${12 - s.mahapolaMonthsPerYear} months x LKR ${s.averageGrossMonthlyLkr.toLocaleString()} full cost) / 12 months = ` +
            `effective average of LKR ${s.effectiveMonthlyAverageLkr.toLocaleString()}/month — show this calculation and its summary result.`
          : ` No scholarship applies — average monthly cost is a single flat figure of LKR ${s.effectiveMonthlyAverageLkr.toLocaleString()}/month, state it once.`;

      lines.push(
        `Scenario ${i + 1}: "${s.label}". Accommodation: LKR ${s.accommodationLkrMin.toLocaleString()}-${s.accommodationLkrMax.toLocaleString()}/month (${s.accommodationNote}). ` +
          `Food & meals: LKR ${s.foodLkrMin.toLocaleString()}-${s.foodLkrMax.toLocaleString()}/month. ` +
          `Transport: LKR ${s.transportLkrMin.toLocaleString()}-${s.transportLkrMax.toLocaleString()}/month. ` +
          `Personal care & miscellaneous: LKR ${s.miscLkrMin.toLocaleString()}-${s.miscLkrMax.toLocaleString()}/month. ` +
          `Average gross monthly living cost (operator-given figure): LKR ${s.averageGrossMonthlyLkr.toLocaleString()}/month.${mahapolaText} ` +
          `Total cost for the whole degree today: LKR ${s.totalCostTodayLkrMin.toLocaleString()}-${s.totalCostTodayLkrMax.toLocaleString()}; ` +
          `Inflation-adjusted projected total when this child starts university: LKR ${s.projectedTotalCostLkrMin.toLocaleString()}-${s.projectedTotalCostLkrMax.toLocaleString()}`,
      );
    }
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
      `Combined A/Level period total (tuition + materials) — Total today: ` +
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

  const gt = projection.grandTotal;
  lines.push(
    `Grand total (PRE-COMPUTED — use this exact figure, do not add the components yourself): ` +
      `A/Level period: LKR ${gt.components.aLevelPeriodProjectedLkrMin.toLocaleString()}-${gt.components.aLevelPeriodProjectedLkrMax.toLocaleString()}; ` +
      `Degree cost: LKR ${gt.components.degreeCostProjectedLkrMin.toLocaleString()}-${gt.components.degreeCostProjectedLkrMax.toLocaleString()}; ` +
      `Living costs during degree: LKR ${gt.components.livingCostProjectedLkrMin.toLocaleString()}-${gt.components.livingCostProjectedLkrMax.toLocaleString()}; ` +
      `GRAND TOTAL: LKR ${gt.projectedTotalLkrMin.toLocaleString()}-${gt.projectedTotalLkrMax.toLocaleString()}`,
  );

  return lines.join("\n");
}
