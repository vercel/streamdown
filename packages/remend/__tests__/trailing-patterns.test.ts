import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  boldItalicPattern,
  boldPattern,
  halfCompleteTildePattern,
  halfCompleteUnderscorePattern,
  italicPattern,
  matchTrailing,
  singleAsteriskPattern,
  singleUnderscorePattern,
  strikethroughPattern,
  type TrailingPattern,
} from "../src/patterns";

const patterns: Record<string, TrailingPattern> = {
  boldItalicPattern,
  boldPattern,
  halfCompleteTildePattern,
  halfCompleteUnderscorePattern,
  italicPattern,
  singleAsteriskPattern,
  singleUnderscorePattern,
  strikethroughPattern,
};

const markdownish = fc
  .array(fc.constantFrom("*", "_", "~", "a", " ", "\n", "\\", "`"), {
    maxLength: 40,
  })
  .map((chars) => chars.join(""));

const groups = (match: RegExpMatchArray | null) =>
  match ? [match[0], match[1], match[2]] : null;

describe("matchTrailing", () => {
  it.each(
    Object.entries(patterns)
  )("%s matches the tail as the full text does", (_, pattern) => {
    fc.assert(
      fc.property(markdownish, (text) => {
        expect(groups(matchTrailing(text, pattern))).toEqual(
          groups(text.match(pattern.regex))
        );
      }),
      { numRuns: 5000 }
    );
  });

  it.each<{ name: string; text: string; expected: string[] | null }>([
    {
      name: "bold with a half closer",
      text: "a **b*",
      expected: ["**b*", "**", "b*"],
    },
    {
      name: "the closing marker of a finished run",
      text: "**a** b",
      expected: ["** b", "**", " b"],
    },
    { name: "no marker", text: "a b", expected: null },
    { name: "marker at the end", text: "a **", expected: ["**", "**", ""] },
    { name: "empty", text: "", expected: null },
  ])("$name", ({ text, expected }) => {
    expect(groups(matchTrailing(text, boldPattern))).toEqual(expected);
  });
});
