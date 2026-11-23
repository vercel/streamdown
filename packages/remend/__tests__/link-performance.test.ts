import { describe, expect, it } from "vitest";
import remend from "../src";

const bestTime = (input: string, options: Parameters<typeof remend>[1]) => {
  remend(input, options);
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    remend(input, options);
    best = Math.min(best, performance.now() - start);
  }
  return best;
};

describe("completed link detection", () => {
  it.each([
    "protocol",
    "text-only",
  ] as const)("stays linear for unmatched brackets before a link in %s mode", (linkMode) => {
    const make = (n: number) => `${"[".repeat(n)}[link](url)`;
    const options = { linkMode };
    const small = make(2000);
    const large = make(8000);

    expect(remend(large, options)).toBe(large);
    expect(remend(remend(large, options), options)).toBe(large);
    // Quadrupling the input costs ~4x for a linear scan, ~16x if every
    // unmatched bracket starts another search over its remaining suffix.
    expect(bestTime(large, options) / bestTime(small, options)).toBeLessThan(
      10
    );
  });
});

describe("nested bracket healing", () => {
  const nested = (n: number) => `${"[".repeat(n)}${"]".repeat(n)}`;
  const image = "](streamdown:incomplete-image)";

  it.each([
    "protocol",
    "text-only",
  ] as const)("stays linear for balanced nested brackets in %s mode", (linkMode) => {
    const options = { linkMode };
    const small = nested(2000);
    const large = nested(8000);

    expect(remend(nested(3), options)).toBe("[[[]]]");
    expect(remend(large, options)).toBe(large);
    // Matching every bracket with its own forward scan costs ~16x here
    expect(bestTime(large, options) / bestTime(small, options)).toBeLessThan(
      10
    );
  });

  it.each([
    "protocol",
    "text-only",
  ] as const)("stays linear for an image with nested alt brackets in %s mode", (linkMode) => {
    const make = (n: number) => `![${nested(n)}](x`;
    const options = { linkMode };
    const small = make(2000);
    const large = make(8000);

    expect(remend(make(3), options)).toBe(`![${nested(3)}${image}`);
    const healed = remend(large, options);
    expect(healed).toBe(`![${nested(8000)}${image}`);
    expect(remend(healed, options)).toBe(healed);
    expect(bestTime(large, options) / bestTime(small, options)).toBeLessThan(
      10
    );
  });

  it.each([
    "protocol",
    "text-only",
  ] as const)("stays linear for a linked image with nested alt brackets in %s mode", (linkMode) => {
    const make = (n: number) => `[![${nested(n)}](x`;
    const options = { linkMode };
    const small = make(2000);
    const large = make(8000);

    expect(remend(make(3), options)).toContain(`![${nested(3)}${image}`);
    expect(remend(large, options)).toContain(`![${nested(8000)}${image}`);
    expect(bestTime(large, options) / bestTime(small, options)).toBeLessThan(
      10
    );
    // Healing the healed image again runs the bracket loop over its alt text
    const healedSmall = remend(small, options);
    const healedLarge = remend(large, options);
    expect(
      bestTime(healedLarge, options) / bestTime(healedSmall, options)
    ).toBeLessThan(10);
  });
});
