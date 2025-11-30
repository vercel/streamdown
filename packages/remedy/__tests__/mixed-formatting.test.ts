import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("mixed formatting", () => {
  it("should handle multiple formatting types", () => {
    const text = "**bold** and *italic* and `code` and ~~strike~~";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should complete multiple incomplete formats", () => {
    expect(parseIncompleteMarkdown("**bold and *italic")).toBe(
      "**bold and *italic*"
    );
  });

  it("should handle nested formatting", () => {
    const text = "**bold with *italic* inside**";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should prioritize link/image preservation over formatting completion", () => {
    expect(parseIncompleteMarkdown("Text with [link and **bold")).toBe(
      "Text with [link and **bold](streamdown:incomplete-link)"
    );
  });

  it("should handle complex real-world markdown", () => {
    const text =
      "# Heading\n\n**Bold text** with *italic* and `code`.\n\n- List item\n- Another item with ~~strike~~";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle bold inside italic", () => {
    expect(parseIncompleteMarkdown("*italic with **bold")).toBe(
      "*italic with **bold***"
    );
  });

  it("should handle code inside bold", () => {
    // Bold gets closed first, then code
    expect(parseIncompleteMarkdown("**bold with `code")).toBe(
      "**bold with `code**`"
    );
  });

  it("should handle strikethrough with other formatting", () => {
    // Both formats get closed
    expect(parseIncompleteMarkdown("~~strike with **bold")).toBe(
      "~~strike with **bold**~~"
    );
  });

  it("should handle dollar sign inside other formatting", () => {
    // Bold gets closed, dollar sign stays as-is (likely currency)
    expect(parseIncompleteMarkdown("**bold with $x^2")).toBe(
      "**bold with $x^2**"
    );
  });

  it("should handle deeply nested incomplete formatting", () => {
    // Formats are closed in the order they're processed
    expect(parseIncompleteMarkdown("**bold *italic `code ~~strike")).toBe(
      "**bold *italic `code ~~strike*`~~"
    );
  });

  it("should preserve complete nested formatting", () => {
    const text = "**bold *italic* text** and `code`";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });
});
