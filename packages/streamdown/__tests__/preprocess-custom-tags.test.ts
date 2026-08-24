import { describe, expect, it } from "vitest";
import { preprocessCustomTags } from "../lib/preprocess-custom-tags";

describe("preprocessCustomTags", () => {
  it("should return markdown unchanged when tagNames is empty", () => {
    const md = "<custom>\n\nContent\n\n</custom>";
    expect(preprocessCustomTags(md, [])).toBe(md);
  });

  it("should replace blank lines inside custom tags with HTML comments", () => {
    const md = "<custom>\nHello\n\nWorld\n</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>\n\nHello\n<!---->\nWorld\n\n</custom>\n\n");
  });

  it("should ensure blank lines when content is inline with opening tag", () => {
    const md = "<custom>Hello\n\nWorld</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>\n\nHello\n<!---->\nWorld\n\n</custom>\n\n");
  });

  it("should handle multiple blank lines", () => {
    const md = "<custom>A\n\nB\n\nC</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe(
      "<custom>\n\nA\n<!---->\nB\n<!---->\nC\n\n</custom>\n\n"
    );
  });

  it("should handle multiple tag names", () => {
    const md = "<foo>A\n\nB</foo>\n<bar>C\n\nD</bar>";
    const result = preprocessCustomTags(md, ["foo", "bar"]);
    expect(result).toContain("<foo>\n\nA\n<!---->\nB\n\n</foo>");
    expect(result).toContain("<bar>\n\nC\n<!---->\nD\n\n</bar>");
  });

  it("should handle tags with attributes", () => {
    const md = '<custom class="test" id="x">A\n\nB</custom>';
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe(
      '<custom class="test" id="x">\n\nA\n<!---->\nB\n\n</custom>\n\n'
    );
  });

  it("should be case insensitive", () => {
    const md = "<Custom>A\n\nB</Custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<Custom>\n\nA\n<!---->\nB\n\n</Custom>\n\n");
  });

  it("should leave markdown without custom tags unchanged", () => {
    const md = "# Hello\n\nWorld";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });

  it("should not modify same-line content without newlines", () => {
    const md = "<custom>Hello World</custom>";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });

  it("should still normalize tags that already start on their own line", () => {
    const md = "<custom>\nHello\n</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    // Blank-line sandwich is required so nested markdown can parse.
    expect(result).toBe("<custom>\n\nHello\n\n</custom>\n\n");
  });

  it("should handle content on same line as opening tag (issue #456)", () => {
    const md =
      "<ai-thinking>this is thinking\n\n * why is break?</ai-thinking># Hello World";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe(
      "<ai-thinking>\n\nthis is thinking\n<!---->\n * why is break?\n\n</ai-thinking>\n\n# Hello World"
    );
  });

  it("should enable nested markdown for multi-line content", () => {
    const md = "<ai-thinking>\n**bold**</ai-thinking>";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe("<ai-thinking>\n\n**bold**\n\n</ai-thinking>\n\n");
  });

  it("should blank-line-interrupt unclosed multi-line tags while streaming", () => {
    const md = "<ai-thinking>\n**bold**";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe("<ai-thinking>\n\n**bold**");
  });

  it("should replace internal blank lines on unclosed tags", () => {
    const md = "<ai-thinking>\nhello\n\n**bold**";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe("<ai-thinking>\n\nhello\n<!---->\n**bold**");
  });

  it("should not double blank-line unclosed tags that already have one", () => {
    const md = "<ai-thinking>\n\n**bold**";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe("<ai-thinking>\n\n**bold**");
  });

  it("should leave unclosed open-only tags without body unchanged", () => {
    expect(preprocessCustomTags("<ai-thinking>", ["ai-thinking"])).toBe(
      "<ai-thinking>"
    );
    expect(preprocessCustomTags("<ai-thinking>\n", ["ai-thinking"])).toBe(
      "<ai-thinking>\n"
    );
  });

  it("should leave incomplete same-line unclosed tags unchanged", () => {
    const md = "<ai-thinking>**bol";
    expect(preprocessCustomTags(md, ["ai-thinking"])).toBe(md);
  });
});
