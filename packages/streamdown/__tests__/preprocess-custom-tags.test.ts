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
    expect(result).toBe("<custom>\nHello\n<!---->\nWorld\n</custom>\n\n");
  });

  it("should ensure content is on its own lines when inline with opening tag", () => {
    const md = "<custom>Hello\n\nWorld</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>\nHello\n<!---->\nWorld\n</custom>\n\n");
  });

  it("should handle multiple blank lines", () => {
    const md = "<custom>A\n\nB\n\nC</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>\nA\n<!---->\nB\n<!---->\nC\n</custom>\n\n");
  });

  it("should handle multiple tag names", () => {
    const md = "<foo>A\n\nB</foo>\n<bar>C\n\nD</bar>";
    const result = preprocessCustomTags(md, ["foo", "bar"]);
    expect(result).toContain("<foo>\nA\n<!---->\nB\n</foo>");
    expect(result).toContain("<bar>\nC\n<!---->\nD\n</bar>");
  });

  it("should handle tags with attributes", () => {
    const md = '<custom class="test" id="x">A\n\nB</custom>';
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe(
      '<custom class="test" id="x">\nA\n<!---->\nB\n</custom>\n\n'
    );
  });

  it("should be case insensitive", () => {
    const md = "<Custom>A\n\nB</Custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<Custom>\nA\n<!---->\nB\n</Custom>\n\n");
  });

  it("should leave markdown without custom tags unchanged", () => {
    const md = "# Hello\n\nWorld";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });

  it("should not modify content without blank lines", () => {
    const md = "<custom>Hello World</custom>";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });

  it("should not modify tags where content already starts on own line without blank lines", () => {
    const md = "<custom>\nHello\n</custom>";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });

  it("should handle content on same line as opening tag (issue #456)", () => {
    const md =
      "<ai-thinking>this is thinking\n\n * why is break?</ai-thinking># Hello World";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe(
      "<ai-thinking>\nthis is thinking\n<!---->\n * why is break?\n</ai-thinking>\n\n# Hello World"
    );
  });
});
