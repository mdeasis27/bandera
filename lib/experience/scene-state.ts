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
