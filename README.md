# Bandera

**AI feature flags with gradual rollout** — a rollout that only advances when the variant is
statistically *no worse* than the baseline, with a kill-switch that rolls back on a regression.

> **Result:** the good variant rolls out **10% → 25% → 50% → 100% with 0 regressions** (each
> stage confirms p < 0.001 with a CI fully above the margin). The bad variant **kills at the
> first stage** — its CI is entirely below the no-worse margin, so the kill-switch rolls it back
> to **0% traffic** with **1 regression** caught, not shipped.

---

## Result

| Experiment | Δ (mean) | p-value | Decision per stage | Final traffic |
|---|---|---|---|---|
| Smart routing (real improvement) | +0.08 | < 0.001 | advance × 4 | **100%** |
| Smart routing (regression) | -0.064 | < 0.001 | kill | **0%** |

The good variant advances through every stage because its 95% CI never drops below `-margin`.
The bad variant trips the kill-switch immediately because its CI is entirely below `-margin`.
The rollout is a control loop, not a timeline: the traffic fraction moves only on statistical
evidence.

---

## Architecture

```
lib/bandera/                # canonical core (TypeScript, tested)
  statistics.ts             #   Welch t-test (shared with ensayo)
  simulation.ts             #   seeded LCG — deterministic quality samples
  rollout.ts                #   decide() + simulateRollout() (the gate + kill-switch)
  benchmark.ts              #   runs every experiment through the rollout
  demo.ts                   #   wires config + simulation into every number
  data/                     #   flag.json (stages, means, seeds)
  fixtures/                 #   rollout.json (pinned decisions + statistics)
backend/                    # same math in Python + pytest (authoritative)
  src/bandera/              #   statistics.py · simulation.py · rollout.py · benchmark.py
  tests/                    #   pinned to tests/fixtures/{flag,rollout}.json
app/                        # Next.js landing + demo dashboard (Vercel, demo mode)
```

The quality samples come from a seeded linear-congruential generator — the same `mod 2^32`
arithmetic in TypeScript and Python produces bit-identical samples, so the rollout decisions
are exactly reproducible. The statistical test is the same Welch t-test as `ensayo`.

## Design decisions & tradeoffs

1. **The gate reuses the statistical test, not a hand-rolled threshold.** "No worse" is a
   one-sided claim backed by the same t-test that gates `ensayo`'s A/B. The margin (0.02) is a
   tolerance band: a variant may be slightly worse and still advance, as long as it isn't
   *confidently* worse.
2. **A seeded LCG instead of committed score arrays.** Bandera needs fresh samples at every
   stage, so the simulation generates them deterministically — the same generator, the same
   seed, the same decisions in both languages.
3. **Kill-switch is a CI rule, not a dashboard alert.** `ciHigh < -margin` kills automatically;
   no human has to watch. The cost is that a noisy stage can hold or kill earlier than a human
   would, which the margin tunes.

## What did not work

- **The "hold" state is degenerate in this demo.** With clean means and a fixed margin, the CI
  never straddles the boundary, so "hold" never fires — it exists for correctness but isn't
  exercised by the two synthetic experiments. Real traffic with smaller effect sizes would hit it.
- **Uniform noise understates real tails.** A uniform `mean ± spread/2` has no outliers; real
  quality metrics are heavy-tailed. The demo isolates the *gate* rather than the noise model.

## Run it

```bash
# frontend demo + TS tests
pnpm install && pnpm dev      # http://localhost:3000
pnpm test                     # 8 vitest tests

# backend (authoritative math) — Python 3.12+
cd backend && uv sync --extra dev && uv run pytest   # 4 tests, pinned fixtures
```

## Stack

Next.js 16 · TypeScript · Vitest · Tailwind v4 · Python 3.13 · pytest
