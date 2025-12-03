import { describe, expect, it } from "vitest";
import {
  findMatchingClosingBracket,
  findMatchingOpeningBracket,
  isWordChar,
} from "../src/utils";

describe("isWordChar", () => {
  it("should return false for empty string", () => {
    expect(isWordChar("")).toBe(false);
  });

  it("should return true for ASCII word characters", () => {
    expect(isWordChar("a")).toBe(true);
    expect(isWordChar("Z")).toBe(true);
    expect(isWordChar("5")).toBe(true);
    expect(isWordChar("_")).toBe(true);
  });

  it("should return false for non-word characters", () => {
    expect(isWordChar(" ")).toBe(false);
    expect(isWordChar("*")).toBe(false);
    expect(isWordChar("-")).toBe(false);
  });

  it("should handle unicode word characters", () => {
    expect(isWordChar("é")).toBe(true);
    expect(isWordChar("ñ")).toBe(true);
  });
});

describe("findMatchingOpeningBracket", () => {
  it("should return -1 when no matching opening bracket exists", () => {
    const text = "some text]";
    expect(findMatchingOpeningBracket(text, 9)).toBe(-1);
  });

  it("should find matching opening bracket for simple case", () => {
    const text = "[text]";
    expect(findMatchingOpeningBracket(text, 5)).toBe(0);
  });

  it("should handle nested brackets", () => {
    const text = "[outer [inner] text]";
    expect(findMatchingOpeningBracket(text, 19)).toBe(0);
    expect(findMatchingOpeningBracket(text, 13)).toBe(7);
  });
});

describe("findMatchingClosingBracket", () => {
  it("should return -1 when no matching closing bracket exists", () => {
    const text = "[some text";
    expect(findMatchingClosingBracket(text, 0)).toBe(-1);
  });

  it("should find matching closing bracket for simple case", () => {
    const text = "[text]";
    expect(findMatchingClosingBracket(text, 0)).toBe(5);
  });

  it("should handle nested brackets", () => {
    const text = "[outer [inner] text]";
    expect(findMatchingClosingBracket(text, 0)).toBe(19);
    expect(findMatchingClosingBracket(text, 7)).toBe(13);
  });
});
