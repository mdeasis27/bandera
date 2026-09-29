// lib/ensayo/statistics.ts
// The real statistical core: Welch's t-test with the exact p-value and
// confidence interval, computed from the Student t distribution via the
// regularized incomplete beta function (Numerical Recipes). No external deps —
// the identical algorithm is mirrored in backend/src/ensayo/statistics.py so
// both languages produce bit-for-bit close results, pinned by fixtures.

export function mean(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function sampleVariance(xs: readonly number[]): number {
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / (xs.length - 1);
}

// log-gamma via Lanczos (g = 7).
export function lgamma(x: number): number {
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// Continued fraction for the incomplete beta function (Numerical Recipes).
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta I_x(a, b).
export function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

// Student's t CDF at t with `df` degrees of freedom.
export function tCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  const ib = betai(df / 2, 0.5, x);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

// Inverse t CDF (quantile) via bisection.
export function tQuantile(p: number, df: number): number {
  let lo = -1000;
  let hi = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tCDF(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface TTest {
  baselineMean: number;
  variantMean: number;
  delta: number;
  t: number;
  df: number;
  pValue: number;
  ciLow: number;
  ciHigh: number;
}

export function welchTTest(
  baseline: readonly number[],
  variant: readonly number[],
  alpha: number,
): TTest {
  const na = baseline.length;
  const nb = variant.length;
  const ma = mean(baseline);
  const mb = mean(variant);
  const va = sampleVariance(baseline);
  const vb = sampleVariance(variant);

  const delta = mb - ma;
  const se = Math.sqrt(va / na + vb / nb);
  const t = delta / se;
  const num = (va / na + vb / nb) ** 2;
  const den = (va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1);
  const df = num / den;

  const pValue = 2 * (1 - tCDF(Math.abs(t), df));
  const tCrit = tQuantile(1 - alpha / 2, df);
  const ciLow = delta - tCrit * se;
  const ciHigh = delta + tCrit * se;

  return { baselineMean: ma, variantMean: mb, delta, t, df, pValue, ciLow, ciHigh };
}
