import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { it } from "vitest";
import remend from "../src";

// Streams each response in a JSONL corpus through remend and counts frames
// whose render disagrees with the finished response's render. Run with
// CORPUS=<file.jsonl> [BASELINE=<path to another remend src>] [OUT=<file.json>]

interface Node {
  children?: Node[];
  position?: { end: { offset?: number }; start: { offset?: number } };
  type: string;
}

interface Sample {
  model: string;
  source: string;
  text: string;
}

type Heal = (text: string) => string;

const toSample = (line: string): Sample => {
  const value: unknown = JSON.parse(line);
  if (
    typeof value !== "object" ||
    value === null ||
    !("text" in value) ||
    typeof value.text !== "string"
  ) {
    throw new Error(`Corpus line has no text: ${line.slice(0, 80)}`);
  }
  const field = (key: string): string =>
    key in value ? String(value[key as keyof typeof value]) : "unknown";
  return { model: field("model"), source: field("source"), text: value.text };
};

const STEP = 4;
const STYLED = new Set(["emphasis", "strong", "delete", "inlineCode"]);
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;
const LEADING_TICKS = /^`+/;
const LETTER = /\p{L}/gu;
const DIGIT = /\d/g;
const LETTERS = /a+/g;
const ZERO_WIDTH_SPACE = "\u200B";

const parse = (markdown: string): Node =>
  fromMarkdown(markdown, {
    extensions: [gfmStrikethrough()],
    mdastExtensions: [gfmStrikethroughFromMarkdown()],
  });

// Each source offset's rendering: "" when it is syntax, otherwise the inline
// styles around the character it shows
const renderStyles = (markdown: string, root: Node, shift = 0): string[] => {
  const styles: string[] = new Array(markdown.length + shift).fill("");
  const visit = (node: Node, stack: string) => {
    const start = node.position?.start.offset ?? 0;
    const end = node.position?.end.offset ?? 0;
    const style = STYLED.has(node.type) ? `${stack}/${node.type}` : stack;
    if (node.type === "text") {
      for (let i = start; i < end; i++) {
        if (
          markdown[i] === "\\" &&
          i + 1 < end &&
          ASCII_PUNCTUATION.test(markdown[i + 1])
        ) {
          i++;
        }
        styles[shift + i] = `v${style}`;
      }
    } else if (node.type === "inlineCode") {
      const raw = markdown.slice(start, end);
      const ticks = raw.length - raw.replace(LEADING_TICKS, "").length;
      for (let i = start + ticks; i < end - ticks; i++) {
        styles[shift + i] = `v${style}`;
      }
    }
    for (const child of node.children ?? []) {
      visit(child, style);
    }
  };
  visit(root, "");
  return styles;
};

// Top-level block starts, since emphasis never crosses them
const blockStarts = (root: Node): number[] =>
  (root.children ?? []).map((child) => child.position?.start.offset ?? 0);

// Characters of the prefix whose rendering differs from the final render,
// plus characters the heal added that render as visible text
const mismatches = (
  prefix: string,
  healed: string,
  from: number,
  final: string[]
): number => {
  let cut = 0;
  while (cut < prefix.length && prefix[cut] === healed[cut]) {
    cut++;
  }
  const added = healed.length - prefix.length;
  const frame = renderStyles(
    healed.slice(from),
    parse(healed.slice(from)),
    from
  );
  let count = 0;
  for (let at = cut; at < cut + added; at++) {
    if ((frame[at] ?? "") !== "" && healed[at] !== ZERO_WIDTH_SPACE) {
      count++;
    }
  }
  for (let i = from; i < prefix.length; i++) {
    const at = i < cut ? i : i + added;
    if ((frame[at] ?? "") !== final[i]) {
      count++;
    }
  }
  return count;
};

// A coarse shape of the text before a cut, for grouping examples
const shapeOf = (tail: string): string =>
  tail.replace(LETTER, "a").replace(DIGIT, "0").replace(LETTERS, "a");

interface Arm {
  frames: number;
  glitches: number;
}

const measure = (samples: Sample[], arms: Record<string, Heal>) => {
  const byGroup = new Map<string, Record<string, Arm>>();
  const divergent = { baselineCloser: 0, branchCloser: 0, tie: 0 };
  const worse = new Map<string, { count: number; example: string }>();
  for (const sample of samples) {
    const group = `${sample.source} ${sample.model}`;
    const totals =
      byGroup.get(group) ??
      Object.fromEntries(
        Object.keys(arms).map((name) => [name, { frames: 0, glitches: 0 }])
      );
    byGroup.set(group, totals);
    const finalTree = parse(sample.text);
    const final = renderStyles(sample.text, finalTree);
    const starts = blockStarts(finalTree);
    for (let end = STEP; end < sample.text.length; end += STEP) {
      const prefix = sample.text.slice(0, end);
      const from = starts.findLast((start) => start < end) ?? 0;
      const healed = Object.fromEntries(
        Object.entries(arms).map(([name, heal]) => [name, heal(prefix)])
      );
      const counts: Record<string, number> = {};
      for (const name of Object.keys(arms)) {
        counts[name] = mismatches(prefix, healed[name], from, final);
        totals[name].frames++;
        if (counts[name] > 0) {
          totals[name].glitches++;
        }
      }
      if (arms.baseline && healed.baseline !== healed.branch) {
        if (counts.branch < counts.baseline) {
          divergent.branchCloser++;
        } else if (counts.branch > counts.baseline) {
          divergent.baselineCloser++;
          const tail = prefix.slice(Math.max(from, end - 24));
          const shape = shapeOf(tail);
          const entry = worse.get(shape) ?? {
            count: 0,
            example: JSON.stringify({
              tail,
              baseline: healed.baseline.slice(Math.max(from, end - 24)),
              branch: healed.branch.slice(Math.max(from, end - 24)),
              final: sample.text.slice(Math.max(from, end - 24), end + 24),
            }),
          };
          entry.count++;
          worse.set(shape, entry);
        } else {
          divergent.tie++;
        }
      }
    }
  }
  return {
    divergent,
    groups: Object.fromEntries(byGroup),
    worse: [...worse.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 40)
      .map(([shape, entry]) => ({ shape, ...entry })),
  };
};

it.skipIf(!process.env.CORPUS)(
  "measures streaming glitches against the final render",
  async () => {
    const samples: Sample[] = readFileSync(process.env.CORPUS ?? "", "utf8")
      .split("\n")
      .filter(Boolean)
      .map(toSample);
    const arms: Record<string, Heal> = { branch: remend };
    if (process.env.BASELINE) {
      const baseline = await import(resolve(process.env.BASELINE));
      arms.baseline = baseline.default;
    }
    const report = measure(samples, arms);
    writeFileSync(
      process.env.OUT ?? "stream-glitches.json",
      JSON.stringify(report, null, 2)
    );
  },
  24 * 60 * 60 * 1000
);
