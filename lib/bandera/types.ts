// lib/bandera/types.ts
// Core data shapes for the feature-flag rollout demo. Plain JSON-serializable
// shapes mirrored one-to-one in backend/src/bandera/types.py.

export interface FlagConfig {
  alpha: number;
  margin: number;
  stages: number[];
  sampleSize: number;
  spread: number;
  baselineMean: number;
  experiments: ExperimentConfig[];
}

export interface ExperimentConfig {
  id: string;
  name: string;
  variantMean: number;
  seed: number;
}

export type RolloutDecision = "advance" | "hold" | "kill";

export interface StageResult {
  stage: number;
  baselineMean: number;
  variantMean: number;
  delta: number;
  t: number;
  df: number;
  pValue: number;
  ciLow: number;
  ciHigh: number;
  decision: RolloutDecision;
  /** One per variant sample: "good" when the score is at least baseline mean minus the margin. */
  outcomes: ("good" | "degraded")[];
}

export interface RolloutResult {
  id: string;
  name: string;
  stages: StageResult[];
  completed: boolean;
  killed: boolean;
  killedAt: number | null;
  regressions: number;
  finalTraffic: number;
}
