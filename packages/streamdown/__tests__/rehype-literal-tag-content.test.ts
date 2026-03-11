import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeLiteralTagContent } from "../lib/rehype/literal-tag-content";

const processHtml = async (html: string, tagNames: string[]) => {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeLiteralTagContent, tagNames)
    .use(rehypeStringify);
  return String(await processor.process(html));
};

describe("rehypeLiteralTagContent", () => {
  it("returns early when tagNames is empty", async () => {
    const html = "<custom-tag>Hello <b>World</b></custom-tag>";
    const result = await processHtml(html, []);
    // Should be unchanged — the <b> tag should still be present
    expect(result).toContain("<b>");
  });

  it("replaces children of matched elements with plain text", async () => {
    const html = "<custom-tag>Hello <b>World</b></custom-tag>";
    const result = await processHtml(html, ["custom-tag"]);
    // Should flatten to plain text, no <b> tag
    expect(result).not.toContain("<b>");
    expect(result).toContain("Hello World");
  });

  it("handles comment nodes inside matched elements (returns empty string)", async () => {
    const html = "<custom-tag><!-- a comment --></custom-tag>";
    const result = await processHtml(html, ["custom-tag"]);
    // Comment node returns "" from collectText, so children should be empty array
    expect(result).toContain("<custom-tag></custom-tag>");
  });

  it("handles mixed text and comment nodes", async () => {
    const html = "<custom-tag>Hello<!-- comment --> World</custom-tag>";
    const result = await processHtml(html, ["custom-tag"]);
    // Comment returns "", text nodes return their values
    expect(result).toContain("Hello World");
  });

  it("is case-insensitive for tag matching", async () => {
    const html = "<CustomTag>Content</CustomTag>";
    const result = await processHtml(html, ["customtag"]);
    expect(result).toContain("Content");
  });
});
