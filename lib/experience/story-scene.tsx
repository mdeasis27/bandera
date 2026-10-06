"use client";
import type { CSSProperties } from "react";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts, type TapeStatus } from "@/design-system/demo/outcome-tape";
import type { RolloutResult } from "@/lib/bandera/types";
import { banderaCells, revealedStages, rolloutStatus, zoneStates, type ZoneState } from "./scene-state";
import { STORY } from "./story";

const ZONES = [10, 25, 50, 100], PER_ZONE = 24, COLS = 8, GAP = 38, R = 13, RW = 330, RH = 170, TOP = 72;
const FLAG_FILL = { idle: "fill-muted-foreground", advance: "fill-success", hold: "fill-warning", kill: "fill-danger" } as const;
const TABLE_FILL: Record<TapeStatus, string> = { served: "fill-success stroke-success", lost: "fill-danger stroke-danger", rerouted: "fill-info stroke-info", pending: "fill-background stroke-border" };
const ROOM_STROKE: Record<ZoneState, string> = { closed: "stroke-border [stroke-dasharray:6_5]", open: "stroke-muted-foreground", usual: "stroke-info" };

type SceneCopy = (typeof STORY)["en"]["scene"];

/** The dining room: four zones of 24 tables, one zone per rollout stage. `cols` = 2 on desktop, 1 stacked on phones. */
function Room({ cells, zones, animating, cols, copy, label }: { cells: TapeStatus[]; zones: ZoneState[]; animating: number; cols: 1 | 2; copy: SceneCopy; label: string }) {
  const at = (z: number) => ({ x: (z % cols) * (RW + 20), y: Math.floor(z / cols) * (RH + 15) });
  const w = cols * RW + (cols - 1) * 20, h = Math.ceil(ZONES.length / cols) * (RH + 15) - 15;
  return <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className={`block h-auto w-full ${cols === 1 ? "sm:hidden" : "hidden sm:block"}`}>
    {ZONES.map((pct, z) => {
      const o = at(z);
      return <g key={pct}>
        <rect x={o.x + 1} y={o.y + 1} width={RW - 2} height={RH - 2} rx={10} className={`fill-background transition-colors duration-300 motion-reduce:transition-none ${ROOM_STROKE[zones[z]]}`} strokeWidth={zones[z] === "usual" ? 2 : 1.5} />
        <text x={o.x + 14} y={o.y + 26} className="fill-foreground text-[17px] font-semibold">{copy.zone(pct)}</text>
        {zones[z] === "usual" ? <text x={o.x + 14} y={o.y + 46} className="fill-info text-[13px]">{copy.tape.rerouted}</text> : null}
        {Array.from({ length: PER_ZONE }, (_, k) => {
          const cell = cells[z * PER_ZONE + k], cx = o.x + 32 + (k % COLS) * GAP, cy = o.y + TOP + Math.floor(k / COLS) * GAP;
          return <g key={k} className={z === animating ? "bandera-pop" : undefined} style={{ animationDelay: `${k * 30}ms` } as CSSProperties}>
            <circle cx={cx} cy={cy} r={R} strokeWidth={1.5} className={`transition-colors duration-300 motion-reduce:transition-none ${TABLE_FILL[cell]}`} />
            {cell === "lost" ? <path d={`M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}M${cx + 5} ${cy - 5}L${cx - 5} ${cy + 5}`} className="stroke-white" strokeWidth={2.6} strokeLinecap="round" /> : null}
          </g>;
        })}
        {z === animating ? <g transform={`translate(${o.x + 32} ${o.y + TOP - R - 4})`}><g className="bandera-waiter">
          <rect x={-9} y={-12} width={18} height={13} rx={2} className="fill-warning" />
          <path d="M-5 -8H5M-5 -4H3" className="stroke-background" strokeWidth={1.5} />
        </g></g> : null}
      </g>;
    })}
  </svg>;
}

export function BanderaStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: RolloutResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const revealed = revealedStages(frame, result.stages.length, reduced);
  const cells = banderaCells(result, revealed);
  const zones = zoneStates(result, revealed);
  const decision = revealed > 0 ? result.stages[revealed - 1].decision : "idle";
  const flag = copy.flag[decision];
  const reached = copy.reached(rolloutStatus(result.stages, revealed));
  const n = tapeCounts(cells);
  const label = `${reached}. ${copy.summary(n.served, n.lost, n.rerouted)}`;
  // The waiter walks the zone that just opened; with reduced motion everything shows at once.
  const animating = reduced ? -1 : revealed - 1;
  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <div className="mb-5 flex items-center gap-3">
      <svg viewBox="0 0 72 60" aria-hidden="true" className="h-12 w-14 shrink-0">
        <circle cx={16} cy={12} r={10} className="fill-muted-foreground" />
        <rect x={4} y={24} width={24} height={34} rx={8} className="fill-muted-foreground" />
        <line x1={34} y1={0} x2={34} y2={58} className="stroke-muted-foreground" strokeWidth={3} />
        <path d="M35 2h34l-8 11l8 11h-34z" className={`transition-colors duration-300 motion-reduce:transition-none ${FLAG_FILL[decision]}`} />
      </svg>
      <div className="min-w-0" data-bandera-flag={decision}>
        <p className="text-lg font-semibold leading-tight">{flag.name}</p>
        <p className="text-sm leading-5 text-muted-foreground">{flag.sub}</p>
      </div>
    </div>
    <Room cells={cells} zones={zones} animating={animating} cols={2} copy={copy} label={label} />
    <Room cells={cells} zones={zones} animating={animating} cols={1} copy={copy} label={label} />
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
      {(["served", "lost", "rerouted"] as const).map(s => <li key={s} className="flex items-center gap-1.5"><span aria-hidden="true" className={`inline-flex size-3 items-center justify-center rounded-full text-[9px] font-bold leading-none text-white ${s === "served" ? "bg-success" : s === "lost" ? "bg-danger" : "bg-info"}`}>{s === "lost" ? "×" : null}</span>{copy.tape[s]}</li>)}
    </ul>
    <p aria-live="polite" className="mt-4 font-mono text-2xl font-semibold tracking-tight" data-bandera-reached>{reached}</p>
  </StoryStage>;
}
