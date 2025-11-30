import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("image handling", () => {
  it("should remove incomplete images", () => {
    expect(parseIncompleteMarkdown("Text with ![incomplete image")).toBe(
      "Text with "
    );
    expect(parseIncompleteMarkdown("![partial")).toBe("");
  });

  it("should keep complete images unchanged", () => {
    const text = "Text with ![alt text](image.png)";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle partial image at chunk boundary", () => {
    expect(parseIncompleteMarkdown("See ![the diag")).toBe("See ");
    // Images with partial URLs should be removed (images can't show skeleton)
    expect(parseIncompleteMarkdown("![logo](./assets/log")).toBe("");
  });

  it("should handle nested brackets in incomplete images", () => {
    // When findMatchingClosingBracket returns -1 for an image (lines 74-79)
    // For this to happen, we need an opening bracket with a ] but no proper matching
    expect(parseIncompleteMarkdown("Text ![outer [inner]")).toBe("Text ");
    expect(parseIncompleteMarkdown("![nested [brackets] text")).toBe("");
    expect(parseIncompleteMarkdown("Start ![foo [bar] baz")).toBe("Start ");
  });
});
