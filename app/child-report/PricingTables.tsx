import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";
import { lkr, range, perYearRange, perYearRangeFromDurationRange } from "@/lib/format";

export default function PricingTables({ projection }: { projection: ChildFutureProjection }) {
  const p = projection;

  const alTuitionPerYear = {
    min: p.alTuition.breakdown.monthlyCostLkrMin * 12,
    max: p.alTuition.breakdown.monthlyCostLkrMax * 12,
  };
  const alCombinedPerYear = {
    min: alTuitionPerYear.min + p.alMaterials.annualCostLkrMin,
    max: alTuitionPerYear.max + p.alMaterials.annualCostLkrMax,
  };

  return (
    <div className="space-y-8">
      {p.alTuition.applicable && (
        <TableSection title="උසස් පෙළ (A/Level) කාලය තුළ වියදම්">
          <Table
            headers={["අයිතමය (Item)", "වසරකට (Per Year)", "සම්පූර්ණ කාලය සඳහා (Whole Period)"]}
            rows={[
              ["උපකාරක පන්ති (Tuition classes)", range(alTuitionPerYear.min, alTuitionPerYear.max), range(p.alTuition.projectedCostLkrMin, p.alTuition.projectedCostLkrMax)],
              ["ඉගෙනුම් ද්‍රව්‍ය (Learning materials)", range(p.alMaterials.annualCostLkrMin, p.alMaterials.annualCostLkrMax), range(p.alMaterials.projectedCostLkrMin, p.alMaterials.projectedCostLkrMax)],
            ]}
            totalRow={["එකතුව (Total)", range(alCombinedPerYear.min, alCombinedPerYear.max), range(p.alCombinedTotal.projectedCostLkrMin, p.alCombinedTotal.projectedCostLkrMax)]}
          />
        </TableSection>
      )}

      <TableSection title="අධ්‍යාපන වියදම් (Education Cost)">
        <Table
          headers={["සැලැස්ම (Plan)", "වසරකට (Per Year)", `සම්පූර්ණ උපාධි කාලය (Whole Degree)`]}
          rows={p.education.map((e) => [
            `${e.scenario === "overseas_degree" ? "විදේශීය උපාධිය (Overseas)" : "දේශීය (Local)"}${e.fieldOfStudyLabel ? ` — ${e.fieldOfStudyLabel}` : ""}`,
            range(e.perYearCostTodayLkrMin, e.perYearCostTodayLkrMax),
            range(e.projectedCostAtAge19LkrMin, e.projectedCostAtAge19LkrMax),
          ])}
        />
      </TableSection>

      {p.overseasDegreeCostBreakdown.applicable && (
        <TableSection title={`විදේශීය උපාධි වියදම් විස්තරය — වසර ${p.overseasDegreeCostBreakdown.durationYears}ක් (Overseas Degree Breakdown)`}>
          <Table
            headers={["අයිතමය (Item)", "වසරකට (Per Year)", "සම්පූර්ණ කාලය සඳහා (Whole Period)"]}
            rows={[
              ["පාඨමාලා ගාස්තු (Tuition)", perYearRange(p.overseasDegreeCostBreakdown.tuitionLkrMin, p.overseasDegreeCostBreakdown.tuitionLkrMax, p.overseasDegreeCostBreakdown.durationYears), range(p.overseasDegreeCostBreakdown.tuitionLkrMin, p.overseasDegreeCostBreakdown.tuitionLkrMax)],
              ["නවාතැන් (Accommodation)", perYearRange(p.overseasDegreeCostBreakdown.accommodationLkrMin, p.overseasDegreeCostBreakdown.accommodationLkrMax, p.overseasDegreeCostBreakdown.durationYears), range(p.overseasDegreeCostBreakdown.accommodationLkrMin, p.overseasDegreeCostBreakdown.accommodationLkrMax)],
              ["ආහාර (Food)", perYearRange(p.overseasDegreeCostBreakdown.foodLkrMin, p.overseasDegreeCostBreakdown.foodLkrMax, p.overseasDegreeCostBreakdown.durationYears), range(p.overseasDegreeCostBreakdown.foodLkrMin, p.overseasDegreeCostBreakdown.foodLkrMax)],
              ["සෞඛ්‍ය රක්ෂණය (Health insurance)", perYearRange(p.overseasDegreeCostBreakdown.healthInsuranceLkrMin, p.overseasDegreeCostBreakdown.healthInsuranceLkrMax, p.overseasDegreeCostBreakdown.durationYears), range(p.overseasDegreeCostBreakdown.healthInsuranceLkrMin, p.overseasDegreeCostBreakdown.healthInsuranceLkrMax)],
              ["ප්‍රවාහන/සන්නිවේදන (Transport/comms)", perYearRange(p.overseasDegreeCostBreakdown.transportCommunicationsLkrMin, p.overseasDegreeCostBreakdown.transportCommunicationsLkrMax, p.overseasDegreeCostBreakdown.durationYears), range(p.overseasDegreeCostBreakdown.transportCommunicationsLkrMin, p.overseasDegreeCostBreakdown.transportCommunicationsLkrMax)],
            ]}
            totalRow={["එකතුව අද වටිනාකම (Total today)", perYearRange(p.overseasDegreeCostBreakdown.grandTotalTodayLkrMin, p.overseasDegreeCostBreakdown.grandTotalTodayLkrMax, p.overseasDegreeCostBreakdown.durationYears), range(p.overseasDegreeCostBreakdown.grandTotalTodayLkrMin, p.overseasDegreeCostBreakdown.grandTotalTodayLkrMax)]}
          />
        </TableSection>
      )}

      {p.localPrivateLivingExpenses.applicable && (
        <TableSection title="විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම් (University Living Expenses)">
          <Table
            headers={["අයිතමය (Item)", "මාසිකව (Monthly)"]}
            rows={[
              ["නවාතැන් (Accommodation)", range(p.localPrivateLivingExpenses.monthlyCategories.accommodationLkrMin, p.localPrivateLivingExpenses.monthlyCategories.accommodationLkrMax)],
              ["ආහාර (Food & meals)", range(p.localPrivateLivingExpenses.monthlyCategories.foodLkrMin, p.localPrivateLivingExpenses.monthlyCategories.foodLkrMax)],
              ["වෙනත් වියදම් (Misc)", range(p.localPrivateLivingExpenses.monthlyCategories.miscLkrMin, p.localPrivateLivingExpenses.monthlyCategories.miscLkrMax)],
            ]}
          />
          <Table
            className="mt-3"
            headers={["අයවැය මට්ටම (Budget tier)", "වසරකට (Per Year)"]}
            rows={[
              ["අඩු වියදම් (Saver)", range(p.localPrivateLivingExpenses.budgetTiers.saverLkrMin * 12, p.localPrivateLivingExpenses.budgetTiers.saverLkrMax * 12)],
              ["සාමාන්‍ය (Moderate)", range(p.localPrivateLivingExpenses.budgetTiers.moderateLkrMin * 12, p.localPrivateLivingExpenses.budgetTiers.moderateLkrMax * 12)],
            ]}
          />
          <Table
            className="mt-2"
            headers={["", "වසරකට සාමාන්‍යය (Per Year Avg)", `සම්පූර්ණ උපාධි කාලය (Whole Degree, ${p.localPrivateLivingExpenses.degreeDurationYearsMin}-${p.localPrivateLivingExpenses.degreeDurationYearsMax}y)`]}
            rows={[]}
            totalRow={[
              "ඇස්තමේන්තුගත එකතුව (Estimated total)",
              perYearRangeFromDurationRange(p.localPrivateLivingExpenses.projectedTotalLivingCostLkrMin, p.localPrivateLivingExpenses.projectedTotalLivingCostLkrMax, p.localPrivateLivingExpenses.degreeDurationYearsMin, p.localPrivateLivingExpenses.degreeDurationYearsMax),
              range(p.localPrivateLivingExpenses.projectedTotalLivingCostLkrMin, p.localPrivateLivingExpenses.projectedTotalLivingCostLkrMax),
            ]}
          />
        </TableSection>
      )}

      {p.governmentUniversityLivingExpenses.applicable && (
        <TableSection title="විශ්ව විද්‍යාල කාලය තුළ ජීවන වියදම් (University Living Expenses)">
          {p.governmentUniversityLivingExpenses.scenarios.map((s) => (
            <div key={s.label} className="mb-4 last:mb-0">
              <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">{s.label}</p>
              <Table
                headers={["අයිතමය (Item)", "මාසිකව (Monthly)"]}
                rows={[
                  ["නවාතැන් (Accommodation)", range(s.accommodationLkrMin, s.accommodationLkrMax)],
                  ["ආහාර (Food)", range(s.foodLkrMin, s.foodLkrMax)],
                  ["ප්‍රවාහන (Transport)", range(s.transportLkrMin, s.transportLkrMax)],
                  ["වෙනත් (Misc)", range(s.miscLkrMin, s.miscLkrMax)],
                  ...(s.mahapolaMonthlyLkr != null
                    ? ([["මහපොළ ශිෂ්‍යත්වය (Mahapola, -)", `-${lkr(s.mahapolaMonthlyLkr)} (${s.mahapolaMonthsPerYear}/12 මාස)`]] as [string, string][])
                    : []),
                ]}
              />
              <Table
                className="mt-2"
                headers={["", "වසරකට (Per Year)", `සම්පූර්ණ කාලය (Whole Period, ${p.governmentUniversityLivingExpenses.degreeDurationYearsMin}-${p.governmentUniversityLivingExpenses.degreeDurationYearsMax}y)`]}
                rows={[]}
                totalRow={["ඵලදායි එකතුව (Effective total)", lkr(s.effectiveMonthlyAverageLkr * 12), range(s.projectedTotalCostLkrMin, s.projectedTotalCostLkrMax)]}
              />
            </div>
          ))}
        </TableSection>
      )}

      {p.vocationalTrainingLivingExpenses.applicable && (
        <TableSection title="පුහුණු කාලය තුළ ජීවන වියදම් (Training Period Living Expenses)">
          <Table
            headers={["අයිතමය (Item)", "මාසිකව (Monthly)"]}
            rows={[
              ["ආහාර (Food)", range(p.vocationalTrainingLivingExpenses.monthlyCategories.foodLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.foodLkrMax)],
              ["පාඨමාලා ද්‍රව්‍ය (Materials)", range(p.vocationalTrainingLivingExpenses.monthlyCategories.materialsLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.materialsLkrMax)],
              ["ජංගම දත්ත (Mobile/internet)", range(p.vocationalTrainingLivingExpenses.monthlyCategories.mobileInternetLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.mobileInternetLkrMax)],
              ["වෙනත් (Misc)", range(p.vocationalTrainingLivingExpenses.monthlyCategories.miscLkrMin, p.vocationalTrainingLivingExpenses.monthlyCategories.miscLkrMax)],
            ]}
          />
          <Table
            className="mt-2"
            headers={["", "වසරකට (Per Year)", `සම්පූර්ණ කාලය (Whole Period, ${p.vocationalTrainingLivingExpenses.durationYears}y)`]}
            rows={[]}
            totalRow={[
              "ඇස්තමේන්තුගත එකතුව (Estimated total)",
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

      {p.sports.provided && (
        <TableSection title="ක්‍රීඩා සම්බන්ධ වියදම් (Sports/Extracurricular Cost)">
          <Table headers={["", ""]} rows={[["අනාගත ඇස්තමේන්තුව (Projected total)", lkr(p.sports.totalProjectedCostLkr)]]} />
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
      <table className="w-full min-w-[420px] border-collapse text-sm">
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
