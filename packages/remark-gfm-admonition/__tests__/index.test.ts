import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import remarkGfmAdmonition from "../index";

function processMarkdown(md: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkGfmAdmonition)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString();
}

describe("remarkGfmAdmonition", () => {
  it("should transform [!NOTE] blockquote to github-compatible HTML", () => {
    const result = processMarkdown("> [!NOTE]\n> This is a note.");
    expect(result).toContain('class="markdown-alert markdown-alert-note"');
    expect(result).toContain('class="markdown-alert-title"');
    expect(result).toContain("Note");
    expect(result).toContain("This is a note.");
  });

  it("should support all 5 admonition types", () => {
    const types = [
      { input: "NOTE", title: "Note", cls: "markdown-alert-note" },
      { input: "TIP", title: "Tip", cls: "markdown-alert-tip" },
      {
        input: "IMPORTANT",
        title: "Important",
        cls: "markdown-alert-important",
      },
      { input: "WARNING", title: "Warning", cls: "markdown-alert-warning" },
      { input: "CAUTION", title: "Caution", cls: "markdown-alert-caution" },
    ];

    for (const { input, title, cls } of types) {
      const result = processMarkdown(`> [!${input}]\n> Content`);
      expect(result).toContain(cls);
      expect(result).toContain(title);
    }
  });

  it("should preserve normal blockquotes", () => {
    const result = processMarkdown("> This is a normal quote.");
    expect(result).not.toContain("markdown-alert");
    expect(result).toContain("<blockquote>");
  });

  it("should be case insensitive", () => {
    for (const variant of ["[!note]", "[!Note]", "[!NOTE]"]) {
      const result = processMarkdown(`> ${variant}\n> Content`);
      expect(result).toContain("markdown-alert-note");
    }
  });

  it("should leave invalid types as normal blockquotes", () => {
    const result = processMarkdown("> [!INVALID]\n> Content");
    expect(result).not.toContain("markdown-alert");
    expect(result).toContain("<blockquote>");
  });

  it("should handle empty body", () => {
    const result = processMarkdown("> [!NOTE]");
    expect(result).toContain("markdown-alert-note");
    expect(result).toContain("Note");
  });

  it("should preserve inline text after marker", () => {
    const result = processMarkdown("> [!NOTE] Some inline text");
    expect(result).toContain("markdown-alert-note");
    expect(result).toContain("Some inline text");
  });

  it("should handle multi-line content", () => {
    const result = processMarkdown("> [!NOTE]\n> Line 1\n> Line 2");
    expect(result).toContain("Line 1");
    expect(result).toContain("Line 2");
  });

  it("should use div wrapper, not blockquote", () => {
    const result = processMarkdown("> [!NOTE]\n> Content");
    expect(result).not.toContain("<blockquote>");
    expect(result).toContain("<div");
  });

  it("should render title as first child paragraph", () => {
    const result = processMarkdown("> [!WARNING]\n> Be careful!");
    const titleIndex = result.indexOf("markdown-alert-title");
    const contentIndex = result.indexOf("Be careful!");
    expect(titleIndex).toBeLessThan(contentIndex);
  });

  it("should not treat marker on non-first line as admonition", () => {
    const result = processMarkdown("> Some text\n> [!NOTE]");
    expect(result).not.toContain("markdown-alert");
    expect(result).toContain("<blockquote>");
  });

  it("should transform nested blockquote with marker", () => {
    const result = processMarkdown("> > [!NOTE]\n> > Nested note");
    expect(result).toContain("markdown-alert-note");
    expect(result).toContain("Nested note");
  });
});
