// Shared plain (non-React) formatting helpers used by both the on-screen
// pricing tables and the server-rendered PDF template, so the two stay
// numerically identical.
export function lkr(n: number): string {
  return `LKR ${Math.round(n).toLocaleString()}`;
}

export function range(min: number, max: number): string {
  return min === max ? lkr(min) : `${lkr(min)} – ${lkr(max)}`;
}

export function perYearRange(totalMin: number, totalMax: number, durationYears: number): string {
  return range(totalMin / durationYears, totalMax / durationYears);
}

export function perYearRangeFromDurationRange(
  totalMin: number,
  totalMax: number,
  durationMin: number,
  durationMax: number,
): string {
  return range(totalMin / durationMax, totalMax / durationMin);
}

export interface NumRange {
  min: number;
  max: number;
}

export function divideRange(r: NumRange, divisor: number): NumRange {
  return { min: r.min / divisor, max: r.max / divisor };
}

export function multiplyRange(r: NumRange, factor: number): NumRange {
  return { min: r.min * factor, max: r.max * factor };
}

export function addRanges(a: NumRange, b: NumRange): NumRange {
  return { min: a.min + b.min, max: a.max + b.max };
}

// Total over a period whose duration is itself a min-max range: cheapest
// case is (monthly min x shortest duration), priciest is (monthly max x
// longest duration).
export function totalOverDurationRange(monthly: NumRange, durationMin: number, durationMax: number): NumRange {
  return { min: monthly.min * 12 * durationMin, max: monthly.max * 12 * durationMax };
}

export function rangeStr(r: NumRange): string {
  return range(r.min, r.max);
}

// Sinhala duration label for a period that may be a fixed number of years or
// a min-max range ("වසර 4ක්" / "වසර 3–4ක්"). Every projected-cost column
// states both WHEN the cost starts and HOW LONG it runs for, so a figure is
// never shown without the period it covers.
export function yearsLabel(min: number, max: number): string {
  return min === max ? `වසර ${min}ක්` : `වසර ${min}–${max}ක්`;
}

// Inflates a today's-terms range forward by `years` at `inflationPercent`/year
// — same formula used everywhere else in the pipeline (assumptions.ts's
// futureValueOfCostToday), duplicated here so display-layer code can apply it
// per-row without needing the pipeline to precompute every line item.
export function inflateRange(r: NumRange, inflationPercent: number, years: number): NumRange {
  const factor = Math.pow(1 + inflationPercent / 100, years);
  return { min: r.min * factor, max: r.max * factor };
}
