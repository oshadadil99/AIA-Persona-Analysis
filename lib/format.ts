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

// Header for the near-term reference column: one year of this cost, with one
// year of inflation applied. Names the actual calendar year rather than
// saying "in 1 year" — a concrete year is easier to place than a relative
// one. Shared by the on-screen tables and the PDF so both read identically.
export function oneYearCostHeader(inflationPercent: number, year: number): string {
  return `${year} වන විට උද්ධමනය සමග වසර 1ක වියදම (1-Year Cost, +${inflationPercent}%)`;
}

export interface Milestone {
  year: number;
  age: number;
}

export interface ReportTimeline {
  oneYearAhead: number;
  aLevel: Milestone;
  university: Milestone;
}

// Turns the projection's stored base year + milestone ages into the concrete
// calendar years each stage falls in. Projections saved before those fields
// existed fall back to today's year and Sri Lanka's standard milestone ages,
// so re-opening an old record doesn't print "undefined".
export function buildTimeline(opts: {
  baseYear?: number;
  aLevelStartAge?: number;
  universityStartAge?: number;
  aLevelYearsFromNow: number;
  universityYearsFromNow: number;
}): ReportTimeline {
  const baseYear = opts.baseYear ?? new Date().getFullYear();
  return {
    oneYearAhead: baseYear + 1,
    aLevel: { year: baseYear + opts.aLevelYearsFromNow, age: opts.aLevelStartAge ?? 17 },
    university: { year: baseYear + opts.universityYearsFromNow, age: opts.universityStartAge ?? 19 },
  };
}

// "2033 වන විට (වයස 17)" — when the stage starts, and how old the child is.
export function milestoneLabel(m: Milestone): string {
  return `${m.year} වන විට (වයස ${m.age})`;
}

// Inflates a today's-terms range forward by `years` at `inflationPercent`/year
// — same formula used everywhere else in the pipeline (assumptions.ts's
// futureValueOfCostToday), duplicated here so display-layer code can apply it
// per-row without needing the pipeline to precompute every line item.
export function inflateRange(r: NumRange, inflationPercent: number, years: number): NumRange {
  const factor = Math.pow(1 + inflationPercent / 100, years);
  return { min: r.min * factor, max: r.max * factor };
}
