import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { banderaCells, revealedStages } from "./scene-state";
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
