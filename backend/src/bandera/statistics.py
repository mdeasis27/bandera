"""Statistics — mirrors lib/ensayo/statistics.ts.

Welch's t-test with the exact p-value and confidence interval, computed from the
Student t distribution via the regularized incomplete beta function (Numerical
Recipes). No external deps; identical algorithm to the TypeScript core.
"""

from __future__ import annotations

import math

_LG_COF = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
]


def mean(xs: list[float]) -> float:
    return sum(xs) / len(xs)


def sample_variance(xs: list[float]) -> float:
    m = mean(xs)
    return sum((x - m) * (x - m) for x in xs) / (len(xs) - 1)


def lgamma(x: float) -> float:
    y = x
    tmp = x + 5.5
    tmp -= (x + 0.5) * math.log(tmp)
    ser = 1.000000000190015
    for j in range(6):
        y += 1.0
        ser += _LG_COF[j] / y
    return -tmp + math.log((2.5066282746310005 * ser) / x)


def _betacf(a: float, b: float, x: float) -> float:
    MAXIT = 200
    EPS = 3e-12
    FPMIN = 1e-300
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - (qab * x) / qap
    if abs(d) < FPMIN:
        d = FPMIN
    d = 1.0 / d
    h = d
    for m in range(1, MAXIT + 1):
        m2 = 2 * m
        aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN:
            d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN:
            c = FPMIN
        d = 1.0 / d
        h *= d * c
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN:
            d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN:
            c = FPMIN
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < EPS:
            break
    return h


def betai(a: float, b: float, x: float) -> float:
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    bt = math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * math.log(x) + b * math.log(1.0 - x))
    if x < (a + 1.0) / (a + b + 2.0):
        return (bt * _betacf(a, b, x)) / a
    return 1.0 - (bt * _betacf(b, a, 1.0 - x)) / b


def t_cdf(t: float, df: float) -> float:
    x = df / (df + t * t)
    ib = betai(df / 2.0, 0.5, x)
    return 1.0 - 0.5 * ib if t >= 0 else 0.5 * ib


def t_quantile(p: float, df: float) -> float:
    lo, hi = -1000.0, 1000.0
    for _ in range(200):
        mid = (lo + hi) / 2.0
        if t_cdf(mid, df) < p:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def welch_ttest(baseline: list[float], variant: list[float], alpha: float) -> dict:
    na, nb = len(baseline), len(variant)
    ma, mb = mean(baseline), mean(variant)
    va, vb = sample_variance(baseline), sample_variance(variant)

    delta = mb - ma
    se = math.sqrt(va / na + vb / nb)
    t = delta / se
    num = (va / na + vb / nb) ** 2
    den = (va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1)
    df = num / den

    p_value = 2.0 * (1.0 - t_cdf(abs(t), df))
    t_crit = t_quantile(1.0 - alpha / 2.0, df)
    ci_low = delta - t_crit * se
    ci_high = delta + t_crit * se

    return {
        "baselineMean": ma,
        "variantMean": mb,
        "delta": delta,
        "t": t,
        "df": df,
        "pValue": p_value,
        "ciLow": ci_low,
        "ciHigh": ci_high,
    }
