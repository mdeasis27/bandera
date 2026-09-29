// lib/bandera/benchmark.ts
// Runs every experiment through the gradual rollout and collects the outcome.

import { simulateRollout } from "./rollout";
import type { FlagConfig, RolloutResult } from "./types";

export function benchmark(cfg: FlagConfig): RolloutResult[] {
  return cfg.experiments.map((e) => simulateRollout(cfg, e));
}
