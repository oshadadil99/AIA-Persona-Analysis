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
