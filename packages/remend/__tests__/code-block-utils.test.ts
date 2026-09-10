import { describe, expect, it } from "vitest";
import { isInsideCodeBlock } from "../src/code-block-utils";

// Reference implementation: the previous per-call scan, kept verbatim so the
// lookup-based rewrite can be checked against it position by position.
const referenceIsInsideCodeBlock = (
  text: string,
  position: number
): boolean => {
  let inInlineCode = false;
  let inMultilineCode = false;

  for (let i = 0; i < position; i += 1) {
    if (text[i] === "\\" && i + 1 < text.length && text[i + 1] === "`") {
      i += 1;
      continue;
    }
    if (text.substring(i, i + 3) === "```") {
      inMultilineCode = !inMultilineCode;
      i += 2;
      continue;
    }
    if (!inMultilineCode && text[i] === "`") {
      inInlineCode = !inInlineCode;
    }
  }

  return inInlineCode || inMultilineCode;
};

// Returns positions where the rewrite disagrees with the reference scan.
const parityMismatches = (text: string): number[] => {
  const mismatches: number[] = [];
  for (let p = 0; p <= text.length + 1; p += 1) {
    if (isInsideCodeBlock(text, p) !== referenceIsInsideCodeBlock(text, p)) {
      mismatches.push(p);
    }
  }
  return mismatches;
};

describe("isInsideCodeBlock", () => {
  it("reports positions inside a fenced code block", () => {
    const text = "before ```js\nconst x = arr[0];\n``` after";
    expect(isInsideCodeBlock(text, text.indexOf("arr"))).toBe(true);
    expect(isInsideCodeBlock(text, text.indexOf("before"))).toBe(false);
    expect(isInsideCodeBlock(text, text.indexOf("after"))).toBe(false);
  });

  it("reports positions inside inline code", () => {
    const text = "use `map[key]` here";
    expect(isInsideCodeBlock(text, text.indexOf("key"))).toBe(true);
    expect(isInsideCodeBlock(text, text.indexOf("here"))).toBe(false);
  });

  it("ignores escaped backticks", () => {
    const text = "not code \\` still [not] code";
    expect(isInsideCodeBlock(text, text.indexOf("[not]"))).toBe(false);
  });

  it("treats an unclosed fence as extending to the end", () => {
    const text = "```python\nvalues[0] = 1";
    expect(isInsideCodeBlock(text, text.indexOf("values"))).toBe(true);
    expect(isInsideCodeBlock(text, text.length)).toBe(true);
  });

  it("matches the per-call scan at every position on mixed input", () => {
    const cases = [
      "a `b` c ```\nd [e] `f`\n``` g \\` h ``` i",
      "``````",
      "\\`",
      "`unclosed inline [x]",
      "text \\``real` code",
    ];
    for (const text of cases) {
      expect(parityMismatches(text)).toEqual([]);
    }
  });

  it("stays correct when queried texts alternate", () => {
    const inCode = "```\n[x]";
    const inProse = "plain [x]";
    for (let round = 0; round < 3; round += 1) {
      expect(isInsideCodeBlock(inCode, inCode.indexOf("[x]"))).toBe(true);
      expect(isInsideCodeBlock(inProse, inProse.indexOf("[x]"))).toBe(false);
    }
  });
});
