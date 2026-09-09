import type { ChildProfileInput } from "@/types/child-profile";
import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";
import { HIGHER_EDUCATION_PLANS, LOCAL_PRIVATE_DEGREE_FIELDS } from "@/types/child-profile";
import {
  lkr,
  range,
  rangeStr,
  divideRange,
  multiplyRange,
  addRanges,
  totalOverDurationRange,
  inflateRange,
  type NumRange,
} from "@/lib/format";
import {
  EDUCATION_PLAN_EYEBROW,
  EDUCATION_PLAN_HEADING,
  EDUCATION_CORE_BENEFITS,
  EDUCATION_OPTIONAL_BENEFITS,
  EDUCATION_FD_COMPARISON,
  HEALTH_PLAN_EYEBROW,
  HEALTH_PLAN_HEADING,
  HEALTH_CORE_BENEFITS,
  HEALTH_OPTIONAL_BENEFITS,
  HEALTH_KEY_FEATURE,
  type BenefitItem,
  type FdComparisonItem,
} from "@/lib/content/plan-benefits";

// "Total" here always means inflation-adjusted (projected at the time the
// cost is actually incurred) — labeled explicitly so it's never mistaken for
// a flat today's-terms total x duration figure.
const COLS_3 = ["අයිතමය", "මාසිකව", "වාර්ෂිකව", "අනාගත ඇස්තමේන්තුව (උද්ධමනය සමග)"];

function overseasRow(
  label: string,
  min: number,
  max: number,
  durationYears: number,
  inflationPercent: number,
  yearsUntilStart: number,
): string[] {
  const total: NumRange = { min, max };
  const annual = divideRange(total, durationYears);
  const monthly = divideRange(annual, 12);
  const inflatedTotal = inflateRange(total, inflationPercent, yearsUntilStart);
  return [label, rangeStr(monthly), rangeStr(annual), rangeStr(inflatedTotal)];
}

