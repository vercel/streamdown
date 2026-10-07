import { describe, expect, it } from "vitest";
import remend from "../src";

describe("escaped markers", () => {
  it.each<{ name: string; input: string; expected: string }>([
    {
      name: "closes bold whose content holds an escaped **",
      input: "**a\\**b",
      expected: "**a\\**b**",
    },
    {
      name: "skips an escaped ~~",
      input: "\\~~strike",
      expected: "\\~~strike",
    },
    {
      name: "closes ** after an escaped backslash",
      input: "\\\\**bold",
      expected: "\\\\**bold**",
    },
    {
      name: "closes ~~ after an escaped backslash",
      input: "\\\\~~strike",
      expected: "\\\\~~strike~~",
    },
    {
      name: "closes * after an escaped backslash",
      input: "\\\\*foo",
      expected: "\\\\*foo*",
    },
    {
      name: "closes _ after an escaped backslash",
      input: "\\\\_foo",
      expected: "\\\\_foo_",
    },
    {
      name: "opens a code span after an escaped backslash",
      input: "\\\\``a",
      expected: "\\\\``a``",
    },
  ])("$name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
  });
});

describe("math", () => {
  // Inside math a backslash is TeX, so it does not escape the closing $$
  it.each<{ name: string; input: string }>([
    { name: "a backslash before $$", input: "$$a\\$$" },
    { name: "a lone backslash", input: "$$\\$$" },
    { name: "inline block math", input: "text $$\\frac\\$$ more" },
  ])("leaves complete math with $name unchanged", ({ input }) => {
    expect(remend(input)).toBe(input);
  });
});

describe("trailing backslash", () => {
  // A closer appended after a trailing backslash would be escaped by it, so
  // the backslash is escaped first
  it.each<{ name: string; input: string; expected: string }>([
    { name: "**", input: "**foo\\", expected: "**foo\\\\**" },
    { name: "*", input: "*foo\\", expected: "*foo\\\\*" },
    { name: "_", input: "_foo\\", expected: "_foo\\\\_" },
    { name: "__", input: "__foo\\", expected: "__foo\\\\__" },
    { name: "~~", input: "~~foo\\", expected: "~~foo\\\\~~" },
    { name: "a partial __ match", input: "____.\\", expected: "____.\\\\__" },
    {
      name: "a backslash after whitespace",
      input: "**foo \\",
      expected: "**foo \\\\**",
    },
    {
      name: "nothing to heal",
      input: "plain text\\",
      expected: "plain text\\",
    },
    {
      name: "an opener whose only content is the backslash",
      input: "______\n__\\",
      expected: "______\n__\\\\__",
    },
    {
      name: "an escaped trailing backslash",
      input: "**foo\\\\",
      expected: "**foo\\\\**",
    },
    { name: "inline code", input: "`foo\\", expected: "`foo\\`" },
  ])("$name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
  });
});
