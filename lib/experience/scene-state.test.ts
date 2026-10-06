import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { banderaCells, revealedStages, rolloutStatus } from "./scene-state";
import { runMission } from "./mission";

const result = async (q: number) => (await runMission({ variantQuality: q, noWorseMargin: .02 }, new AbortController().signal, () => {})).result;

it("fills one row of 24 per stage; stages that never ran stayed on the current version", async () => {
  const r = await result(.72);
  const cells = banderaCells(r, r.stages.length);
  expect(cells).toHaveLength(96);
  expect(tapeCounts(cells)).toEqual({ served: 35, lost: 13, rerouted: 48, pending: 0 });
});

it("hides stages not yet revealed and does not mark unrun stages early", async () => {
  const r = await result(.72);
  const cells = banderaCells(r, 1);
  expect(cells.slice(0, 24).every(c => c !== "pending")).toBe(true);
  expect(cells.slice(24).every(c => c === "pending")).toBe(true);
});

it("reveals every stage when complete, under reduced motion, or without a trace", () => {
  expect(revealedStages({ visible: 1, total: 2, complete: false }, 2, false)).toBe(1);
  expect(revealedStages({ visible: 2, total: 2, complete: true }, 2, false)).toBe(2);
  expect(revealedStages({ visible: 1, total: 2, complete: false }, 2, true)).toBe(2);
  expect(revealedStages({ visible: 0, total: 0, complete: false }, 2, false)).toBe(2);
});

it("rolloutStatus names the last approved stage and where the rollout stopped", async () => {
  const at = async (q: number) => { const r = await result(q); return rolloutStatus(r.stages, r.stages.length); };
  expect(await at(.72)).toEqual({ approved: 10, stoppedAt: 25, killed: false });
  expect(await at(.70)).toEqual({ approved: 0, stoppedAt: 10, killed: false });
  expect(await at(.62)).toEqual({ approved: 0, stoppedAt: 10, killed: true });
  expect(await at(.80)).toEqual({ approved: 100, stoppedAt: null, killed: false });
  const r = await result(.72);
  expect(rolloutStatus(r.stages, 1)).toEqual({ approved: 10, stoppedAt: null, killed: false });
  expect(rolloutStatus(r.stages, 0)).toEqual({ approved: 0, stoppedAt: null, killed: false });
});
