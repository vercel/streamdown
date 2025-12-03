import { describe, expect, it } from "vitest";
import remend from "../src";

describe("image handling", () => {
  it("should remove incomplete images", () => {
    expect(remend("Text with ![incomplete image")).toBe("Text with ");
    expect(remend("![partial")).toBe("");
  });

  it("should keep complete images unchanged", () => {
    const text = "Text with ![alt text](image.png)";
    expect(remend(text)).toBe(text);
  });

  it("should handle partial image at chunk boundary", () => {
    expect(remend("See ![the diag")).toBe("See ");
    // Images with partial URLs should be removed (images can't show skeleton)
    expect(remend("![logo](./assets/log")).toBe("");
  });

  it("should handle nested brackets in incomplete images", () => {
    // When findMatchingClosingBracket returns -1 for an image (lines 74-79)
    // For this to happen, we need an opening bracket with a ] but no proper matching
    expect(remend("Text ![outer [inner]")).toBe("Text ");
    expect(remend("![nested [brackets] text")).toBe("");
    expect(remend("Start ![foo [bar] baz")).toBe("Start ");
  });
});
