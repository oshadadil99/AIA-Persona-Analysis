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

  const prompt = `You are writing a SHORT, warm narrative introduction and conclusion in SINHALA for a Sri
Lankan parent/guardian's financial planning report. This is an indicative, computer-generated outlook — not
a guarantee and not final insurance advice.

IMPORTANT CONTEXT: The detailed pricing breakdown (every cost category, every table, every growth-rate
scenario, the grand total) is ALREADY shown to the reader as proper tables directly above this text — built
from the exact same numbers you're given below. Your job is NOT to repeat that breakdown in prose. Your job
is to write the human, explanatory framing around it: what this all means for the family, in plain warm
language, without turning into a second copy of the tables.

STRICT RULES:
- Write entirely in Sinhala (Sinhala script), not English or Singlish.
- Do NOT use any markdown formatting — no asterisks (no **text**), no markdown headers (#, ##), no markdown
  bullet lists (* or -). Plain text only, plain sentences and paragraphs.
- If the child's name is given, use it by name instead of generic "දරුවා"/"ඔබේ දරුවා" wherever natural. If the
  customer/parent's name is given, address them by name where natural (opening/closing). If a name is not
  given, use the generic Sinhala address — never invent a name.
- Do NOT invent, estimate, or restate detailed cost figures — the tables already show every number precisely.
  You MAY mention the single headline "Grand total" range once, in prose, since that's the one figure worth
  reinforcing in words — but do not walk through each cost category's numbers one by one.
- Do NOT perform any arithmetic yourself.
- Clearly state, once, that these cost/inflation figures are assumptions, not guaranteed facts.
- Tone: friendly, empathetic, encouraging — warm, polite Sri Lankan style, conversational yet respectful.
  Constructive and informative, not fear-based or overwhelming.
- Do NOT state or hint anywhere that this is a computer-generated/automated/indicative report, and do NOT
  tell the reader to go confirm the figures with a licensed financial advisor. The operator delivers this
  report in person and does not want that closing caveat in the text.

FACTS (for context only — do not restate these as a list; the reader already sees them in the tables above):
${facts}

Write a short piece (roughly 4-6 sentences total, 2-3 short paragraphs) covering: (1) a warm opening
acknowledging the family's planning for the child's future, naming the stated higher-education plan in one
line, (2) one sentence referencing the Grand Total range as the headline takeaway, (3) a brief, encouraging
closing note about planning ahead (mention the health/sports facts only if they were flagged as applicable).
Do not add section headings or numbered sections — this is a short connective narrative, not a structured
report.`;

  const result = await callGemini(prompt);
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned no report text: ${JSON.stringify(result).slice(0, 300)}`);
  }
  return text;
}

function buildFactsBlock(profile: ChildProfileInput, projection: ChildFutureProjection): string {
  const lines: string[] = [];

  lines.push(
    `Customer/parent name: ${profile.customerName ?? "(not provided — use generic address, e.g. ඔබ)"}`,
  );
  lines.push(`Child's name: ${profile.childName ?? "(not provided — use generic reference, e.g. දරුවා)"}`);
  lines.push(`Child's current age: ${profile.childAge}`);
  lines.push(`Typical higher education entry age in Sri Lanka: 19`);
  lines.push(`Years until then: ${projection.yearsToHigherEducation}`);
  lines.push(`Province: ${profile.province}`);
  if (profile.customerOccupation) {
    lines.push(`Customer/parent occupation: ${profile.customerOccupation}`);
  }
  lines.push(`Household current monthly expense (excluding this child's education): LKR ${profile.householdMonthlyExpenseLkr.toLocaleString()}`);
  if (profile.householdMonthlySavingsLkr != null) {
    lines.push(`Household current monthly savings: LKR ${profile.householdMonthlySavingsLkr.toLocaleString()}`);
  }
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
      `Scenario "${e.categoryLabel}"${label} (over ${e.durationYearsMin}-${e.durationYearsMax} years): cost range today = LKR ${e.costTodayLkrMin.toLocaleString()}-${e.costTodayLkrMax.toLocaleString()}. ` +
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

  if (projection.vocationalTrainingLivingExpenses.applicable) {
    const v = projection.vocationalTrainingLivingExpenses;
    const c = v.monthlyCategories;

    lines.push(
      `Living/recurring expenses (applicable — plan is vocational/technical training). Vocational training ` +
        `course fee is treated as free/no separate charge. Assumed course duration: ${v.durationYears} year(s). ` +
        `All figures below are monthly LKR ranges unless noted.`,
    );

    lines.push(`1. Food & canteen meals: ${c.foodLkrMin.toLocaleString()}-${c.foodLkrMax.toLocaleString()}/month`);
    lines.push(
      `2. Course materials, tools & stationery: ${c.materialsLkrMin.toLocaleString()}-${c.materialsLkrMax.toLocaleString()}/month`,
    );
    lines.push(
      `3. Mobile data & internet: ${c.mobileInternetLkrMin.toLocaleString()}-${c.mobileInternetLkrMax.toLocaleString()}/month`,
    );
    lines.push(
      `4. Personal care & miscellaneous: ${c.miscLkrMin.toLocaleString()}-${c.miscLkrMax.toLocaleString()}/month`,
    );

    lines.push(
      `Average total monthly living cost (operator-given figure, not a sum of the categories above): ` +
        `LKR ${v.averageMonthlyLkrMin.toLocaleString()}-${v.averageMonthlyLkrMax.toLocaleString()}/month. ` +
        `This is a real calculation for the total: average monthly cost x 12 months x ${v.durationYears} year(s) ` +
        `= Total cost today: LKR ${v.totalCostTodayLkrMin.toLocaleString()}-${v.totalCostTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total when this child starts training: ` +
        `LKR ${v.projectedTotalCostLkrMin.toLocaleString()}-${v.projectedTotalCostLkrMax.toLocaleString()}`,
    );
  }

  if (projection.overseasDegreeCostBreakdown.applicable) {
    const o = projection.overseasDegreeCostBreakdown;

    lines.push(
      `Overseas degree total ${o.durationYears}-year cost breakdown (applicable — plan is an overseas degree). ` +
        `These 5 categories sum exactly to the grand total below (a real, verified calculation, not rounded ` +
        `tiers). All figures are LKR ranges converted from EUR.`,
    );

    lines.push(`1. Tuition fees: LKR ${o.tuitionLkrMin.toLocaleString()}-${o.tuitionLkrMax.toLocaleString()}`);
    lines.push(
      `2. Accommodation (dorms/shared apartments): LKR ${o.accommodationLkrMin.toLocaleString()}-${o.accommodationLkrMax.toLocaleString()}`,
    );
    lines.push(`3. Food & daily groceries: LKR ${o.foodLkrMin.toLocaleString()}-${o.foodLkrMax.toLocaleString()}`);
    lines.push(
      `4. Mandatory health insurance: LKR ${o.healthInsuranceLkrMin.toLocaleString()}-${o.healthInsuranceLkrMax.toLocaleString()}`,
    );
    lines.push(
      `5. Transport & personal communications: LKR ${o.transportCommunicationsLkrMin.toLocaleString()}-${o.transportCommunicationsLkrMax.toLocaleString()}`,
    );

    lines.push(
      `Grand total investment (${o.durationYears} years) — sum of the 5 categories above — Total today: ` +
        `LKR ${o.grandTotalTodayLkrMin.toLocaleString()}-${o.grandTotalTodayLkrMax.toLocaleString()}; ` +
        `Inflation-adjusted projected total when this child starts the degree: ` +
        `LKR ${o.projectedGrandTotalLkrMin.toLocaleString()}-${o.projectedGrandTotalLkrMax.toLocaleString()}`,
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
  const livingCostLine = projection.overseasDegreeCostBreakdown.applicable
    ? `Living costs during degree: already included within the degree cost figure above (the overseas ` +
      `breakdown bundles tuition, accommodation, food, insurance, and transport into one total) — do not ` +
      `show this as a separate LKR 0 line, and do not imply there are no living costs.`
    : `Living costs during degree: LKR ${gt.components.livingCostProjectedLkrMin.toLocaleString()}-${gt.components.livingCostProjectedLkrMax.toLocaleString()}; `;
  lines.push(
    `Grand total (PRE-COMPUTED — use this exact figure, do not add the components yourself): ` +
      `A/Level period: LKR ${gt.components.aLevelPeriodProjectedLkrMin.toLocaleString()}-${gt.components.aLevelPeriodProjectedLkrMax.toLocaleString()}; ` +
      `Degree cost: LKR ${gt.components.degreeCostProjectedLkrMin.toLocaleString()}-${gt.components.degreeCostProjectedLkrMax.toLocaleString()}; ` +
      `${livingCostLine}` +
      `GRAND TOTAL: LKR ${gt.projectedTotalLkrMin.toLocaleString()}-${gt.projectedTotalLkrMax.toLocaleString()}`,
  );

  return lines.join("\n");
}
