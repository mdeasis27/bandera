import { describe, expect, it } from "vitest";
import { STORY } from "./story";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

describe("Bandera story copy", () => {
  it("has the same shape in English and Spanish", () => {
    const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];
    expect(keys(STORY.es)).toEqual(keys(STORY.en));
    expect(STORY.es.analogy.dictionary).toHaveLength(STORY.en.analogy.dictionary.length);
  });

  it("has no empty strings except the owner-supplied why note", () => {
    for (const locale of ["en", "es"] as const) {
      const { why, ...rest } = STORY[locale];
      expect(why.title.trim()).not.toBe("");
      for (const s of strings(rest)) expect(s.trim(), `${locale}: empty string`).not.toBe("");
    }
  });

  it("avoids AI-sounding patterns and brand names", () => {
    for (const locale of ["en", "es"] as const) expect(lintStory(STORY[locale]), locale).toEqual([]);
  });

  it("states the comparison truthfully at a gap, one user, a tie, zero and the reverse case", () => {
    expect(STORY.es.compare.sentence(16, 73)).toBe("Con la guardia, 16 usuarios tuvieron una peor experiencia. Sin ella, 73.");
    expect(STORY.es.compare.sentence(1, 5)).toContain("un usuario tuvo");
    expect(STORY.es.compare.sentence(4, 4)).toContain("Con o sin guardia, 4 usuarios");
    expect(STORY.es.compare.sentence(0, 0)).toContain("Nadie");
    expect(STORY.es.compare.sentence(5, 4)).toContain("la guardia no ayudó");
    expect(STORY.en.compare.sentence(16, 73)).toBe("With the guard, 16 users had a worse experience. Without it, 73.");
    expect(STORY.en.compare.sentence(5, 4)).toContain("the guard didn't help");
  });

  it("describes quality in words and asks the bet about the chosen quality", () => {
    expect(STORY.es.tryIt.question(.72)).toContain("igual de buena que la actual");
    expect(STORY.es.tryIt.question(.74)).toContain("un poco mejor que la actual");
    expect(STORY.en.tryIt.question(.6)).toContain("clearly worse");
    expect(STORY.en.tryIt.question(.84)).toContain("clearly better");
    for (const q of [.6, .72, .84]) expect(STORY.en.tryIt.question(q)).not.toMatch(/0\.\d/);
  });
});
