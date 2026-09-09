import type { ChildProfileInput } from "@/types/child-profile";
import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";
import { HIGHER_EDUCATION_PLANS, LOCAL_PRIVATE_DEGREE_FIELDS } from "@/types/child-profile";
import { lkr, range, perYearRange, perYearRangeFromDurationRange } from "@/lib/format";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  const planLabel =
    HIGHER_EDUCATION_PLANS.find((x) => x.value === profile.higherEducationPlan)?.label ??
    profile.higherEducationPlan;
  const fieldLabel = profile.localPrivateDegreeField
    ? LOCAL_PRIVATE_DEGREE_FIELDS.find((f) => f.value === profile.localPrivateDegreeField)?.label
    : null;

  const alTuitionPerYear = {
    min: p.alTuition.breakdown.monthlyCostLkrMin * 12,
    max: p.alTuition.breakdown.monthlyCostLkrMax * 12,
  };
  const alCombinedPerYear = {
    min: alTuitionPerYear.min + p.alMaterials.annualCostLkrMin,
    max: alTuitionPerYear.max + p.alMaterials.annualCostLkrMax,
  };

  const sections: string[] = [];

  if (p.alTuition.applicable) {
    sections.push(
      section(
        "උසස් පෙළ (A/Level) කාලය තුළ වියදම්",
        table(
          ["අයිතමය", "වසරකට", "සම්පූර්ණ කාලය සඳහා"],
          [
            [
              "උපකාරක පන්ති",
              range(alTuitionPerYear.min, alTuitionPerYear.max),
              range(p.alTuition.projectedCostLkrMin, p.alTuition.projectedCostLkrMax),
            ],
            [
              "ඉගෙනුම් ද්‍රව්‍ය",
              range(p.alMaterials.annualCostLkrMin, p.alMaterials.annualCostLkrMax),
              range(p.alMaterials.projectedCostLkrMin, p.alMaterials.projectedCostLkrMax),
            ],
          ],
          [
            "එකතුව",
            range(alCombinedPerYear.min, alCombinedPerYear.max),
            range(p.alCombinedTotal.projectedCostLkrMin, p.alCombinedTotal.projectedCostLkrMax),
          ],
        ),
      ),
    );
  }

  sections.push(
    section(
      "අධ්‍යාපන වියදම්",
      table(
        ["සැලැස්ම", "වසරකට", "සම්පූර්ණ උපාධි කාලය"],
        p.education.map((e) => [
          `${e.scenario === "overseas_degree" ? "විදේශීය උපාධිය" : "දේශීය"}${e.fieldOfStudyLabel ? ` — ${e.fieldOfStudyLabel}` : ""}`,
          range(e.perYearCostTodayLkrMin, e.perYearCostTodayLkrMax),
          range(e.projectedCostAtAge19LkrMin, e.projectedCostAtAge19LkrMax),
        ]),
      ),
    ),
  );

  if (p.overseasDegreeCostBreakdown.applicable) {
    const o = p.overseasDegreeCostBreakdown;
    sections.push(
      section(
        `විදේශීය උපාධි වියදම් විස්තරය — වසර ${o.durationYears}ක්`,
        table(
          ["අයිතමය", "වසරකට", "සම්පූර්ණ කාලය සඳහා"],
          [
            ["පාඨමාලා ගාස්තු", perYearRange(o.tuitionLkrMin, o.tuitionLkrMax, o.durationYears), range(o.tuitionLkrMin, o.tuitionLkrMax)],
            ["නවාතැන්", perYearRange(o.accommodationLkrMin, o.accommodationLkrMax, o.durationYears), range(o.accommodationLkrMin, o.accommodationLkrMax)],
            ["ආහාර", perYearRange(o.foodLkrMin, o.foodLkrMax, o.durationYears), range(o.foodLkrMin, o.foodLkrMax)],
            ["සෞඛ්‍ය රක්ෂණය", perYearRange(o.healthInsuranceLkrMin, o.healthInsuranceLkrMax, o.durationYears), range(o.healthInsuranceLkrMin, o.healthInsuranceLkrMax)],
            ["ප්‍රවාහන/සන්නිවේදන", perYearRange(o.transportCommunicationsLkrMin, o.transportCommunicationsLkrMax, o.durationYears), range(o.transportCommunicationsLkrMin, o.transportCommunicationsLkrMax)],
          ],
          ["එකතුව", perYearRange(o.grandTotalTodayLkrMin, o.grandTotalTodayLkrMax, o.durationYears), range(o.grandTotalTodayLkrMin, o.grandTotalTodayLkrMax)],
        ),
      ),
    );
  }

  if (p.localPrivateLivingExpenses.applicable) {
    const le = p.localPrivateLivingExpenses;
    const c = le.monthlyCategories;
    const t = le.budgetTiers;
    sections.push(
      section(
        "විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම්",
        table(
          ["අයිතමය", "මාසිකව"],
          [
            ["නවාතැන්", range(c.accommodationLkrMin, c.accommodationLkrMax)],
            ["ආහාර", range(c.foodLkrMin, c.foodLkrMax)],
            ["වෙනත් වියදම්", range(c.miscLkrMin, c.miscLkrMax)],
          ],
        ) +
          table(
            ["අයවැය මට්ටම", "වසරකට"],
            [
              ["අඩු වියදම් (Saver)", range(t.saverLkrMin * 12, t.saverLkrMax * 12)],
              ["සාමාන්‍ය (Moderate)", range(t.moderateLkrMin * 12, t.moderateLkrMax * 12)],
            ],
            [
              `ඇස්තමේන්තුගත එකතුව (${le.degreeDurationYearsMin}-${le.degreeDurationYearsMax}y)`,
              range(le.projectedTotalLivingCostLkrMin, le.projectedTotalLivingCostLkrMax),
            ],
          ),
      ),
    );
  }

  if (p.governmentUniversityLivingExpenses.applicable) {
    const inner = p.governmentUniversityLivingExpenses.scenarios
      .map((s) => {
        const rows = [
          ["නවාතැන්", range(s.accommodationLkrMin, s.accommodationLkrMax)],
          ["ආහාර", range(s.foodLkrMin, s.foodLkrMax)],
          ["ප්‍රවාහන", range(s.transportLkrMin, s.transportLkrMax)],
          ["වෙනත්", range(s.miscLkrMin, s.miscLkrMax)],
        ];
        if (s.mahapolaMonthlyLkr != null) {
          rows.push(["මහපොළ ශිෂ්‍යත්වය (-)", `-${lkr(s.mahapolaMonthlyLkr)} (${s.mahapolaMonthsPerYear}/12 මාස)`]);
        }
        return (
          `<p class="scenario-label">${esc(s.label)}</p>` +
          table(["අයිතමය", "මාසිකව"], rows) +
          table(
            ["", "වසරකට"],
            [],
            ["ඵලදායි එකතුව", range(s.projectedTotalCostLkrMin, s.projectedTotalCostLkrMax)],
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
          ["අයිතමය", "මාසිකව"],
          [
            ["ආහාර", range(c.foodLkrMin, c.foodLkrMax)],
            ["පාඨමාලා ද්‍රව්‍ය", range(c.materialsLkrMin, c.materialsLkrMax)],
            ["ජංගම දත්ත", range(c.mobileInternetLkrMin, c.mobileInternetLkrMax)],
            ["වෙනත්", range(c.miscLkrMin, c.miscLkrMax)],
          ],
        ) +
          table(
            ["", `වසරකට (${v.durationYears}y)`],
            [],
            ["ඇස්තමේන්තුගත එකතුව", range(v.projectedTotalCostLkrMin, v.projectedTotalCostLkrMax)],
          ),
      ),
    );
  }

  if (p.healthRisk.flagged) {
    sections.push(
      section("සෞඛ්‍ය අවදානම", table(["", ""], [["ආවරණ යොමු මුදල", lkr(p.healthRisk.referenceAmountLkr)]])),
    );
  }

  if (p.sports.provided) {
    sections.push(
      section(
        "ක්‍රීඩා සම්බන්ධ වියදම්",
        table(["", ""], [["අනාගත ඇස්තමේන්තුව", lkr(p.sports.totalProjectedCostLkr)]]),
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
    padding: 32px 40px;
    font-size: 12px;
    line-height: 1.6;
  }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #555; font-size: 11px; margin-bottom: 20px; }
  .narrative { white-space: pre-wrap; margin: 20px 0 28px; font-size: 12px; line-height: 1.8; }
  .section { border: 1px solid #ddd; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; page-break-inside: avoid; }
  .section.highlight { border-color: #10b981; background: #ecfdf5; }
  .section h3 { font-size: 13px; margin: 0 0 10px; }
  .scenario-label { font-weight: 600; margin: 10px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11.5px; }
  th, td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  th { text-align: right; color: #555; font-weight: 500; border-bottom: 1px solid #ccc; }
  th.l, td.l { text-align: left; }
  td.r, th.r { text-align: right; font-variant-numeric: tabular-nums; }
  tr.total td { font-weight: 700; border-top: 2px solid #999; color: #047857; }
  .disclaimer { font-size: 10px; color: #666; margin-top: 12px; }
  .footer { margin-top: 24px; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
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
