import { describe, expect, it } from "vitest";
import { preprocessCustomTags } from "../lib/preprocess-custom-tags";

describe("preprocessCustomTags", () => {
  it("should return markdown unchanged when tagNames is empty", () => {
    const md = "<custom>\n\nContent\n\n</custom>";
    expect(preprocessCustomTags(md, [])).toBe(md);
  });

  it("should replace blank lines inside custom tags with HTML comments", () => {
    const md = "<custom>Hello\n\nWorld</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>Hello\n<!---->\nWorld</custom>");
  });

  it("should handle multiple blank lines", () => {
    const md = "<custom>A\n\nB\n\nC</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>A\n<!---->\nB\n<!---->\nC</custom>");
  });

  it("should handle multiple tag names", () => {
    const md = "<foo>A\n\nB</foo>\n<bar>C\n\nD</bar>";
    const result = preprocessCustomTags(md, ["foo", "bar"]);
    expect(result).toContain("<foo>A\n<!---->\nB</foo>");
    expect(result).toContain("<bar>C\n<!---->\nD</bar>");
  });

  it("should handle tags with attributes", () => {
    const md = '<custom class="test" id="x">A\n\nB</custom>';
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe('<custom class="test" id="x">A\n<!---->\nB</custom>');
  });

  it("should be case insensitive", () => {
    const md = "<Custom>A\n\nB</Custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<Custom>A\n<!---->\nB</Custom>");
  });

  it("should leave markdown without custom tags unchanged", () => {
    const md = "# Hello\n\nWorld";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });

  it("should not affect content without blank lines", () => {
    const md = "<custom>Hello World</custom>";
    expect(preprocessCustomTags(md, ["custom"])).toBe(md);
  });
});
