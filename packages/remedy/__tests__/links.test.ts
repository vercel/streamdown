import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("link handling", () => {
  it("should preserve incomplete links with special marker", () => {
    expect(parseIncompleteMarkdown("Text with [incomplete link")).toBe(
      "Text with [incomplete link](streamdown:incomplete-link)"
    );
    expect(parseIncompleteMarkdown("Text [partial")).toBe(
      "Text [partial](streamdown:incomplete-link)"
    );
  });

  it("should keep complete links unchanged", () => {
    const text = "Text with [complete link](url)";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple complete links", () => {
    const text = "[link1](url1) and [link2](url2)";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle nested brackets in incomplete links", () => {
    // Test case for nested brackets - this would have caught the bracketDepth bug
    expect(parseIncompleteMarkdown("[outer [nested] text](incomplete")).toBe(
      "[outer [nested] text](streamdown:incomplete-link)"
    );

    expect(
      parseIncompleteMarkdown("[link with [inner] content](http://incomplete")
    ).toBe("[link with [inner] content](streamdown:incomplete-link)");

    expect(parseIncompleteMarkdown("Text [foo [bar] baz](")).toBe(
      "Text [foo [bar] baz](streamdown:incomplete-link)"
    );
  });

  it("should handle nested brackets in complete links", () => {
    const text = "[link with [brackets] inside](https://example.com)";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle partial link at chunk boundary - #165", () => {
    expect(parseIncompleteMarkdown("Check out [this lin")).toBe(
      "Check out [this lin](streamdown:incomplete-link)"
    );
    // Links with partial URLs should now be completed with placeholder
    expect(parseIncompleteMarkdown("Visit [our site](https://exa")).toBe(
      "Visit [our site](streamdown:incomplete-link)"
    );
  });
});
