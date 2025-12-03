import { describe, expect, it } from "vitest";
import remend from "../src";

describe("basic input handling", () => {
  it("should return non-string inputs unchanged", () => {
    expect(remend(null as any)).toBe(null);
    expect(remend(undefined as any)).toBe(undefined);
    expect(remend(123 as any)).toBe(123);
  });

  it("should return empty string unchanged", () => {
    expect(remend("")).toBe("");
  });

  it("should return regular text unchanged", () => {
    const text = "This is plain text without any markdown";
    expect(remend(text)).toBe(text);
  });
});
