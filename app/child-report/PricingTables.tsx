import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";
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

// "Total" here always means inflation-adjusted (projected at the time the
// cost is actually incurred) — labeled explicitly so it's never mistaken for
// a flat today's-terms total x duration figure.
const COLS_3 = ["අයිතමය (Item)", "මාසිකව (Monthly)", "වාර්ෂිකව (Annual)", "අනාගත ඇස්තමේන්තුව (Inflation-Adjusted)"];

export default function PricingTables({ projection }: { projection: ChildFutureProjection }) {
  const p = projection;
  const inflationPercent = p.assumptions.generalCostInflationPercent;
  const yearsToHigherEd = p.yearsToHigherEducation;

  // ---- A/Level ----
  const tuitionMonthly: NumRange = { min: p.alTuition.breakdown.monthlyCostLkrMin, max: p.alTuition.breakdown.monthlyCostLkrMax };
  const tuitionAnnual = multiplyRange(tuitionMonthly, 12);
  const materialsAnnual: NumRange = { min: p.alMaterials.annualCostLkrMin, max: p.alMaterials.annualCostLkrMax };
  const materialsMonthly = divideRange(materialsAnnual, 12);
  const alTotalMonthly = addRanges(tuitionMonthly, materialsMonthly);
  const alTotalAnnual = addRanges(tuitionAnnual, materialsAnnual);

  return (
    <div className="space-y-8">
      {p.alTuition.applicable && (
        <TableSection title="උසස් පෙළ (A/Level) කාලය තුළ වියදම්">
          <Table
            headers={COLS_3}
            rows={[
              ["උපකාරක පන්ති (Tuition classes)", rangeStr(tuitionMonthly), rangeStr(tuitionAnnual), range(p.alTuition.projectedCostLkrMin, p.alTuition.projectedCostLkrMax)],
              ["ඉගෙනුම් ද්‍රව්‍ය (Learning materials)", rangeStr(materialsMonthly), rangeStr(materialsAnnual), range(p.alMaterials.projectedCostLkrMin, p.alMaterials.projectedCostLkrMax)],
            ]}
            totalRow={["එකතුව (Total)", rangeStr(alTotalMonthly), rangeStr(alTotalAnnual), range(p.alCombinedTotal.projectedCostLkrMin, p.alCombinedTotal.projectedCostLkrMax)]}
          />
        </TableSection>
      )}

      <TableSection title="අධ්‍යාපන වියදම් (Education Cost)">
        <Table
          headers={COLS_3}
          rows={p.education.map((e) => {
            const annual: NumRange = { min: e.perYearCostTodayLkrMin, max: e.perYearCostTodayLkrMax };
            const monthly = divideRange(annual, 12);
            return [
              `${e.scenario === "overseas_degree" ? "විදේශීය උපාධිය (Overseas)" : "දේශීය (Local)"}${e.fieldOfStudyLabel ? ` — ${e.fieldOfStudyLabel}` : ""}`,
              rangeStr(monthly),
              rangeStr(annual),
              range(e.projectedCostAtAge19LkrMin, e.projectedCostAtAge19LkrMax),
            ];
          })}
        />
      </TableSection>

      {p.overseasDegreeCostBreakdown.applicable && (
        <TableSection title={`විදේශීය උපාධි වියදම් විස්තරය — වසර ${p.overseasDegreeCostBreakdown.durationYears}ක් (Overseas Degree Breakdown)`}>
          <Table
            headers={COLS_3}
            rows={[
              overseasRow("පාඨමාලා ගාස්තු (Tuition)", p.overseasDegreeCostBreakdown.tuitionLkrMin, p.overseasDegreeCostBreakdown.tuitionLkrMax, p.overseasDegreeCostBreakdown.durationYears, inflationPercent, yearsToHigherEd),
              overseasRow("නවාතැන් (Accommodation)", p.overseasDegreeCostBreakdown.accommodationLkrMin, p.overseasDegreeCostBreakdown.accommodationLkrMax, p.overseasDegreeCostBreakdown.durationYears, inflationPercent, yearsToHigherEd),
              overseasRow("ආහාර (Food)", p.overseasDegreeCostBreakdown.foodLkrMin, p.overseasDegreeCostBreakdown.foodLkrMax, p.overseasDegreeCostBreakdown.durationYears, inflationPercent, yearsToHigherEd),
              overseasRow("සෞඛ්‍ය රක්ෂණය (Health insurance)", p.overseasDegreeCostBreakdown.healthInsuranceLkrMin, p.overseasDegreeCostBreakdown.healthInsuranceLkrMax, p.overseasDegreeCostBreakdown.durationYears, inflationPercent, yearsToHigherEd),
              overseasRow("ප්‍රවාහන/සන්නිවේදන (Transport/comms)", p.overseasDegreeCostBreakdown.transportCommunicationsLkrMin, p.overseasDegreeCostBreakdown.transportCommunicationsLkrMax, p.overseasDegreeCostBreakdown.durationYears, inflationPercent, yearsToHigherEd),
            ]}
            totalRow={[
              "එකතුව (Total)",
              rangeStr(divideRange({ min: p.overseasDegreeCostBreakdown.grandTotalTodayLkrMin, max: p.overseasDegreeCostBreakdown.grandTotalTodayLkrMax }, p.overseasDegreeCostBreakdown.durationYears * 12)),
              rangeStr(divideRange({ min: p.overseasDegreeCostBreakdown.grandTotalTodayLkrMin, max: p.overseasDegreeCostBreakdown.grandTotalTodayLkrMax }, p.overseasDegreeCostBreakdown.durationYears)),
              range(p.overseasDegreeCostBreakdown.projectedGrandTotalLkrMin, p.overseasDegreeCostBreakdown.projectedGrandTotalLkrMax),
            ]}
          />
        </TableSection>
      )}

      {p.localPrivateLivingExpenses.applicable && (
        <TableSection title="විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම් (University Living Expenses)">
          <Table
            headers={COLS_3}
            rows={[
              livingCategoryRow("නවාතැන් (Accommodation)", p.localPrivateLivingExpenses.monthlyCategories.accommodationLkrMin, p.localPrivateLivingExpenses.monthlyCategories.accommodationLkrMax, p.localPrivateLivingExpenses.degreeDurationYearsMin, p.localPrivateLivingExpenses.degreeDurationYearsMax, inflationPercent, yearsToHigherEd),
              livingCategoryRow("ආහාර (Food & meals)", p.localPrivateLivingExpenses.monthlyCategories.foodLkrMin, p.localPrivateLivingExpenses.monthlyCategories.foodLkrMax, p.localPrivateLivingExpenses.degreeDurationYearsMin, p.localPrivateLivingExpenses.degreeDurationYearsMax, inflationPercent, yearsToHigherEd),
              livingCategoryRow("වෙනත් වියදම් (Misc)", p.localPrivateLivingExpenses.monthlyCategories.miscLkrMin, p.localPrivateLivingExpenses.monthlyCategories.miscLkrMax, p.localPrivateLivingExpenses.degreeDurationYearsMin, p.localPrivateLivingExpenses.degreeDurationYearsMax, inflationPercent, yearsToHigherEd),
            ]}
          />
          <Table
            className="mt-3"
            headers={COLS_3}
            rows={[
              livingCategoryRow("අඩු වියදම් (Saver tier)", p.localPrivateLivingExpenses.budgetTiers.saverLkrMin, p.localPrivateLivingExpenses.budgetTiers.saverLkrMax, p.localPrivateLivingExpenses.degreeDurationYearsMin, p.localPrivateLivingExpenses.degreeDurationYearsMax, inflationPercent, yearsToHigherEd),
              livingCategoryRow("සාමාන්‍ය (Moderate tier)", p.localPrivateLivingExpenses.budgetTiers.moderateLkrMin, p.localPrivateLivingExpenses.budgetTiers.moderateLkrMax, p.localPrivateLivingExpenses.degreeDurationYearsMin, p.localPrivateLivingExpenses.degreeDurationYearsMax, inflationPercent, yearsToHigherEd),
            ]}
            totalRow={[
              `ඇස්තමේන්තුගත එකතුව (${p.localPrivateLivingExpenses.degreeDurationYearsMin}-${p.localPrivateLivingExpenses.degreeDurationYearsMax}y)`,
              "—",
              "—",
              range(p.localPrivateLivingExpenses.projectedTotalLivingCostLkrMin, p.localPrivateLivingExpenses.projectedTotalLivingCostLkrMax),
            ]}
          />
        </TableSection>
      )}

      {p.governmentUniversityLivingExpenses.applicable && (
        <TableSection title="විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම් (University Living Expenses)">
          {p.governmentUniversityLivingExpenses.scenarios.map((s) => {
            const durMin = p.governmentUniversityLivingExpenses.degreeDurationYearsMin;
            const durMax = p.governmentUniversityLivingExpenses.degreeDurationYearsMax;
            const effectiveMonthly: NumRange = { min: s.effectiveMonthlyAverageLkr, max: s.effectiveMonthlyAverageLkr };
            return (
              <div key={s.label} className="mb-4 last:mb-0">
                <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">{s.label}</p>
                <Table
                  headers={COLS_3}
                  rows={[
                    livingCategoryRow("නවාතැන් (Accommodation)", s.accommodationLkrMin, s.accommodationLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
                    livingCategoryRow("ආහාර (Food)", s.foodLkrMin, s.foodLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
                    livingCategoryRow("ප්‍රවාහන (Transport)", s.transportLkrMin, s.transportLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
                    livingCategoryRow("වෙනත් (Misc)", s.miscLkrMin, s.miscLkrMax, durMin, durMax, inflationPercent, yearsToHigherEd),
                    ...(s.mahapolaMonthlyLkr != null
                      ? ([[
                          "මහපොළ ශිෂ්‍යත්වය (Mahapola, -)",
                          `-${lkr(s.mahapolaMonthlyLkr)}`,
                          `-${lkr(s.mahapolaMonthlyLkr * (s.mahapolaMonthsPerYear ?? 12))}`,
                          `${s.mahapolaMonthsPerYear}/12 මාස පමණක්`,
                        ]] as string[][])
                      : []),
                  ]}
                  totalRow={["ඵලදායි එකතුව (Effective total)", rangeStr(effectiveMonthly), rangeStr(multiplyRange(effectiveMonthly, 12)), range(s.projectedTotalCostLkrMin, s.projectedTotalCostLkrMax)]}
                />
              </div>
            );
          })}
        </TableSection>
      )}

      {p.vocationalTrainingLivingExpenses.applicable && (
        <TableSection title="පුහුණු කාලය තුළ ජීවන වියදම් (Training Period Living Expenses)">
          <Table
            headers={COLS_3}
            rows={[
              livingCategoryRow("ආහාර (Food)", p.vocationalTrainingLivingExpenses.monthlyCategories.foodLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.foodLkrMax, p.vocationalTrainingLivingExpenses.durationYears, p.vocationalTrainingLivingExpenses.durationYears, inflationPercent, yearsToHigherEd),
              livingCategoryRow("පාඨමාලා ද්‍රව්‍ය (Materials)", p.vocationalTrainingLivingExpenses.monthlyCategories.materialsLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.materialsLkrMax, p.vocationalTrainingLivingExpenses.durationYears, p.vocationalTrainingLivingExpenses.durationYears, inflationPercent, yearsToHigherEd),
              livingCategoryRow("ජංගම දත්ත (Mobile/internet)", p.vocationalTrainingLivingExpenses.monthlyCategories.mobileInternetLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.mobileInternetLkrMax, p.vocationalTrainingLivingExpenses.durationYears, p.vocationalTrainingLivingExpenses.durationYears, inflationPercent, yearsToHigherEd),
              livingCategoryRow("වෙනත් (Misc)", p.vocationalTrainingLivingExpenses.monthlyCategories.miscLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.miscLkrMax, p.vocationalTrainingLivingExpenses.durationYears, p.vocationalTrainingLivingExpenses.durationYears, inflationPercent, yearsToHigherEd),
            ]}
            totalRow={[
              `ඇස්තමේන්තුගත එකතුව (${p.vocationalTrainingLivingExpenses.durationYears}y)`,
              range(p.vocationalTrainingLivingExpenses.averageMonthlyLkrMin, p.vocationalTrainingLivingExpenses.averageMonthlyLkrMax),
              range(p.vocationalTrainingLivingExpenses.averageMonthlyLkrMin * 12, p.vocationalTrainingLivingExpenses.averageMonthlyLkrMax * 12),
              range(p.vocationalTrainingLivingExpenses.projectedTotalCostLkrMin, p.vocationalTrainingLivingExpenses.projectedTotalCostLkrMax),
            ]}
          />
        </TableSection>
      )}

      {p.healthRisk.flagged && (
        <TableSection title="සෞඛ්‍ය අවදානම (Health Risk Reference)">
          <Table headers={["", ""]} rows={[["ආවරණ යොමු මුදල (Reference cover amount)", lkr(p.healthRisk.referenceAmountLkr)]]} />
        </TableSection>
      )}

      {p.sports.provided && p.sports.monthlyCostLkr != null && (
        <TableSection title="ක්‍රීඩා සම්බන්ධ වියදම් (Sports/Extracurricular Cost)">
          <Table
            headers={COLS_3}
            rows={[]}
            totalRow={[
              "අනාගත ඇස්තමේන්තුව (Projected)",
              lkr(p.sports.monthlyCostLkr),
              lkr(p.sports.monthlyCostLkr * 12),
              lkr(p.sports.totalProjectedCostLkr),
            ]}
          />
        </TableSection>
      )}

      <TableSection title="සමස්ත සාරාංශය (Grand Total Summary)" highlight>
        <Table
          headers={["අංශය (Component)", "අනාගත ඇස්තමේන්තුව (Projected)"]}
          rows={[
            ["උසස් පෙළ (A/Level)", range(p.grandTotal.components.aLevelPeriodProjectedLkrMin, p.grandTotal.components.aLevelPeriodProjectedLkrMax)],
            ["උපාධි වියදම (Degree cost)", range(p.grandTotal.components.degreeCostProjectedLkrMin, p.grandTotal.components.degreeCostProjectedLkrMax)],
            ["ජීවන වියදම් (Living costs)", range(p.grandTotal.components.livingCostProjectedLkrMin, p.grandTotal.components.livingCostProjectedLkrMax)],
          ]}
          totalRow={["සම්පූර්ණ එකතුව (GRAND TOTAL)", range(p.grandTotal.projectedTotalLkrMin, p.grandTotal.projectedTotalLkrMax)]}
        />
      </TableSection>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.assumptions.disclaimer}</p>
    </div>
  );
}

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

function TableSection({
  title,
  highlight,
  children,
}: {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-700 dark:bg-emerald-900/20"
          : "rounded-xl border border-neutral-200 bg-white/60 p-4 dark:border-white/10 dark:bg-neutral-800/30"
      }
    >
      <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
      {children}
    </div>
  );
}

function Table({
  headers,
  rows,
  totalRow,
  className,
}: {
  headers: string[];
  rows: string[][];
  totalRow?: string[];
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className ?? ""}`}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`border-b border-neutral-200 px-3 py-2 font-medium text-neutral-600 dark:border-white/10 dark:text-neutral-400 ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="odd:bg-neutral-50/60 dark:odd:bg-white/5">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 ${ci === 0 ? "text-left text-neutral-700 dark:text-neutral-300" : "text-right font-medium tabular-nums text-neutral-900 dark:text-neutral-100"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {totalRow && (
            <tr className="border-t-2 border-neutral-300 font-semibold dark:border-white/20">
              {totalRow.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 ${ci === 0 ? "text-left text-neutral-900 dark:text-white" : "text-right tabular-nums text-emerald-700 dark:text-emerald-400"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
