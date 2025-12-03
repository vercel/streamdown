import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("basic input handling", () => {
  it("should return non-string inputs unchanged", () => {
    expect(parseIncompleteMarkdown(null as any)).toBe(null);
    expect(parseIncompleteMarkdown(undefined as any)).toBe(undefined);
    expect(parseIncompleteMarkdown(123 as any)).toBe(123);
  });

  it("should return empty string unchanged", () => {
    expect(parseIncompleteMarkdown("")).toBe("");
  });

  it("should return regular text unchanged", () => {
    const text = "This is plain text without any markdown";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });
});
