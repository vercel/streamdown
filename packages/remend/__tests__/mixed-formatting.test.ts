import { describe, expect, it } from "vitest";
import remend from "../src";

describe("mixed formatting", () => {
  it("should handle multiple formatting types", () => {
    const text = "**bold** and *italic* and `code` and ~~strike~~";
    expect(remend(text)).toBe(text);
  });

  it("should complete multiple incomplete formats", () => {
    expect(remend("**bold and *italic")).toBe("**bold and *italic*");
  });

  it("should handle nested formatting", () => {
    const text = "**bold with *italic* inside**";
    expect(remend(text)).toBe(text);
  });

  it("should prioritize link/image preservation over formatting completion", () => {
    expect(remend("Text with [link and **bold")).toBe(
      "Text with [link and **bold](streamdown:incomplete-link)"
    );
  });

  it("should handle complex real-world markdown", () => {
    const text =
      "# Heading\n\n**Bold text** with *italic* and `code`.\n\n- List item\n- Another item with ~~strike~~";
    expect(remend(text)).toBe(text);
  });

  it("should handle bold inside italic", () => {
    expect(remend("*italic with **bold")).toBe("*italic with **bold***");
  });

  it("should handle code inside bold", () => {
    // Bold gets closed first, then code
    expect(remend("**bold with `code")).toBe("**bold with `code**`");
  });

  it("should handle strikethrough with other formatting", () => {
    // Both formats get closed
    expect(remend("~~strike with **bold")).toBe("~~strike with **bold**~~");
  });

  it("should handle dollar sign inside other formatting", () => {
    // Bold gets closed, dollar sign stays as-is (likely currency)
    expect(remend("**bold with $x^2")).toBe("**bold with $x^2**");
  });

  it("should handle deeply nested incomplete formatting", () => {
    // Formats are closed in the order they're processed
    expect(remend("**bold *italic `code ~~strike")).toBe(
      "**bold *italic `code ~~strike*`~~"
    );
  });

  it("should preserve complete nested formatting", () => {
    const text = "**bold *italic* text** and `code`";
    expect(remend(text)).toBe(text);
  });

  it("should handle mixed bold-italic formatting (#265)", () => {
    expect(remend("**bold and *bold-italic***")).toBe(
      "**bold and *bold-italic***"
    );
  });
});
