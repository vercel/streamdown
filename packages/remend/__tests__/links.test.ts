import { describe, expect, it } from "vitest";
import remend from "../src";

describe("link handling", () => {
  it("should preserve incomplete links with special marker", () => {
    expect(remend("Text with [incomplete link")).toBe(
      "Text with [incomplete link](streamdown:incomplete-link)"
    );
    expect(remend("Text [partial")).toBe(
      "Text [partial](streamdown:incomplete-link)"
    );
  });

  it("should keep complete links unchanged", () => {
    const text = "Text with [complete link](url)";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple complete links", () => {
    const text = "[link1](url1) and [link2](url2)";
    expect(remend(text)).toBe(text);
  });

  it("should handle nested brackets in incomplete links", () => {
    // Test case for nested brackets - this would have caught the bracketDepth bug
    expect(remend("[outer [nested] text](incomplete")).toBe(
      "[outer [nested] text](streamdown:incomplete-link)"
    );

    expect(remend("[link with [inner] content](http://incomplete")).toBe(
      "[link with [inner] content](streamdown:incomplete-link)"
    );

    expect(remend("Text [foo [bar] baz](")).toBe(
      "Text [foo [bar] baz](streamdown:incomplete-link)"
    );
  });

  it("should handle nested brackets in complete links", () => {
    const text = "[link with [brackets] inside](https://example.com)";
    expect(remend(text)).toBe(text);
  });

  it("should handle partial link at chunk boundary - #165", () => {
    expect(remend("Check out [this lin")).toBe(
      "Check out [this lin](streamdown:incomplete-link)"
    );
    // Links with partial URLs should now be completed with placeholder
    expect(remend("Visit [our site](https://exa")).toBe(
      "Visit [our site](streamdown:incomplete-link)"
    );
  });

  it("should handle nested brackets without matching closing bracket", () => {
    // Case where there's an opening bracket with nested structure but no proper closing
    expect(remend("Text [outer [inner")).toBe(
      "Text [outer [inner](streamdown:incomplete-link)"
    );
    expect(remend("[foo [bar [baz")).toBe(
      "[foo [bar [baz](streamdown:incomplete-link)"
    );

    // Test lines 82-83: link (not image) where findMatchingClosingBracket returns -1
    // This happens when there's a [ with ] in text but improper nesting
    expect(remend("Text [outer [inner]")).toBe(
      "Text [outer [inner]](streamdown:incomplete-link)"
    );
    expect(remend("[link [nested] text")).toBe(
      "[link [nested] text](streamdown:incomplete-link)"
    );
  });
});
