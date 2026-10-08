import fc from "fast-check";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { describe, expect, it } from "vitest";
import remend from "../src";

interface Node {
  children?: Node[];
  position?: { end: { offset?: number }; start: { offset?: number } };
  type: string;
}

const parse = (markdown: string): Node =>
  fromMarkdown(markdown, {
    extensions: [gfmStrikethrough()],
    mdastExtensions: [gfmStrikethroughFromMarkdown()],
  });

const span = (node: Node): [number, number] => [
  node.position?.start.offset ?? 0,
  node.position?.end.offset ?? 0,
];

const INLINE = new Set(["emphasis", "strong", "delete", "inlineCode"]);
const TRANSPARENT = new Set(["link", "image", "text", "break"]);
const MARKER_PATTERN = /[*_~`]/g;
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;
const LEADING_TICKS = /^`+/;
const LEADING_MARKERS = /^[*_~`]+/;
const TRAILING_MARKERS = /[*_~`]+$/;
const CONTENT_PATTERN = /[^\s*_~`]/;

const literal = (markdown: string): number => {
  let count = 0;
  const visit = (node: Node) => {
    if (node.type === "text") {
      const [start, end] = span(node);
      count += markdown.slice(start, end).match(MARKER_PATTERN)?.length ?? 0;
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(parse(markdown));
  return count;
};

// Inline nodes drop out so a heal can only change structure by changing blocks
const blockShape = (node: Node): string =>
  INLINE.has(node.type) || TRANSPARENT.has(node.type)
    ? ""
    : `${node.type}(${(node.children ?? []).map(blockShape).filter(Boolean).join(",")})`;

const visibleOffsets = (markdown: string, root: Node): Set<number> => {
  const seen = new Set<number>();
  const visit = (node: Node) => {
    const [start, end] = span(node);
    if (node.type === "text") {
      for (let i = start; i < end; i++) {
        if (
          markdown[i] === "\\" &&
          i + 1 < end &&
          ASCII_PUNCTUATION.test(markdown[i + 1])
        ) {
          seen.add(markdown[i + 1] === "\\" ? i : i + 1);
          i++;
        } else {
          seen.add(i);
        }
      }
    } else if (node.type === "inlineCode") {
      const raw = markdown.slice(start, end);
      const ticks = raw.length - raw.replace(LEADING_TICKS, "").length;
      for (let i = start + ticks; i < end - ticks; i++) {
        seen.add(i);
      }
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(root);
  return seen;
};

const inlineSpans = (root: Node): Set<string> => {
  const spans = new Set<string>();
  const visit = (node: Node) => {
    if (INLINE.has(node.type)) {
      spans.add(`${node.type}:${span(node).join(":")}`);
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(root);
  return spans;
};

// A heal is faithful when it keeps the block structure, keeps the visible text the same,
// and every span it closes holds authored content
const faithful = (input: string, healed: string): boolean => {
  if (healed === input) {
    return true;
  }
  let cut = 0;
  while (cut < input.length && input[cut] === healed[cut]) {
    cut++;
  }
  const inputTree = parse(input);
  const healedTree = parse(healed);
  if (blockShape(healedTree) !== blockShape(inputTree)) {
    return false;
  }
  const shown = visibleOffsets(healed, healedTree);
  for (let i = cut; i < cut + healed.length - input.length; i++) {
    if (shown.has(i)) {
      return false;
    }
  }
  const before = inlineSpans(inputTree);
  let ok = true;
  const visit = (node: Node) => {
    const [start, end] = span(node);
    if (
      INLINE.has(node.type) &&
      (end > cut || !before.has(`${node.type}:${start}:${end}`))
    ) {
      const raw = healed.slice(start, end);
      const lead = raw.length - raw.replace(LEADING_MARKERS, "").length;
      const trail = raw.length - raw.replace(TRAILING_MARKERS, "").length;
      if (
        !CONTENT_PATTERN.test(
          healed.slice(start + lead, Math.min(end - trail, cut))
        )
      ) {
        ok = false;
      }
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(healedTree);
  return ok;
};

const WITHOUT_EMPHASIS = {
  bold: false,
  boldItalic: false,
  italic: false,
  strikethrough: false,
};

const healsCleanly = (input: string, heal: (text: string) => string) => {
  const healed = heal(input);
  return heal(healed) === healed && faithful(input, healed);
};

const ALPHABETS = [
  {
    name: "ASCII",
    tokens: ["a", " ", ".", "*", "**", "_", "__", "`", "\\", "~~", "\n"],
  },
  {
    name: "Unicode",
    tokens: ["a", "ि", "：", "中", "𠀀", " ", "*", "**", "_", "~~", "."],
  },
  {
    name: "links",
    tokens: ["a", " ", "*", "**", "_", "~~", "`", "[", "](u)", "]"],
  },
];

describe("emphasis oracle", () => {
  it.each([
    { name: "plain", input: "a", count: 0 },
    { name: "unmatched opener", input: "*a", count: 1 },
    { name: "matched pair", input: "*a*", count: 0 },
    { name: "code span", input: "`*a`", count: 0 },
  ])("literal counts $name", ({ input, count }) => {
    expect(literal(input)).toBe(count);
  });

  it.each([
    { name: "closing a span", input: "*a", healed: "*a*", expected: true },
    { name: "empty span", input: "a *", healed: "a **", expected: false },
    { name: "visible addition", input: "*a", healed: "*a*b", expected: false },
    { name: "block change", input: "a\n*", healed: "a\n***", expected: false },
  ])("faithful rejects or accepts $name", ({ input, healed, expected }) => {
    expect(faithful(input, healed)).toBe(expected);
  });

  it.each(ALPHABETS)("heals $name samples idempotently and faithfully", ({
    tokens,
  }) => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...tokens), { minLength: 1, maxLength: 8 }),
        (parts) => {
          const input = parts.join("");
          // Samples the other handlers already mangle say nothing about emphasis
          fc.pre(healsCleanly(input, (text) => remend(text, WITHOUT_EMPHASIS)));
          const healed = remend(input);
          expect(remend(healed)).toBe(healed);
          expect(faithful(input, healed)).toBe(true);
        }
      ),
      { numRuns: Number(process.env.NUM_RUNS ?? 2000) }
    );
  }, 120_000);
});
