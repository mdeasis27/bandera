// lib/bandera/rollout.ts
// The gradual-rollout gate. At each stage, sample quality for baseline and
// variant, run a Welch t-test, and decide:
//   - kill:    the CI is entirely below -margin → the variant is confidently worse.
//   - advance: the CI lower bound is at/above -margin → the variant is no worse.
//   - hold:    the CI straddles -margin → not enough evidence.
// Mirrors backend/src/bandera/rollout.py.

import { generateScores } from "./simulation";
import { welchTTest } from "./statistics";
import type { ExperimentConfig, FlagConfig, RolloutDecision, RolloutResult } from "./types";

export function decide(ciLow: number, ciHigh: number, margin: number): RolloutDecision {
  if (ciHigh < -margin) return "kill";
  if (ciLow >= -margin) return "advance";
  return "hold";
}

export function simulateRollout(cfg: FlagConfig, experiment: ExperimentConfig): RolloutResult {
  const results: RolloutResult["stages"] = [];
  let killed = false;
  let killedAt: number | null = null;
  let regressions = 0;
  let fraction = 0;

  for (let i = 0; i < cfg.stages.length; i++) {
    const stage = cfg.stages[i];
    const baseline = generateScores(experiment.seed + i * 2, cfg.baselineMean, cfg.spread, cfg.sampleSize);
    const variant = generateScores(experiment.seed + i * 2 + 1, experiment.variantMean, cfg.spread, cfg.sampleSize);
    const t = welchTTest(baseline, variant, cfg.alpha);
    const decision = decide(t.ciLow, t.ciHigh, cfg.margin);
    const outcomes = variant.map((x): "good" | "degraded" => (x >= cfg.baselineMean - cfg.margin ? "good" : "degraded"));
    results.push({ stage, ...t, decision, outcomes });

    if (decision === "kill") {
      killed = true;
      killedAt = stage;
      regressions++;
      fraction = 0;
      break;
    }
    if (decision === "hold") {
      break;
    }
    fraction = stage;
  }

  const completed = !killed && fraction === cfg.stages[cfg.stages.length - 1];
  return {
    id: experiment.id,
    name: experiment.name,
    stages: results,
    completed,
    killed,
    killedAt,
    regressions,
    finalTraffic: fraction,
  };
}
