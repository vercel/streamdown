import { describe, expect, it } from "vitest";
import remend from "../src";

describe("edge cases", () => {
  it("should handle text ending with formatting characters", () => {
    expect(remend("Text ending with *")).toBe("Text ending with *");
    expect(remend("Text ending with **")).toBe("Text ending with **");
  });

  it("should handle empty formatting markers", () => {
    expect(remend("****")).toBe("****");
    expect(remend("``")).toBe("``");
  });

  it("should handle standalone emphasis characters (#90)", () => {
    // Standalone markers should not be auto-closed
    expect(remend("**")).toBe("**");
    expect(remend("__")).toBe("__");
    expect(remend("***")).toBe("***");
    expect(remend("*")).toBe("*");
    expect(remend("_")).toBe("_");
    expect(remend("~~")).toBe("~~");
    expect(remend("`")).toBe("`");

    // Multiple standalone markers on the same line
    expect(remend("** __")).toBe("** __");
    expect(remend("\n** __\n")).toBe("\n** __\n");
    expect(remend("* _ ~~ `")).toBe("* _ ~~ `");

    // Standalone markers with only whitespace
    expect(remend("** ")).toBe("**"); // Trailing single space removed
    expect(remend(" **")).toBe(" **");
    expect(remend("  **  ")).toBe("  **  "); // Trailing double space preserved as line break

    // But markers with actual content should still be closed
    expect(remend("**text")).toBe("**text**");
    expect(remend("__text")).toBe("__text__");
    expect(remend("*text")).toBe("*text*");
    expect(remend("_text")).toBe("_text_");
    expect(remend("~~text")).toBe("~~text~~");
    expect(remend("`text")).toBe("`text`");
  });

  it("should handle very long text", () => {
    const longText = `${"a".repeat(10_000)} **bold`;
    const expected = `${"a".repeat(10_000)} **bold**`;
    expect(remend(longText)).toBe(expected);
  });

  it("should handle text with only formatting characters", () => {
    expect(remend("*")).toBe("*");
    expect(remend("**")).toBe("**");
    expect(remend("`")).toBe("`");
  });

  it("should handle escaped characters", () => {
    const text = "Text with \\* escaped asterisk";
    expect(remend(text)).toBe(text);
  });

  it("should handle markdown at very end of string", () => {
    expect(remend("text**")).toBe("text**");
    expect(remend("text*")).toBe("text*");
    expect(remend("text`")).toBe("text`");
    expect(remend("text$")).toBe("text$"); // Single dollar not completed
    expect(remend("text~~")).toBe("text~~");
  });

  it("should handle whitespace before incomplete markdown", () => {
    expect(remend("text **bold")).toBe("text **bold**");
    expect(remend("text\n**bold")).toBe("text\n**bold**");
    expect(remend("text\t`code")).toBe("text\t`code`");
  });

  it("should handle unicode characters in incomplete markdown", () => {
    expect(remend("**émoji 🎉")).toBe("**émoji 🎉**");
    expect(remend("`código")).toBe("`código`");
  });

  it("should handle HTML entities in incomplete markdown", () => {
    expect(remend("**&lt;tag&gt;")).toBe("**&lt;tag&gt;**");
    expect(remend("`&amp;")).toBe("`&amp;`");
  });
});