function livingCategoryRow(
  label: string,
  monthlyMin: number,
  monthlyMax: number,
  durationMin: number,
  durationMax: number,
  inflationPercent: number,
  yearsUntilStart: number,
): string[] {
  const monthly: NumRange = { min: monthlyMin, max: monthlyMax };
  const annual = multiplyRange(monthly, 12);
  const total = totalOverDurationRange(monthly, durationMin, durationMax);
  const inflatedTotal = inflateRange(total, inflationPercent, yearsUntilStart);
  return [label, rangeStr(monthly), rangeStr(annual), rangeStr(inflatedTotal)];
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Compact single-line-per-item format — a title followed inline by its body,
// no card border/padding. This is what makes the benefits fit in ~2 pages
// instead of sprawling across many mostly-empty ones.
function benefitList(items: BenefitItem[]): string {
  return (
    `<div class="benefit-list">` +
    items
      .map(
        (b) =>
          `<p class="benefit-item"><span class="check">✓</span><b class="benefit-title">${esc(b.title)}:</b> ${esc(b.body)}</p>`,
      )
      .join("") +
    `</div>`
  );
}

function fdComparisonList(items: FdComparisonItem[]): string {
  return (
    `<div class="fd-list">` +
    items
      .map(
        (c) =>
          `<p class="fd-item"><b class="fd-title">${esc(c.title)}:</b> ` +
          `<span class="fd-label">ස්ථාවර තැන්පතුව —</span> ${esc(c.fd)} ` +
          `<span class="fd-label fd-label-plan">AIA —</span> ${esc(c.plan)}</p>`,
      )
      .join("") +
    `</div>`
  );
}

function table(headers: string[], rows: string[][], totalRow?: string[]): string {
  const th = headers.map((h, i) => `<th class="${i === 0 ? "l" : "r"}">${esc(h)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((c, i) => `<td class="${i === 0 ? "l" : "r"}">${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  const total = totalRow
    ? `<tr class="total">${totalRow.map((c, i) => `<td class="${i === 0 ? "l" : "r"}">${esc(c)}</td>`).join("")}</tr>`
    : "";
  return `<table><thead><tr>${th}</tr></thead><tbody>${body}${total}</tbody></table>`;
}

function section(title: string, innerHtml: string, highlight = false): string {
  return `<div class="section${highlight ? " highlight" : ""}"><h3>${esc(title)}</h3>${innerHtml}</div>`;
}

export function buildReportHtml(
  profile: ChildProfileInput,
  projection: ChildFutureProjection,
  reportSinhala: string,
): string {
  const p = projection;
  const inflationPercent = p.assumptions.generalCostInflationPercent;
  const yearsToHigherEd = p.yearsToHigherEducation;
  const planLabel =
    HIGHER_EDUCATION_PLANS.find((x) => x.value === profile.higherEducationPlan)?.label ??
    profile.higherEducationPlan;
  const fieldLabel = profile.localPrivateDegreeField
    ? LOCAL_PRIVATE_DEGREE_FIELDS.find((f) => f.value === profile.localPrivateDegreeField)?.label
    : null;

  const tuitionMonthly: NumRange = {
    min: p.alTuition.breakdown.monthlyCostLkrMin,
    max: p.alTuition.breakdown.monthlyCostLkrMax,
  };
  const tuitionAnnual = multiplyRange(tuitionMonthly, 12);
  const materialsAnnual: NumRange = { min: p.alMaterials.annualCostLkrMin, max: p.alMaterials.annualCostLkrMax };
  const materialsMonthly = divideRange(materialsAnnual, 12);
  const alTotalMonthly = addRanges(tuitionMonthly, materialsMonthly);
  const alTotalAnnual = addRanges(tuitionAnnual, materialsAnnual);

  const sections: string[] = [];

  if (p.alTuition.applicable) {
    sections.push(
      section(
        "උසස් පෙළ (A/Level) කාලය තුළ වියදම්",
        table(
          COLS_3,
          [
            ["උපකාරක පන්ති", rangeStr(tuitionMonthly), rangeStr(tuitionAnnual), range(p.alTuition.projectedCostLkrMin, p.alTuition.projectedCostLkrMax)],
            ["ඉගෙනුම් ද්‍රව්‍ය", rangeStr(materialsMonthly), rangeStr(materialsAnnual), range(p.alMaterials.projectedCostLkrMin, p.alMaterials.projectedCostLkrMax)],
          ],
          ["එකතුව", rangeStr(alTotalMonthly), rangeStr(alTotalAnnual), range(p.alCombinedTotal.projectedCostLkrMin, p.alCombinedTotal.projectedCostLkrMax)],
        ),
      ),
    );
  }

  sections.push(
    section(
      "අධ්‍යාපන වියදම්",
      table(
        COLS_3,
        p.education.map((e) => {
          const annual: NumRange = { min: e.perYearCostTodayLkrMin, max: e.perYearCostTodayLkrMax };
          const monthly = divideRange(annual, 12);
          return [
            `${e.scenario === "overseas_degree" ? "විදේශීය උපාධිය" : "දේශීය"}${e.fieldOfStudyLabel ? ` — ${e.fieldOfStudyLabel}` : ""}`,
            rangeStr(monthly),
            rangeStr(annual),
            range(e.projectedCostAtAge19LkrMin, e.projectedCostAtAge19LkrMax),
          ];
        }),
      ),
    ),
  );

  if (p.overseasDegreeCostBreakdown.applicable) {
    const o = p.overseasDegreeCostBreakdown;
    sections.push(
      section(
        `විදේශීය උපාධි වියදම් විස්තරය — වසර ${o.durationYears}ක්`,
        table(
          COLS_3,
          [
            overseasRow("පාඨමාලා ගාස්තු", o.tuitionLkrMin, o.tuitionLkrMax, o.durationYears, inflationPercent, yearsToHigherEd),
            overseasRow("නවාතැන්", o.accommodationLkrMin, o.accommodationLkrMax, o.durationYears, inflationPercent, yearsToHigherEd),
            overseasRow("ආහාර", o.foodLkrMin, o.foodLkrMax, o.durationYears, inflationPercent, yearsToHigherEd),
            overseasRow("සෞඛ්‍ය රක්ෂණය", o.healthInsuranceLkrMin, o.healthInsuranceLkrMax, o.durationYears, inflationPercent, yearsToHigherEd),
            overseasRow("ප්‍රවාහන/සන්නිවේදන", o.transportCommunicationsLkrMin, o.transportCommunicationsLkrMax, o.durationYears, inflationPercent, yearsToHigherEd),
          ],
          [
            "එකතුව",
            rangeStr(divideRange({ min: o.grandTotalTodayLkrMin, max: o.grandTotalTodayLkrMax }, o.durationYears * 12)),
            rangeStr(divideRange({ min: o.grandTotalTodayLkrMin, max: o.grandTotalTodayLkrMax }, o.durationYears)),
            range(o.projectedGrandTotalLkrMin, o.projectedGrandTotalLkrMax),
          ],
        ),
      ),
    );
  }

  if (p.localPrivateLivingExpenses.applicable) {
    const le = p.localPrivateLivingExpenses;
    const c = le.monthlyCategories;
    const t = le.budgetTiers;
    const durMin = le.degreeDurationYearsMin;
    const durMax = le.degreeDurationYearsMax;
    sections.push(
      section(
        "විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම්",
        table(COLS_3, [
          livingCategoryRow("නවාතැන්", c.accommodationLkrMin, c.accommodationLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
          livingCategoryRow("ආහාර", c.foodLkrMin, c.foodLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
          livingCategoryRow("වෙනත් වියදම්", c.miscLkrMin, c.miscLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
        ]) +
          table(
            COLS_3,
            [
              livingCategoryRow("අඩු වියදම් (Saver)", t.saverLkrMin, t.saverLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
              livingCategoryRow("සාමාන්‍ය (Moderate)", t.moderateLkrMin, t.moderateLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
            ],
            [`ඇස්තමේන්තුගත එකතුව (${durMin}-${durMax}y)`, "—", "—", range(le.projectedTotalLivingCostLkrMin, le.projectedTotalLivingCostLkrMax)],
          ),
      ),
    );
  }

  if (p.governmentUniversityLivingExpenses.applicable) {
    const durMin = p.governmentUniversityLivingExpenses.degreeDurationYearsMin;
    const durMax = p.governmentUniversityLivingExpenses.degreeDurationYearsMax;
    const inner = p.governmentUniversityLivingExpenses.scenarios
      .map((s) => {
        const rows = [
          livingCategoryRow("නවාතැන්", s.accommodationLkrMin, s.accommodationLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
          livingCategoryRow("ආහාර", s.foodLkrMin, s.foodLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
          livingCategoryRow("ප්‍රවාහන", s.transportLkrMin, s.transportLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
          livingCategoryRow("වෙනත්", s.miscLkrMin, s.miscLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
        ];
        if (s.mahapolaMonthlyLkr != null) {
          rows.push([
            "මහපොළ ශිෂ්‍යත්වය (-)",
            `-${lkr(s.mahapolaMonthlyLkr)}`,
            `-${lkr(s.mahapolaMonthlyLkr * (s.mahapolaMonthsPerYear ?? 12))}`,
            `${s.mahapolaMonthsPerYear}/12 මාස පමණක්`,
          ]);
        }
        const effectiveMonthly: NumRange = { min: s.effectiveMonthlyAverageLkr, max: s.effectiveMonthlyAverageLkr };
        return (
          `<p class="scenario-label">${esc(s.label)}</p>` +
          table(
            COLS_3,
            rows,
            ["ඵලදායි එකතුව", rangeStr(effectiveMonthly), rangeStr(multiplyRange(effectiveMonthly, 12)), range(s.projectedTotalCostLkrMin, s.projectedTotalCostLkrMax)],
          )
        );
      })
      .join("");
    sections.push(section("විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම්", inner));
  }

  if (p.vocationalTrainingLivingExpenses.applicable) {
    const v = p.vocationalTrainingLivingExpenses;
    const c = v.monthlyCategories;
    sections.push(
      section(
        "පුහුණු කාලය තුළ ජීවන වියදම්",
        table(
          COLS_3,
          [
            livingCategoryRow("ආහාර", c.foodLkrMin, c.foodLkrMax, v.durationYears, v.durationYears, inflationPercent, yearsToHigherEd),
            livingCategoryRow("පාඨමාලා ද්‍රව්‍ය", c.materialsLkrMin, c.materialsLkrMax, v.durationYears, v.durationYears, inflationPercent, yearsToHigherEd),
            livingCategoryRow("ජංගම දත්ත", c.mobileInternetLkrMin, c.mobileInternetLkrMax, v.durationYears, v.durationYears, inflationPercent, yearsToHigherEd),
            livingCategoryRow("වෙනත්", c.miscLkrMin, c.miscLkrMax, v.durationYears, v.durationYears, inflationPercent, yearsToHigherEd),
          ],
          [
            `ඇස්තමේන්තුගත එකතුව (${v.durationYears}y)`,
            range(v.averageMonthlyLkrMin, v.averageMonthlyLkrMax),
            range(v.averageMonthlyLkrMin * 12, v.averageMonthlyLkrMax * 12),
            range(v.projectedTotalCostLkrMin, v.projectedTotalCostLkrMax),
          ],
        ),
      ),
    );
  }

  if (p.healthRisk.flagged) {
    sections.push(
      section("සෞඛ්‍ය අවදානම", table(["", ""], [["ආවරණ යොමු මුදල", lkr(p.healthRisk.referenceAmountLkr)]])),
    );
  }

  if (p.sports.provided && p.sports.monthlyCostLkr != null) {
    sections.push(
      section(
        "ක්‍රීඩා සම්බන්ධ වියදම්",
        table(
          COLS_3,
          [],
          ["අනාගත ඇස්තමේන්තුව", lkr(p.sports.monthlyCostLkr), lkr(p.sports.monthlyCostLkr * 12), lkr(p.sports.totalProjectedCostLkr)],
        ),
      ),
    );
  }

  sections.push(
    section(
      "සමස්ත සාරාංශය",
      table(
        ["අංශය", "අනාගත ඇස්තමේන්තුව"],
        [
          ["උසස් පෙළ", range(p.grandTotal.components.aLevelPeriodProjectedLkrMin, p.grandTotal.components.aLevelPeriodProjectedLkrMax)],
          ["උපාධි වියදම", range(p.grandTotal.components.degreeCostProjectedLkrMin, p.grandTotal.components.degreeCostProjectedLkrMax)],
          ["ජීවන වියදම්", range(p.grandTotal.components.livingCostProjectedLkrMin, p.grandTotal.components.livingCostProjectedLkrMax)],
        ],
        ["සම්පූර්ණ එකතුව", range(p.grandTotal.projectedTotalLkrMin, p.grandTotal.projectedTotalLkrMax)],
      ),
      true,
    ),
  );

  // ---- AIA plan benefit pages (static content, same as /child-report/plan-benefits
  // and /child-report/health-plan-benefits — appended here per operator request).
  // Both plans share ONE forced page break from the pricing report, then flow
  // continuously into each other — kept compact to stay within ~2 pages total. ----
  sections.push(`
    <div class="plan-page plan-page-first">
      <p class="plan-eyebrow">${esc(EDUCATION_PLAN_EYEBROW)}</p>
      <h2 class="plan-heading">${esc(EDUCATION_PLAN_HEADING)}</h2>

      <h3 class="plan-subheading">ප්‍රධාන ප්‍රතිපත්ති ප්‍රතිලාභ</h3>
      ${benefitList(EDUCATION_CORE_BENEFITS)}

      <h3 class="plan-subheading">විකල්ප ආරක්ෂණ ප්‍රතිලාභ</h3>
      ${benefitList(EDUCATION_OPTIONAL_BENEFITS)}

      <h3 class="plan-subheading">ස්ථාවර තැන්පතුවක් පමණක් භාවිත නොකළ යුත්තේ ඇයි?</h3>
      ${fdComparisonList(EDUCATION_FD_COMPARISON)}
    </div>

    <div class="plan-page">
      <p class="plan-eyebrow">${esc(HEALTH_PLAN_EYEBROW)}</p>
      <h2 class="plan-heading">${esc(HEALTH_PLAN_HEADING)}</h2>

      <h3 class="plan-subheading">මූලික ආවරණය</h3>
      ${benefitList(HEALTH_CORE_BENEFITS)}

      <h3 class="plan-subheading">විකල්ප ආරක්ෂණ හා ආදායම් ප්‍රතිලාභ</h3>
      ${benefitList(HEALTH_OPTIONAL_BENEFITS)}

      <h3 class="plan-subheading">ප්‍රධාන මූල්‍ය විශේෂාංගය</h3>
      ${benefitList([HEALTH_KEY_FEATURE])}
    </div>
  `);

  const generatedDate = new Date().toLocaleDateString("si-LK", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="si">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Noto Sans Sinhala', 'Noto Sans', sans-serif;
    color: #1a1a1a;
    margin: 0;
    padding: 22px 26px;
    font-size: 11px;
    line-height: 1.5;
  }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { color: #555; font-size: 10px; margin-bottom: 14px; }
  .narrative { white-space: pre-wrap; margin: 12px 0 16px; font-size: 11px; line-height: 1.6; }
  .section { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; page-break-inside: avoid; }
  .section.highlight { border-color: #10b981; background: #ecfdf5; }
  .section h3 { font-size: 12px; margin: 0 0 6px; }
  .scenario-label { font-weight: 600; margin: 6px 0 3px; font-size: 10.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 10px; }
  th, td { padding: 3px 6px; border-bottom: 1px solid #eee; }
  th { text-align: right; color: #555; font-weight: 500; border-bottom: 1px solid #ccc; }
  th.l, td.l { text-align: left; }
  td.r, th.r { text-align: right; font-variant-numeric: tabular-nums; }
  tr.total td { font-weight: 700; border-top: 1.5px solid #999; color: #047857; }
  .disclaimer { font-size: 9px; color: #666; margin-top: 8px; }
  .footer { margin-top: 8px; font-size: 8.5px; color: #777; border-top: 1px solid #ddd; padding-top: 4px; }

  .plan-page-first { page-break-before: always; }
  .plan-page { padding-top: 2px; }
  .plan-eyebrow { font-size: 8.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #059669; margin: 0; }
  .plan-heading { font-size: 13px; margin: 2px 0 6px; }
  .plan-subheading { font-size: 10px; font-weight: 700; color: #047857; margin: 7px 0 3px; border-bottom: 1px solid #d1fae5; padding-bottom: 2px; }
  .benefit-list { margin: 0; }
  .benefit-item { font-size: 9px; line-height: 1.32; color: #333; margin: 0 0 2px; page-break-inside: avoid; }
  .benefit-item .check { color: #059669; font-weight: 700; margin-right: 2px; }
  .benefit-title { color: #111; }
  .fd-list { margin: 0; }
  .fd-item { font-size: 9px; line-height: 1.32; color: #333; margin: 0 0 3px; page-break-inside: avoid; }
  .fd-title { color: #111; }
  .fd-label { font-size: 8px; font-weight: 700; color: #888; }
  .fd-label-plan { color: #059669; }
</style>
</head>
<body>
  <h1>දරුවාගේ අනාගත අධ්‍යාපන වාර්තාව</h1>
  <div class="meta">
    ${profile.customerName ? `පාරිභෝගිකයා: ${esc(profile.customerName)} · ` : ""}${profile.childName ? `දරුවා: ${esc(profile.childName)} · ` : ""}සැලැස්ම: ${esc(planLabel)}${fieldLabel ? ` (${esc(fieldLabel)})` : ""} · ${generatedDate}
  </div>

  <div class="narrative">${esc(reportSinhala)}</div>

  ${sections.join("\n")}

  <div class="footer">මෙය පරිගණකයක් මගින් සකස් කරන ලද දළ වාර්තාවක් වන අතර, අවසාන සංඛ්‍යාලේඛන සහ මූල්‍ය උපදෙස් සඳහා බලපත්‍රලාභී මූල්‍ය උපදේශකයෙකු හමු වී තහවුරු කරගන්න.</div>
</body>
</html>`;
}
