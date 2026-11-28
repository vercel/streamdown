import { fromMarkdown } from "mdast-util-from-markdown";
import { describe, expect, it } from "vitest";
import remend from "../src";

// CommonMark lets a link destination contain parentheses when they are
// balanced, backslash-escaped, or inside a <...> destination, and lets a
// title sit between the destination and the closing ")". A ")" after "](" is
// therefore not always the end of the link.

const WIKI = "https://en.wikipedia.org/wiki/Pi_(constant)";

describe("link destinations with parentheses", () => {
  it("keeps a link open while its destination's own parentheses are closed", () => {
    expect(remend(`See [Pi](${WIKI}`)).toBe(
      "See [Pi](streamdown:incomplete-link)"
    );
    expect(remend("[a](http://x.com/a_(b_(c))")).toBe(
      "[a](streamdown:incomplete-link)"
    );
  });

  it("leaves complete links with balanced parentheses unchanged", () => {
    const text = `See [Pi](${WIKI}) for the value.`;
    expect(remend(text)).toBe(text);
    const nested = "[a](http://x.com/a_(b_(c))) ok";
    expect(remend(nested)).toBe(nested);
  });

  it("does not treat an escaped parenthesis as the end of the link", () => {
    expect(remend("[a](http://x.com/a\\)")).toBe(
      "[a](streamdown:incomplete-link)"
    );
    const text = "[a](http://x.com/a\\)) ok";
    expect(remend(text)).toBe(text);
  });

  it("does not end a <...> destination at a parenthesis inside it", () => {
    expect(remend("[a](<http://x.com/a)b")).toBe(
      "[a](streamdown:incomplete-link)"
    );
    const text = "[a](<http://x.com/a)b>) ok";
    expect(remend(text)).toBe(text);
  });

  it("waits for the closing parenthesis after a title", () => {
    expect(remend('[a](http://x.com "the (old) one"')).toBe(
      "[a](streamdown:incomplete-link)"
    );
    expect(remend("[a](http://x.com (see also)")).toBe(
      "[a](streamdown:incomplete-link)"
    );
    const text = '[a](http://x.com "the (old) one") ok';
    expect(remend(text)).toBe(text);
  });

  it("drops just the link syntax in text-only mode", () => {
    expect(remend(`See [Pi](${WIKI}`, { linkMode: "text-only" })).toBe(
      "See Pi"
    );
  });
});

// What a reader sees while the link streams in: no prefix may leave raw link
// syntax ("](") visible as text.
const visibleText = (markdown: string): string => {
  const out: string[] = [];
  const walk = (node: {
    type: string;
    value?: string;
    children?: unknown[];
  }) => {
    if (node.type === "text" && node.value) {
      out.push(node.value);
    }
    for (const child of (node.children ?? []) as (typeof node)[]) {
      walk(child);
    }
  };
  walk(fromMarkdown(markdown) as never);
  return out.join("");
};

describe("streaming a link whose destination has parentheses", () => {
  const documents = [
    `Pi is about 3.14 ([source](${WIKI})).`,
    "Read [the guide](https://example.com/docs_(v2)/intro) first.",
    "[a](http://x.com/a_(b_(c))) and [b](<http://y.com/x)y>) done",
  ];

  for (const doc of documents) {
    it(`never shows raw link syntax: ${doc}`, () => {
      for (let end = 1; end <= doc.length; end += 1) {
        const prefix = doc.slice(0, end);
        expect(visibleText(remend(prefix)), prefix).not.toContain("](");
      }
    });
  }
});
