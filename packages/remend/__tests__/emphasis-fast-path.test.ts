import fc from "fast-check";
import { expect, it } from "vitest";
import {
  matchDelimiterRuns,
  matchHealed,
  prepareHeal,
} from "../src/emphasis-delimiters";
import { isEscaped } from "../src/scan";

const TOKENS = [
  "a",
  " ",
  ".",
  "*",
  "**",
  "_",
  "__",
  "~~",
  "~",
  "`",
  "\\",
  "\n",
  "[",
  "](u)",
  "ि",
  "中",
  "：",
  "$",
  "<b>",
  "𠀀",
  "\n\n",
  "- ",
  "> ",
];

const WHITESPACE = /\s/;
const LINE_CONTENT = /[^\s*_~>+-]/;

const summary = (m: ReturnType<typeof matchDelimiterRuns>) => ({
  literal: m.literal,
  open: m.open.map((r) => `${r.index}:${r.count}`),
  runs: m.runs.map((r) => `${r.index}:${r.length}:${r.count}`),
});

it("fast path matches a full rescan", () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom(...TOKENS), { minLength: 1, maxLength: 9 }),
      fc.array(fc.constantFrom("*", "_", "~", "**", "~~"), {
        minLength: 1,
        maxLength: 4,
      }),
      fc.constantFrom("", " ", "\n", "  \n", "\\"),
      (tokens, closerParts, tail) => {
        const text = tokens.join("") + tail;
        let insertAt = text.length;
        while (insertAt > 0 && WHITESPACE.test(text[insertAt - 1])) {
          insertAt -= 1;
        }
        if (text[insertAt - 1] === "\\" && !isEscaped(text, insertAt - 1)) {
          insertAt -= 1;
        }
        const lineStart = text.lastIndexOf("\n", insertAt - 1) + 1;
        fc.pre(LINE_CONTENT.test(text.slice(lineStart, insertAt)));
        const closers = closerParts.join("");
        const healed = text.slice(0, insertAt) + closers + text.slice(insertAt);
        const base = prepareHeal(text, insertAt);
        expect(summary(matchHealed(base, closers))).toEqual(
          summary(matchDelimiterRuns(healed))
        );
      }
    ),
    { numRuns: Number(process.env.NUM_RUNS ?? 20_000) }
  );
});
