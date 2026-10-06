import { getConfig } from "../bandera/demo";
import { generateScores } from "../bandera/simulation";
import { runExperience, SEED, type ExperienceInput } from "./adapter";

/** Users who got a worse experience if every stage had run, ignoring the gate. Same samples the guarded rollout draws. */
export function degradedWithoutGuard(input: ExperienceInput): number {
  const cfg = getConfig();
  return cfg.stages.reduce((n, _, i) => n + generateScores(SEED + i * 2 + 1, input.variantQuality, cfg.spread, cfg.sampleSize).filter((x) => x < cfg.baselineMean - input.noWorseMargin).length, 0);
}

export async function runMission(input: ExperienceInput, signal: AbortSignal, onEvent: Parameters<typeof runExperience>[2]) {
  const run = await runExperience(input, signal, onEvent);
  const withGuard = run.result.stages.flatMap((s) => s.outcomes).filter((o) => o === "degraded").length;
  return { ...run, result: { ...run.result, comparison: { withGuard, withoutGuard: degradedWithoutGuard(input) } } };
}
