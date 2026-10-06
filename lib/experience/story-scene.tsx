"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { FlowDiagram, type FlowTone } from "@/design-system/demo/flow-diagram";
import type { RolloutResult } from "@/lib/bandera/types";
import { banderaCells, revealedStages, rolloutStatus } from "./scene-state";
import { STORY } from "./story";

const POS = { users: { x: 10, y: 95 }, flag: { x: 230, y: 95 }, current: { x: 470, y: 20 }, next: { x: 470, y: 170 } } as const;

export function BanderaStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: RolloutResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const revealed = revealedStages(frame, result.stages.length, reduced);
  const cells = banderaCells(result, revealed);
  const last = revealed > 0 ? result.stages[revealed - 1] : undefined;
  const nextTone: FlowTone = !last ? "idle" : last.decision === "kill" ? "danger" : last.decision === "hold" ? "off" : "success";
  const stopped = revealed >= result.stages.length && !result.completed;
  const tone: Record<keyof typeof POS, FlowTone> = { users: "idle", flag: "active", current: stopped ? "success" : "idle", next: nextTone };
  const nodes = (Object.keys(POS) as (keyof typeof POS)[]).map(id => ({ id, ...POS[id], ...copy.nodes[id], tone: tone[id] }));
  const reached = copy.reached(rolloutStatus(result.stages, revealed));
  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <FlowDiagram nodes={nodes} width={640} height={260} ariaLabel={reached} statusLabels={copy.statusLabels} edges={[
      { from: "users", to: "flag" },
      { from: "flag", to: "current", tone: stopped ? "success" : "idle" },
      { from: "flag", to: "next", tone: nextTone },
    ]} />
    <div className="mt-6">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={24} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{reached}</p>
    </div>
  </StoryStage>;
}
