import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("inline code formatting (`)", () => {
  it("should complete incomplete inline code", () => {
    expect(parseIncompleteMarkdown("Text with `code")).toBe(
      "Text with `code`"
    );
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
});
