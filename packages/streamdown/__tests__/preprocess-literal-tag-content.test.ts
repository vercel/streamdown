import { describe, expect, it } from "vitest";
import { preprocessLiteralTagContent } from "../lib/preprocess-literal-tag-content";

describe("preprocessLiteralTagContent", () => {
  it("should return markdown unchanged when tagNames is empty", () => {
    const md = "<mention>_hello_</mention>";
    expect(preprocessLiteralTagContent(md, [])).toBe(md);
  });

  it("should escape underscores inside matching tags", () => {
    const md = "<mention>_some_username_</mention>";
    const result = preprocessLiteralTagContent(md, ["mention"]);
    expect(result).toBe("<mention>\\_some\\_username\\_</mention>");
  });

  it("should escape asterisks inside matching tags", () => {
    const md = "<tag>**bold** text</tag>";
    const result = preprocessLiteralTagContent(md, ["tag"]);
    expect(result).toContain("\\*\\*bold\\*\\*");
  });

  it("should escape backticks inside matching tags", () => {
    const md = "<tag>`inline code`</tag>";
    const result = preprocessLiteralTagContent(md, ["tag"]);
    expect(result).toContain("\\`inline code\\`");
  });

  it("should not affect content outside matching tags", () => {
    const md = "_outside_ <mention>_inside_</mention> _also_outside_";
    const result = preprocessLiteralTagContent(md, ["mention"]);
    // Outside content is unchanged
    expect(result).toContain("_outside_");
    expect(result).toContain("_also_outside_");
    // Inside content is escaped
    expect(result).toContain("\\_inside\\_");
  });

  it("should handle tags with attributes", () => {
    const md = '<mention user_id="123">_some_username_</mention>';
    const result = preprocessLiteralTagContent(md, ["mention"]);
    expect(result).toBe(
      '<mention user_id="123">\\_some\\_username\\_</mention>'
    );
  });

  it("should handle multiple tags", () => {
    const md = "<foo>_a_</foo> <bar>*b*</bar>";
    const result = preprocessLiteralTagContent(md, ["foo", "bar"]);
    expect(result).toContain("\\_a\\_");
    expect(result).toContain("\\*b\\*");
  });

  it("should be case insensitive", () => {
    const md = "<Mention>_hello_</Mention>";
    const result = preprocessLiteralTagContent(md, ["mention"]);
    expect(result).toBe("<Mention>\\_hello\\_</Mention>");
  });

  it("should leave unmatched tags unchanged", () => {
    const md = "<other>_hello_</other>";
    expect(preprocessLiteralTagContent(md, ["mention"])).toBe(md);
  });

  it("should handle content with no special characters unchanged", () => {
    const md = "<mention>hello world</mention>";
    const result = preprocessLiteralTagContent(md, ["mention"]);
    expect(result).toBe("<mention>hello world</mention>");
  });
});
