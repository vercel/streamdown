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
