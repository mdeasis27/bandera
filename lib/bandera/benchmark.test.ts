import { describe, expect, it } from "vitest";

import flagRaw from "./data/flag.json";
import fixture from "./fixtures/rollout.json";
import { benchmark } from "./benchmark";
import { decide } from "./rollout";
import type { FlagConfig } from "./types";

const CFG = flagRaw as unknown as FlagConfig;

describe("decide", () => {
  it("kills when the CI is entirely below -margin", () => {
    expect(decide(-0.09, -0.05, 0.02)).toBe("kill");
  });

  it("advances when the CI lower bound is at/above -margin", () => {
    expect(decide(0.05, 0.1, 0.02)).toBe("advance");
    expect(decide(-0.01, 0.04, 0.02)).toBe("advance");
  });

  it("holds when the CI straddles -margin", () => {
    expect(decide(-0.04, 0.0, 0.02)).toBe("hold");
  });
});

describe("pinned fixture: rollout", () => {
  it("reproduces the rollout outcomes and per-stage statistics", () => {
    const results = benchmark(CFG);

    for (const expected of fixture.experiments) {
      const got = results.find((r) => r.id === expected.id)!;
      expect(got.completed).toBe(expected.completed);
      expect(got.killed).toBe(expected.killed);
      expect(got.killedAt).toBe(expected.killedAt);
      expect(got.regressions).toBe(expected.regressions);
      expect(got.finalTraffic).toBeCloseTo(expected.finalTraffic, 10);
      expect(got.stages.map((s) => s.decision)).toEqual(expected.decisions);

      for (let i = 0; i < expected.stages.length; i++) {
        const es = expected.stages[i];
        const gs = got.stages[i];
        expect(gs.stage).toBeCloseTo(es.stage, 10);
        expect(gs.delta).toBeCloseTo(es.delta, 10);
        expect(gs.pValue).toBeCloseTo(es.pValue, 10);
        expect(gs.ciLow).toBeCloseTo(es.ciLow, 10);
        expect(gs.ciHigh).toBeCloseTo(es.ciHigh, 10);
      }
    }
  });

  it("completes the good variant and kills the bad one", () => {
    const results = benchmark(CFG);
    const good = results.find((r) => r.id === "smart-routing")!;
    const bad = results.find((r) => r.id === "smart-routing-bad")!;

    expect(good.completed).toBe(true);
    expect(good.regressions).toBe(0);
    expect(good.finalTraffic).toBe(1);

    expect(bad.killed).toBe(true);
    expect(bad.regressions).toBe(1);
    expect(bad.finalTraffic).toBe(0);
  });
});
