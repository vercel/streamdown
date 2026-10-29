import { describe, expect, it } from "vitest";
import remend from "../src/index";

function literalRanges(text: string) {
  const start = text.indexOf("<literal>");
  const close = text.indexOf("</literal>", start);
  return start < 0
    ? []
    : [{ start, end: close < 0 ? text.length : close + "</literal>".length }];
}
describe("parser-owned opaque ranges", () => {
  it.each([
    "20~25",
    "[unclosed](https://example.com",
    "**raw",
    "`raw",
    "$$math",
    "\n- > 25",
    "\n```\ncode",
    "trailing ",
  ])("never heals literal source %j", (body) => {
    const source = `<literal>${body}</literal>`;
    expect(remend(source, { literalRanges })).toBe(source);
  });
  it("preserves full surrounding Markdown context", () => {
    const source = "**Before <literal>**raw</literal> after**";
    expect(remend(source, { literalRanges })).toBe(source);
    expect(
      remend("**Before <literal>**raw</literal> after", { literalRanges })
    ).toBe("**Before <literal>**raw</literal> after**");
  });
  it("ignores literal brackets while healing a crossing link", () => {
    const source = "[Before <literal>][fake](raw</literal> after";
    expect(remend(source, { literalRanges })).toBe(
      source + "](streamdown:incomplete-link)"
    );
  });
  it("recomputes offsets when earlier repairs insert characters", () => {
    expect(
      remend("20~25 <literal>20~25 **raw</literal>", { literalRanges })
    ).toBe("20\\~25 <literal>20~25 **raw</literal>");
  });
  it("does not trim whitespace owned by an unfinished literal", () => {
    expect(remend("<literal>raw ", { literalRanges })).toBe("<literal>raw ");
  });
  it("restores scoped ranges after nested calls", () => {
    const result = remend("<literal>20~25</literal>", {
      literalRanges,
      handlers: [
        {
          name: "nested",
          handle: (text) => {
            expect(remend("20~25")).toBe("20\\~25");
            return text;
          },
        },
      ],
    });
    expect(result).toBe("<literal>20~25</literal>");
    expect(remend("20~25")).toBe("20\\~25");
  });
  it("clears scoped ranges after a handler throws", () => {
    expect(() =>
      remend("<literal>raw</literal>", {
        literalRanges,
        handlers: [
          {
            name: "throw",
            handle: () => {
              throw new Error("test");
            },
          },
        ],
      })
    ).toThrow("test");
    expect(remend("20~25")).toBe("20\\~25");
  });
});
