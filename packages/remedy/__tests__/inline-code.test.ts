import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("inline code formatting (`)", () => {
  it("should complete incomplete inline code", () => {
    expect(parseIncompleteMarkdown("Text with `code")).toBe("Text with `code`");
    expect(parseIncompleteMarkdown("`incomplete")).toBe("`incomplete`");
  });

  it("should keep complete inline code unchanged", () => {
    const text = "Text with `inline code`";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple inline code sections", () => {
    const text = "`code1` and `code2`";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not complete backticks inside code blocks", () => {
    const text = "```\ncode block with `backtick\n```";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle incomplete code blocks correctly", () => {
    const text = "```javascript\nconst x = `template";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle inline triple backticks correctly", () => {
    const text = '```python print("Hello, Sunnyvale!")```';
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle incomplete inline triple backticks", () => {
    const text = '```python print("Hello, Sunnyvale!")``';
    expect(parseIncompleteMarkdown(text)).toBe(
      '```python print("Hello, Sunnyvale!")```'
    );
  });

  it("should not modify text with complete triple backticks at the end", () => {
    const text = "```code```";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "```code```\n";
    expect(parseIncompleteMarkdown(text2)).toBe(text2);

    // Even number of triple backticks with newlines are complete
    const text3 = "```\ncode\n```";
    expect(parseIncompleteMarkdown(text3)).toBe(text3);

    // Test the special case (lines 41-47) where text ends with ``` and has even count
    // This case is for inline triple backticks without newlines
    const text4 = "``````";
    expect(parseIncompleteMarkdown(text4)).toBe(text4);

    const text5 = "text``````";
    expect(parseIncompleteMarkdown(text5)).toBe(text5);
  });
});
