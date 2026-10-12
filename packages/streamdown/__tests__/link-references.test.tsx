import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseMarkdownIntoBlocks, Streamdown } from "../index";

// The incremental path only applies when the input extends the previous
// input, so parsing an unrelated document first guarantees a full parse.
const parseFresh = (markdown: string): string[] => {
  parseMarkdownIntoBlocks("unrelated\n\ndocument\n");
  return parseMarkdownIntoBlocks(markdown);
};

describe("link reference definitions", () => {
  it("resolves a reference link whose definition is in a later block", () => {
    const markdown =
      "See [the docs][1] for details.\n\nMore text here.\n\n[1]: https://example.com/docs\n";

    const { container } = render(
      <Streamdown
        linkSafety={{ enabled: false }}
        parseIncompleteMarkdown={false}
      >
        {markdown}
      </Streamdown>
    );

    const link = container.querySelector('[data-streamdown="link"]');
    expect(link?.getAttribute("href")).toBe("https://example.com/docs");
    expect(link?.textContent).toBe("the docs");
    expect(container.textContent).not.toContain("[the docs][1]");
    expect(container.textContent).not.toContain("[1]:");
    expect(container.textContent).toContain("More text here.");
  });

  it("resolves collapsed and shortcut references to an earlier definition", () => {
    const markdown =
      "[docs]: https://example.com/docs\n\nRead [docs][] or [docs].\n";

    const { container } = render(
      <Streamdown
        linkSafety={{ enabled: false }}
        parseIncompleteMarkdown={false}
      >
        {markdown}
      </Streamdown>
    );

    const links = container.querySelectorAll('[data-streamdown="link"]');
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("https://example.com/docs");
    }
  });

  it("keeps documents with definitions in a single block", () => {
    const markdown =
      "See [the docs][1].\n\nMore text.\n\n> [1]: https://example.com\n";
    expect(parseFresh(markdown)).toEqual([markdown]);
  });

  it("still splits documents without definitions", () => {
    const markdown = "See [the docs](https://example.com).\n\nMore text.\n";
    expect(parseFresh(markdown)).toHaveLength(2);
  });

  it("ignores definition-like lines inside code blocks", () => {
    const markdown = "```\n[1]: not a definition\n```\n\nMore text.\n";
    expect(parseFresh(markdown)).toHaveLength(2);
  });

  it("matches a full parse while a definition nested in a list streams in", () => {
    const doc =
      "Intro paragraph.\n\nSecond paragraph with [a link][b].\n\n1.  item\n\n    [b]: https://b.example\n\nAfter.\n";
    parseMarkdownIntoBlocks("unrelated\n\ndocument\n");

    for (let i = 1; i <= doc.length; i += 1) {
      const prefix = doc.slice(0, i);
      expect(parseMarkdownIntoBlocks(prefix)).toEqual(parseFresh(prefix));
    }
    expect(parseFresh(doc)).toEqual([doc]);
  });
});
