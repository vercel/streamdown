import { describe, expect, it } from "vitest";
import remend from "../src";

describe("comparison operators in list items (#376)", () => {
  it("should escape > followed by a digit in dash list items", () => {
    expect(remend("- > 25: rich")).toBe("- \\> 25: rich");
  });

  it("should escape > followed by a digit in asterisk list items", () => {
    expect(remend("* > 25: rich")).toBe("* \\> 25: rich");
  });

  it("should escape > followed by a digit in plus list items", () => {
    expect(remend("+ > 25: rich")).toBe("+ \\> 25: rich");
  });

  it("should escape > in ordered list items", () => {
    expect(remend("1. > 25: rich")).toBe("1. \\> 25: rich");
    expect(remend("2) > 10: high")).toBe("2) \\> 10: high");
  });

  it("should escape > in indented (nested) list items", () => {
    expect(remend("  - > 25: rich")).toBe("  - \\> 25: rich");
    expect(remend("    - > 5: expensive")).toBe("    - \\> 5: expensive");
  });

  it("should escape >= comparison operators", () => {
    expect(remend("- >= 10: high")).toBe("- \\>= 10: high");
  });

  it("should escape > before dollar amounts", () => {
    expect(remend("- > $100: expensive")).toBe("- \\> $100: expensive");
  });

  it("should handle the issue example correctly", () => {
    const input = [
      "- < 10: potentially cheap.",
      "- 10–20: reasonable/normal zone.",
      "- > 25–30: rich; you need strong growth + quality to justify.",
    ].join("\n");

    const expected = [
      "- < 10: potentially cheap.",
      "- 10–20: reasonable/normal zone.",
      "- \\> 25–30: rich; you need strong growth + quality to justify.",
    ].join("\n");

    expect(remend(input)).toBe(expected);
  });

  it("should handle multiple comparison operators in a list", () => {
    const input = [
      "- > 5: expensive",
      "- > 25: very expensive",
    ].join("\n");

    const expected = [
      "- \\> 5: expensive",
      "- \\> 25: very expensive",
    ].join("\n");

    expect(remend(input)).toBe(expected);
  });

  it("should not escape > in actual blockquotes (no list marker)", () => {
    expect(remend("> Some blockquote")).toBe("> Some blockquote");
    expect(remend("> 25 is a number")).toBe("> 25 is a number");
  });

  it("should not escape > when followed by non-digit text", () => {
    expect(remend("- > Some quoted text")).toBe("- > Some quoted text");
    expect(remend("- > Read more about this")).toBe(
      "- > Read more about this"
    );
  });

  it("should not escape > without a space before digit (no list marker)", () => {
    expect(remend(">25")).toBe(">25");
  });

  it("should not escape > inside code blocks", () => {
    const input = "```\n- > 25: in code\n```";
    expect(remend(input)).toBe(input);
  });

  it("should handle > with no space before digit in list items", () => {
    expect(remend("- >25: rich")).toBe("- \\>25: rich");
  });

  it("should be disabled when comparisonOperators option is false", () => {
    expect(remend("- > 25: rich", { comparisonOperators: false })).toBe(
      "- > 25: rich"
    );
  });

  it("should work alongside other remend handlers", () => {
    const input = "- > 25: **bold";
    const result = remend(input);
    expect(result).toBe("- \\> 25: **bold**");
  });

  it("should handle the full issue example with nested lists", () => {
    const input = [
      "*P/E*",
      "  - < 10: potentially cheap.",
      "  - 10–20: reasonable/normal zone.",
      "  - > 25–30: rich; you need strong growth.",
      "",
      "*P/S*",
      "  - < 1: often cheap for mature businesses.",
      "  - 1–3: okay range.",
      "  - > 5: expensive unless high-margin.",
    ].join("\n");

    const expected = [
      "*P/E*",
      "  - < 10: potentially cheap.",
      "  - 10–20: reasonable/normal zone.",
      "  - \\> 25–30: rich; you need strong growth.",
      "",
      "*P/S*",
      "  - < 1: often cheap for mature businesses.",
      "  - 1–3: okay range.",
      "  - \\> 5: expensive unless high-margin.",
    ].join("\n");

    expect(remend(input)).toBe(expected);
  });
});
