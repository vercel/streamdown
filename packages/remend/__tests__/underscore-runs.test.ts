import { describe, expect, it } from "vitest";
import remend from "../src";

// Double underscores are counted per maximal run with flanking rules, so
// identifiers containing __ (snake__case style) neither invent nor swallow
// emphasis delimiters.
describe("word-internal double underscores", () => {
  it("should not treat an identifier's __ as a delimiter", () => {
    expect(remend("fields user__id and org__id are join keys")).toBe(
      "fields user__id and org__id are join keys"
    );
  });

  it("should still close an opener when an identifier follows", () => {
    // Counting raw __ occurrences would pair the identifier's run against
    // the opener and swallow the closer that is still needed
    expect(remend("Use snake__case and __bold")).toBe(
      "Use snake__case and __bold__"
    );
  });

  it("should not invent a closer for a lone identifier", () => {
    expect(remend("the value of some__field is set")).toBe(
      "the value of some__field is set"
    );
  });

  it("should ignore identifiers inside complete inline code", () => {
    expect(remend("`obj__attr` and __bold")).toBe("`obj__attr` and __bold__");
  });

  it("should ignore identifiers inside bold content", () => {
    expect(remend("**bold snake__case text** and more")).toBe(
      "**bold snake__case text** and more"
    );
  });
});

describe("underscore run lengths", () => {
  it("should treat a run of four as balanced", () => {
    expect(remend("a ____ b")).toBe("a ____ b");
  });

  it("should not complete a thematic break line", () => {
    expect(remend("text\n\n___\n")).toBe("text\n\n___\n");
  });

  it("should keep ___text___ balanced", () => {
    expect(remend("___both___ done")).toBe("___both___ done");
  });
});

describe("escaped underscores", () => {
  it("should treat the run after an escaped underscore as a delimiter", () => {
    expect(remend("\\___bold")).toBe("\\___bold__");
  });

  it("should not treat a run after an escaped backslash as escaped", () => {
    expect(remend("\\\\__bold")).toBe("\\\\__bold__");
  });
});

describe("underscore delimiter matching", () => {
  it.each<[string, string]>([
    ["a run followed by whitespace", "__ foo"],
    ["a spaced run before an escaped run", "a __ b \\__c"],
    ["a spaced run before an escaped run at the start", "__ \\__alph"],
    ["a run after a letter and before punctuation", "a__."],
    ["a closer-only run with nothing open", "__ a__ a"],
    ["a longer run that closes the opener", "__a____.a"],
    ["an opener the rule of 3 keeps a __ closer from matching", "\\_____\\a"],
    ["a leftover single underscore after an escape", "__\\__ a"],
  ])("should not append a closer for %s", (_name, input) => {
    expect(remend(input)).toBe(input);
  });

  it("should still close an opener after a spaced run", () => {
    expect(remend("a __ b __bold")).toBe("a __ b __bold__");
  });

  it.each<{ name: string; input: string; expected: string }>([
    {
      name: "an outer run after an escape",
      input: "\\__._a",
      expected: "\\__._a__",
    },
    { name: "a run across an asterisk", input: "_a *_a", expected: "_a *_a*_" },
    {
      name: "a run after an open code span",
      input: "__`x",
      expected: "__`x`__",
    },
    {
      name: "a run after an open code span ending in a backslash",
      input: "__`x\\",
      expected: "__`x\\`__",
    },
  ])("should close $name in one pass", ({ input, expected }) => {
    const healed = remend(input);
    expect(healed).toBe(expected);
    expect(remend(healed)).toBe(healed);
  });
});
