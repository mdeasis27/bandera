import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import type { RolloutResult } from "@/lib/bandera/types";

const STAGES = 4, PER_STAGE = 24;

/** 96 cells, one row of 24 per stage. Stages that never ran show as "stayed on the current version" once every run stage is revealed. */
export function banderaCells(result: RolloutResult, revealed: number): TapeStatus[] {
  const ran = result.stages.length;
  return Array.from({ length: STAGES * PER_STAGE }, (_, k) => {
    const stage = Math.floor(k / PER_STAGE);
    if (stage < ran) return stage < revealed ? (result.stages[stage].outcomes[k % PER_STAGE] === "good" ? "served" : "lost") : "pending";
    return revealed >= ran ? "rerouted" : "pending";
  });
}

/** One trace event per stage that ran. */
export function revealedStages(frame: { visible: number; total: number; complete: boolean }, ran: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return ran;
  return Math.min(ran, frame.visible);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };

export type RolloutStatus = { approved: number; stoppedAt: number | null; killed: boolean };

/** Percent of users the rollout was approved up to, and the stage where it held or was switched off (null while it is still advancing). */
export function rolloutStatus(stages: RolloutResult["stages"], revealed: number): RolloutStatus {
  const shown = stages.slice(0, revealed);
  const approved = Math.round((shown.filter(s => s.decision === "advance").at(-1)?.stage ?? 0) * 100);
  const last = shown.at(-1);
  if (!last || last.decision === "advance") return { approved, stoppedAt: null, killed: false };
  return { approved, stoppedAt: Math.round(last.stage * 100), killed: last.decision === "kill" };
}
