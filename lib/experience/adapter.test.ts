import { describe, expect, it } from "vitest";
import { runExperience } from "./adapter";

describe("rollout experience", () => {
  it("advances a no-worse variant and kills a regressing variant", async () => {
    const advance = await runExperience({ variantQuality: 0.9, noWorseMargin: 0.02 });
    const kill = await runExperience({ variantQuality: 0.1, noWorseMargin: 0.02 });
    expect(advance.result.stages.at(-1)?.decision).toBe("advance");
    expect(kill.result.killed).toBe(true);
  });
});
