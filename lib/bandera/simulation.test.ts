import { describe, expect, it } from "vitest";

import { generateScores } from "./simulation";

describe("generateScores — deterministic LCG", () => {
  it("is reproducible for the same seed", () => {
    expect(generateScores(42, 0.72, 0.12, 24)).toEqual(generateScores(42, 0.72, 0.12, 24));
  });

  it("produces different samples for different seeds", () => {
    expect(generateScores(42, 0.72, 0.12, 24)).not.toEqual(generateScores(43, 0.72, 0.12, 24));
  });

  it("stays within mean ± spread/2", () => {
    const scores = generateScores(42, 0.72, 0.12, 100);
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0.72 - 0.06);
      expect(s).toBeLessThanOrEqual(0.72 + 0.06);
    }
  });
});
