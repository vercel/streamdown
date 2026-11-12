import { describe, expect, it } from "vitest";
import remend from "../src";
import { holdPendingInlineMarkers } from "../src/pending-inline-markers";

describe("pending inline markers", () => {
  it.each([
    "~~~\ncode\n~~~\n\nmy name is **",
    "~~~~\n~~~\n~~~~\n\nmy name is **",
    "~~~\n`literal\n~~~\n\nmy name is **",
    "> ~~~\n> code\n> ~~~\n\nmy name is **",
    "- ~~~\n  code\n  ~~~\n\nmy name is **",
    "literal ~~~ text\n\nmy name is **",
    "> ~~~\n> code\n\nmy name is **",
    "- ~~~\n  code\n\nmy name is **",
  ])("holds markers in prose after fences in %j", (text) => {
    expect(holdPendingInlineMarkers(text)).toBe(text.slice(0, -2));
  });

  it.each([
    "~~~\n**",
    "~~~~\n~~~\n**",
    "~~~\n~~~ not a closing fence\n**",
    "> ~~~\n> **",
    "```\n~~~\n**",
  ])("preserves markers inside the active fence in %j", (text) => {
    expect(holdPendingInlineMarkers(text)).toBe(text);
  });

  it.each([
    "[link](https://example.com/ **",
    "![image](https://example.com/ **",
    "[link](https://example.com/a(b) **",
    "[link](https://example.com/a\\) **",
  ])("preserves unfinished destinations without link repair in %j", (text) => {
    expect(holdPendingInlineMarkers(text)).toBe(text);
    expect(
      remend(text, { pendingInlineMarkers: true, links: false, images: false })
    ).toBe(remend(text, { links: false, images: false }));
  });

  it.each([
    "[link](https://example.com/a(b)) text **",
    "[literal\\](text **",
    "[link](https://example.com/\n\ntext **",
  ])("holds prose outside unfinished destinations in %j", (text) => {
    expect(holdPendingInlineMarkers(text)).toBe(text.slice(0, -2));
  });

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
    expect(remend(remend(text))).toBe(remend(text));
  });
});
