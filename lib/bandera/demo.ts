// lib/bandera/demo.ts
// Wires the flag config + deterministic simulation into every number the
// dashboard displays. The statistical test is Welch's t-test (shared with
// ensayo); the rollout gate and kill-switch policy are the real logic.

import flagRaw from "./data/flag.json";
import { benchmark } from "./benchmark";
import type { FlagConfig, RolloutResult } from "./types";

const CFG = flagRaw as unknown as FlagConfig;

let memo: RolloutResult[] | null = null;

export function getConfig(): FlagConfig {
  return CFG;
}

export function getResults(): RolloutResult[] {
  if (!memo) {
    memo = benchmark(CFG);
  }
  return memo;
}
