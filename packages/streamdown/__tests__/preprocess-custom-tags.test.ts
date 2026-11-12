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

  it("should pad a nested unclosed tag after an already-interrupted one", () => {
    const md = "<outer>\n\n**x**\n<inner>\n**y**";
    const result = preprocessCustomTags(md, ["outer", "inner"]);
    expect(result).toBe("<outer>\n\n**x**\n<inner>\n\n**y**");
  });

  it("should replace blank lines between nested unclosed tags either way", () => {
    const expected = "<outer>\n\nx\n<!---->\ny\n<inner>\n\nz\n<!---->\nw";
    const tags = ["outer", "inner"];
    expect(preprocessCustomTags("<outer>\nx\n\ny\n<inner>\nz\n\nw", tags)).toBe(
      expected
    );
    expect(
      preprocessCustomTags("<outer>\n\nx\n\ny\n<inner>\nz\n\nw", tags)
    ).toBe(expected);
  });

  it("should not pad an unclosed tag inside fenced code", () => {
    const md = "<outer>\n\n```\n<inner>\nz\n```";
    expect(preprocessCustomTags(md, ["outer", "inner"])).toBe(md);
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

  it("should keep blank lines inside fenced code blocks in closed tags", () => {
    const md = "<custom>\n```js\nconst a = 1;\n\nconst b = 2;\n```\n</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe(
      "<custom>\n\n```js\nconst a = 1;\n\nconst b = 2;\n```\n\n</custom>\n\n"
    );
  });

  it("should still replace blank lines around a fenced code block", () => {
    const md = "<custom>\nA\n\n~~~\nx\n\ny\n~~~\n\nB\n</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe(
      "<custom>\n\nA\n<!---->\n~~~\nx\n\ny\n~~~\n<!---->\nB\n\n</custom>\n\n"
    );
  });

  it("should keep blank lines inside an unclosed fence in an unclosed tag", () => {
    const md = "<ai-thinking>\nhello\n\n```py\na = 1\n\nb = 2";
    const result = preprocessCustomTags(md, ["ai-thinking"]);
    expect(result).toBe(
      "<ai-thinking>\n\nhello\n<!---->\n```py\na = 1\n\nb = 2"
    );
  });

  it("should not treat a backtick line with an info string as a closing fence", () => {
    const md = "<custom>\n```md\n```js\n\nx\n```\n</custom>";
    const result = preprocessCustomTags(md, ["custom"]);
    expect(result).toBe("<custom>\n\n```md\n```js\n\nx\n```\n\n</custom>\n\n");
  });

  it("should leave blank lines after a self-closing tag unchanged", () => {
    const md = '<cite id="a" />\n\n- one\n\n- two\n\nLast';
    expect(preprocessCustomTags(md, ["cite"])).toBe(md);
  });

  it("should not pair a self-closing tag with a later closing tag", () => {
    const md = '<cite id="a" />\n\nText\n\n<cite id="b">\nBody\n</cite>';
    const result = preprocessCustomTags(md, ["cite"]);
    expect(result).toBe(
      '<cite id="a" />\n\nText\n\n<cite id="b">\n\nBody\n\n</cite>\n\n'
    );
  });

  it("should leave a tag after text with a soft line break unchanged", () => {
    const md = "He said: <verse>line one\nline two</verse> and left.";
    expect(preprocessCustomTags(md, ["verse"])).toBe(md);
  });

  it("should leave a tag after text unchanged when its body has a blank line", () => {
    const md = "He said: <verse>a\n\nb</verse> and left.";
    expect(preprocessCustomTags(md, ["verse"])).toBe(md);
  });

  it("should leave an unclosed tag after text unchanged while streaming", () => {
    const md = "He said: <verse>\nline one";
    expect(preprocessCustomTags(md, ["verse"])).toBe(md);
  });

  it.each([
    ["<note>a</note> <note>\n**b**\n</note>"],
    ["Text <note>\na</note><note>\n**b**\n</note>"],
  ])("should leave a tag after an inline tag on the same line unchanged", (md) => {
    expect(preprocessCustomTags(md, ["note"])).toBe(md);
  });

  it.each([
    ["<x>\na</x><y>\n**b**\n</y>"],
    ["<x>\na</x> - <y>\n**b**\n</y>"],
  ])("should not depend on the tag order for adjacent containers", (md) => {
    expect(preprocessCustomTags(md, ["y", "x"])).toBe(
      preprocessCustomTags(md, ["x", "y"])
    );
  });

  it("should treat a leading byte order mark as the start of the line", () => {
    expect(preprocessCustomTags("\uFEFF<x>\n**b**\n</x>", ["x"])).toBe(
      "\uFEFF<x>\n\n**b**\n\n</x>\n\n"
    );
  });

  it("should pad a nested tag the same in either allowedTags order", () => {
    const md = "<outer>\n<inner>\n**b**\n</inner>\n</outer>";
    const padded = "<outer>\n\n<inner>\n\n**b**\n\n</inner>\n\n</outer>\n\n";
    expect(preprocessCustomTags(md, ["outer", "inner"])).toBe(padded);
    expect(preprocessCustomTags(md, ["inner", "outer"])).toBe(padded);
  });

  it("should pad a nested tag of the same name", () => {
    expect(
      preprocessCustomTags("<note>\n<note>\n**b**\n</note>\n</note>", ["note"])
    ).toBe("<note>\n\n<note>\n\n**b**\n\n</note>\n\n</note>\n\n");
  });

  it("should not duplicate text for crossing tags", () => {
    expect(preprocessCustomTags("<a>\n<b>\n</a>\nmid\n</b>", ["a", "b"])).toBe(
      "<a>\n\n<b>\n\n</a>\n\n\nmid\n</b>"
    );
  });

  it("should pad deeply nested and many sibling tags quickly", () => {
    const depth = 200;
    const nested = `${"<note>\n".repeat(depth)}**b**\n${"</note>\n".repeat(depth)}`;
    const siblings = Array.from(
      { length: 3000 },
      (_, i) => `<note>\nitem ${i}\n</note>`
    ).join("\n\n");

    const start = performance.now();
    const result = preprocessCustomTags(nested, ["note"]);
    preprocessCustomTags(siblings, ["note"]);
    expect(performance.now() - start).toBeLessThan(500);
    expect(result.match(/<note>\n\n/g)).toHaveLength(depth);
  });

  it("should not pair or pad tags inside fenced code", () => {
    const md = "```\n<note>\nx\n</note>\n```";
    expect(preprocessCustomTags(md, ["note"])).toBe(md);

    const outer = "<note>\n```\n</note>\n```\n</note>";
    expect(preprocessCustomTags(outer, ["note"])).toBe(
      "<note>\n\n```\n</note>\n```\n\n</note>\n\n"
    );
  });

  it("should not overflow the stack on pathologically deep nesting", () => {
    const depth = 20_000;
    const nested = `${"<note>\n".repeat(depth)}${"</note>\n".repeat(depth)}`;
    const inline = `${"<note>".repeat(depth)}\n${"</note>".repeat(depth)}`;
    const fenced = `\`\`\`\n${nested}\`\`\`\n`;

    const start = performance.now();
    expect(() => preprocessCustomTags(nested, ["note"])).not.toThrow();
    expect(() => preprocessCustomTags(inline, ["note"])).not.toThrow();
    expect(preprocessCustomTags(fenced, ["note"])).toBe(fenced);
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it("should pad an unclosed nested tag while streaming, in either order", () => {
    const md = "<outer>\n<inner>\n**b**";
    const padded = "<outer>\n\n<inner>\n\n**b**";
    expect(preprocessCustomTags(md, ["outer", "inner"])).toBe(padded);
    expect(preprocessCustomTags(md, ["inner", "outer"])).toBe(padded);
  });
});
