import { describe, expect, it } from "vitest";
import { diffuse, noise, scramble } from "../index";

const UPPER_RE = /\p{Lu}/u;
const LOWER_RE = /\p{Ll}/u;
const DIGIT_RE = /\p{N}/u;

describe("noise", () => {
  it("keeps the shape of the text", () => {
    const text = "Rivers, 42 times—über!";
    const out = noise(text, 7);
    expect([...out]).toHaveLength([...text].length);
    [...text].forEach((real, i) => {
      const fake = [...out][i];
      if (UPPER_RE.test(real)) {
        expect(fake).toMatch(UPPER_RE);
      } else if (LOWER_RE.test(real)) {
        expect(fake).toMatch(LOWER_RE);
      } else if (DIGIT_RE.test(real)) {
        expect(fake).toMatch(DIGIT_RE);
      } else {
        expect(fake).toBe(real);
      }
    });
  });

  it("is deterministic per seed", () => {
    expect(noise("streaming", 3)).toBe(noise("streaming", 3));
    expect(noise("streaming", 3)).not.toBe(noise("streaming", 4));
  });
});

describe("effects", () => {
  it("diffuse scatters a blur without decorating", () => {
    expect(diffuse).toEqual({ duration: 420, name: "diffuse", scatter: 140 });
  });

  it("scramble stamps two different noise sets", () => {
    const attributes = scramble.decorate?.("Streaming", 11) ?? {};
    expect(Object.keys(attributes)).toEqual([
      "data-sd-glyphs",
      "data-sd-glyphs-alt",
    ]);
    expect(attributes["data-sd-glyphs"]).toHaveLength(9);
    expect(attributes["data-sd-glyphs"]).not.toBe(
      attributes["data-sd-glyphs-alt"]
    );
    expect(scramble.decorate?.("Streaming", 11)).toEqual(attributes);
  });
});
