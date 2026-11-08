import { describe, expect, it } from "vitest";
import { isInsideCodeBlock } from "../src/code-block-utils";

describe("isInsideCodeBlock", () => {
  it("reports positions inside a fenced code block", () => {
    const text = "before\n```js\nconst x = arr[0];\n```\nafter";
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

  it("treats a backtick run that is not at line start as inline code", () => {
    const text = "before ```js const x = arr[0]; ``` after";
    expect(isInsideCodeBlock(text, text.indexOf("arr"))).toBe(true);
    expect(isInsideCodeBlock(text, text.indexOf("after"))).toBe(false);
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
