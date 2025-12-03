import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("edge cases", () => {
  it("should handle text ending with formatting characters", () => {
    expect(parseIncompleteMarkdown("Text ending with *")).toBe(
      "Text ending with *"
    );
    expect(parseIncompleteMarkdown("Text ending with **")).toBe(
      "Text ending with **"
    );
  });

  it("should handle empty formatting markers", () => {
    expect(parseIncompleteMarkdown("****")).toBe("****");
    expect(parseIncompleteMarkdown("``")).toBe("``");
  });

  it("should handle standalone emphasis characters (#90)", () => {
    // Standalone markers should not be auto-closed
    expect(parseIncompleteMarkdown("**")).toBe("**");
    expect(parseIncompleteMarkdown("__")).toBe("__");
    expect(parseIncompleteMarkdown("***")).toBe("***");
    expect(parseIncompleteMarkdown("*")).toBe("*");
    expect(parseIncompleteMarkdown("_")).toBe("_");
    expect(parseIncompleteMarkdown("~~")).toBe("~~");
    expect(parseIncompleteMarkdown("`")).toBe("`");

    // Multiple standalone markers on the same line
    expect(parseIncompleteMarkdown("** __")).toBe("** __");
    expect(parseIncompleteMarkdown("\n** __\n")).toBe("\n** __\n");
    expect(parseIncompleteMarkdown("* _ ~~ `")).toBe("* _ ~~ `");

    // Standalone markers with only whitespace
    expect(parseIncompleteMarkdown("** ")).toBe("** ");
    expect(parseIncompleteMarkdown(" **")).toBe(" **");
    expect(parseIncompleteMarkdown("  **  ")).toBe("  **  ");

    // But markers with actual content should still be closed
    expect(parseIncompleteMarkdown("**text")).toBe("**text**");
    expect(parseIncompleteMarkdown("__text")).toBe("__text__");
    expect(parseIncompleteMarkdown("*text")).toBe("*text*");
    expect(parseIncompleteMarkdown("_text")).toBe("_text_");
    expect(parseIncompleteMarkdown("~~text")).toBe("~~text~~");
    expect(parseIncompleteMarkdown("`text")).toBe("`text`");
  });

  it("should handle very long text", () => {
    const longText = `${"a".repeat(10_000)} **bold`;
    const expected = `${"a".repeat(10_000)} **bold**`;
    expect(parseIncompleteMarkdown(longText)).toBe(expected);
  });

  it("should handle text with only formatting characters", () => {
    expect(parseIncompleteMarkdown("*")).toBe("*");
    expect(parseIncompleteMarkdown("**")).toBe("**");
    expect(parseIncompleteMarkdown("`")).toBe("`");
  });

  it("should handle escaped characters", () => {
    const text = "Text with \\* escaped asterisk";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle markdown at very end of string", () => {
    expect(parseIncompleteMarkdown("text**")).toBe("text**");
    expect(parseIncompleteMarkdown("text*")).toBe("text*");
    expect(parseIncompleteMarkdown("text`")).toBe("text`");
    expect(parseIncompleteMarkdown("text$")).toBe("text$"); // Single dollar not completed
    expect(parseIncompleteMarkdown("text~~")).toBe("text~~");
  });

  it("should handle whitespace before incomplete markdown", () => {
    expect(parseIncompleteMarkdown("text **bold")).toBe("text **bold**");
    expect(parseIncompleteMarkdown("text\n**bold")).toBe("text\n**bold**");
    expect(parseIncompleteMarkdown("text\t`code")).toBe("text\t`code`");
  });

  it("should handle unicode characters in incomplete markdown", () => {
    expect(parseIncompleteMarkdown("**émoji 🎉")).toBe("**émoji 🎉**");
    expect(parseIncompleteMarkdown("`código")).toBe("`código`");
  });

  it("should handle HTML entities in incomplete markdown", () => {
    expect(parseIncompleteMarkdown("**&lt;tag&gt;")).toBe("**&lt;tag&gt;**");
    expect(parseIncompleteMarkdown("`&amp;")).toBe("`&amp;`");
  });
});
