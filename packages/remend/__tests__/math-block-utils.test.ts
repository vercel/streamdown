import { describe, expect, it } from "vitest";
import { isWithinMathBlock } from "../src/utils";

// Reference implementation: the previous per-call scan, kept verbatim so the
// lookup-based rewrite can be checked against it position by position.
type MathContext =
  | "none"
  | "inlineDollar"
  | "blockDollar"
  | "inlineLatex"
  | "blockLatex";

const referenceIsWithinMathBlock = (
  text: string,
  position: number
): boolean => {
  let mathContext: MathContext = "none";

  for (let i = 0; i < text.length && i < position; i += 1) {
    if (text[i] === "\\" && text[i + 1] === "$") {
      i += 1;
      continue;
    }

    if (text[i] === "\\") {
      const next = text[i + 1];
      let nextContext: MathContext | null = null;
      if (next === "[" && mathContext === "none") {
        nextContext = "blockLatex";
      } else if (next === "]" && mathContext === "blockLatex") {
        nextContext = "none";
      } else if (next === "(" && mathContext === "none") {
        nextContext = "inlineLatex";
      } else if (next === ")" && mathContext === "inlineLatex") {
        nextContext = "none";
      }
      if (nextContext !== null) {
        mathContext = nextContext;
        i += 1;
        continue;
      }
    }

    if (
      text[i] === "$" &&
      mathContext !== "inlineLatex" &&
      mathContext !== "blockLatex"
    ) {
      const isBlockDelimiter = text[i + 1] === "$";
      if (isBlockDelimiter) {
        mathContext = mathContext === "blockDollar" ? "none" : "blockDollar";
        i += 1;
      } else if (mathContext !== "blockDollar") {
        mathContext = mathContext === "inlineDollar" ? "none" : "inlineDollar";
      }
    }
  }

  return mathContext !== "none";
};

// Returns positions where the rewrite disagrees with the reference scan.
const parityMismatches = (text: string): number[] => {
  const mismatches: number[] = [];
  for (let p = -1; p <= text.length + 2; p += 1) {
    if (isWithinMathBlock(text, p) !== referenceIsWithinMathBlock(text, p)) {
      mismatches.push(p);
    }
  }
  return mismatches;
};

// Small deterministic generator so the fuzz corpus is reproducible.
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

describe("isWithinMathBlock", () => {
  it("reports positions inside inline dollar math", () => {
    const text = "price $a_b$ here";
    expect(isWithinMathBlock(text, text.indexOf("a_b"))).toBe(true);
    expect(isWithinMathBlock(text, text.indexOf("here"))).toBe(false);
    expect(isWithinMathBlock(text, 0)).toBe(false);
  });

  it("reports positions inside block dollar math", () => {
    const text = "$$\nx_1 + x_2\n$$ after";
    expect(isWithinMathBlock(text, text.indexOf("x_1"))).toBe(true);
    expect(isWithinMathBlock(text, text.indexOf("after"))).toBe(false);
  });

  it("reports positions inside LaTeX paren and bracket math", () => {
    const paren = "see \\(a_b\\) and _x";
    expect(isWithinMathBlock(paren, paren.indexOf("a_b"))).toBe(true);
    expect(isWithinMathBlock(paren, paren.indexOf("_x"))).toBe(false);
    const bracket = "\\[\nx_1\n\\] tail";
    expect(isWithinMathBlock(bracket, bracket.indexOf("x_1"))).toBe(true);
    expect(isWithinMathBlock(bracket, bracket.indexOf("tail"))).toBe(false);
  });

  it("ignores escaped dollar signs", () => {
    const text = "costs \\$5 and _x";
    expect(isWithinMathBlock(text, text.indexOf("_x"))).toBe(false);
  });

  it("treats an unclosed delimiter as extending past the end", () => {
    const text = "open $x";
    expect(isWithinMathBlock(text, text.length)).toBe(true);
    expect(isWithinMathBlock(text, text.length + 5)).toBe(true);
  });

  it("returns false everywhere when the text has no delimiters", () => {
    const text = "plain *text* with _emphasis_ only";
    expect(parityMismatches(text)).toEqual([]);
    expect(isWithinMathBlock(text, text.length)).toBe(false);
  });

  it("matches the per-call scan at every position on mixed input", () => {
    const cases = [
      "$a$ b $$c$$ d \\(e\\) f \\[g\\] h",
      "\\$ not math $ open",
      "$$",
      "$$$",
      "$",
      "\\",
      "\\$",
      "$\\$$",
      "\\( $ \\) $",
      "\\[ \\( \\] \\)",
      "$$ \\( $$ \\)",
      "text \\\\( still",
      "a$b$$c$$$d",
      "$ unclosed \\[ nested",
      "\\] stray \\) stray $$ open",
    ];
    for (const text of cases) {
      expect(parityMismatches(text)).toEqual([]);
    }
  });

  it("matches the per-call scan on seeded random delimiter-dense strings", () => {
    const alphabet = ["$", "$", "\\", "(", ")", "[", "]", "a", " ", "\n", "_"];
    const random = seededRandom(20_260_921);
    for (let round = 0; round < 300; round += 1) {
      const length = 1 + Math.floor(random() * 40);
      let text = "";
      for (let k = 0; k < length; k += 1) {
        text += alphabet[Math.floor(random() * alphabet.length)];
      }
      expect(parityMismatches(text), JSON.stringify(text)).toEqual([]);
    }
  });

  it("stays correct when queried texts alternate", () => {
    const inMath = "$x_1$";
    const inProse = "plain _x";
    for (let round = 0; round < 3; round += 1) {
      expect(isWithinMathBlock(inMath, inMath.indexOf("_1"))).toBe(true);
      expect(isWithinMathBlock(inProse, inProse.indexOf("_x"))).toBe(false);
    }
  });
});
