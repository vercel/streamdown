import { describe, expect, it } from "vitest";
import remend from "../src";

describe("pending inline markers", () => {
  it.each([
    "*",
    "**",
    "_",
    "__",
    "~~",
  ])("holds %s only when opted in", (marker) => {
    const text = `my name is ${marker}`;
    expect(remend(text)).toBe(text);
    expect(remend(text, { pendingInlineMarkers: true })).toBe("my name is");
    expect(remend(text, { pendingInlineMarkers: false })).toBe(text);
  });

  it("completes bold when the first content token arrives", () => {
    expect(remend("my name is **A", { pendingInlineMarkers: true })).toBe(
      "my name is **A**"
    );
    expect(remend("my name is **Ada**", { pendingInlineMarkers: true })).toBe(
      "my name is **Ada**"
    );
  });

  it.each([
    "**Ada**",
    "text **\n",
    "snake_",
    "2*",
    "***",
    "\\**",
    "`literal **",
    "```\n**",
    "~~~\n**",
    "    **",
    "$$ x **",
    "[link](https://example.com/ **",
  ])("preserves non-pending syntax in %j", (text) => {
    expect(remend(text, { pendingInlineMarkers: true })).toBe(remend(text));
  });

  it.each([
    "- ",
    "- item\n - ",
    "+ ",
    "* ",
    "1. ",
    "2) ",
  ])("retains whitespace that makes %j a list marker", (text) => {
    expect(remend(text)).toBe(text.includes("\n") ? `${text}\u200B` : text);
  });
});
