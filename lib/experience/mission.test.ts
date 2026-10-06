import { expect, it } from "vitest";
import { runMission } from "./mission";

const run = async (variantQuality: number, noWorseMargin = 0.02) => (await runMission({ variantQuality, noWorseMargin }, new AbortController().signal, () => {})).result;

it("compares degraded users with and without the guard", async () => {
  const r = await run(0.66);
  expect(r.comparison).toEqual({ withGuard: 16, withoutGuard: 73 });
});

it("the story's default bet can go either way on the quality slider", async () => {
  expect((await run(0.72)).completed).toBe(false);
  const up = await run(0.74);
  expect(up.completed).toBe(true);
  expect(up.finalTraffic).toBe(1);
  expect((await run(0.66)).killed).toBe(true);
});
