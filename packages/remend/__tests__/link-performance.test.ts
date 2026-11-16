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
