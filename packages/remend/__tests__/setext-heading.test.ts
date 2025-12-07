import { describe, expect, it } from "vitest";
import remend from "../src";

describe("setext heading handling", () => {
  it("should prevent partial list items from being interpreted as setext headings", () => {
    // The exact issue reported - single dash after text
    const text = "here is a list\n-";
    const result = remend(text);
    // Should add a zero-width space to break the setext heading pattern
    expect(result).toBe("here is a list\n-\u200B");
  });

  it("should handle double dash that could be setext heading", () => {
    const text = "Some text\n--";
    const result = remend(text);
    expect(result).toBe("Some text\n--\u200B");
  });

  it("should handle single equals that could be setext heading", () => {
    const text = "Some text\n=";
    const result = remend(text);
    expect(result).toBe("Some text\n=\u200B");
  });

  it("should handle double equals that could be setext heading", () => {
    const text = "Some text\n==";
    const result = remend(text);
    expect(result).toBe("Some text\n==\u200B");
  });

  it("should NOT modify valid horizontal rules with three dashes", () => {
    const text = "Some text\n---";
    const result = remend(text);
    // Three dashes is a valid horizontal rule, don't modify
    expect(result).toBe("Some text\n---");
  });

  it("should NOT modify valid setext headings with three equals", () => {
    const text = "Heading\n===";
    const result = remend(text);
    // Three equals is a valid setext heading, don't modify
    expect(result).toBe("Heading\n===");
  });

  it("should NOT modify when there's no previous content", () => {
    // No previous line means it can't be a setext heading
    const text = "-";
    const result = remend(text);
    expect(result).toBe("-");
  });

  it("should NOT modify when previous line is empty", () => {
    const text = "\n-";
    const result = remend(text);
    expect(result).toBe("\n-");
  });

  it("should handle the streaming list scenario", () => {
    // Simulate streaming where list items come in one by one
    const scenarios = [
      { input: "here is a list\n-", expected: "here is a list\n-\u200B" },
      { input: "here is a list\n- ", expected: "here is a list\n- " },
      {
        input: "here is a list\n- list item 1",
        expected: "here is a list\n- list item 1",
      },
    ];

    for (const { input, expected } of scenarios) {
      expect(remend(input)).toBe(expected);
    }
  });

  it("should handle multiple lines with potential setext heading at end", () => {
    const text = "Line 1\nLine 2\nLine 3\n-";
    const result = remend(text);
    expect(result).toBe("Line 1\nLine 2\nLine 3\n-\u200B");
  });

  it("should handle text with whitespace before dash", () => {
    const text = "Some text\n  -";
    const result = remend(text);
    // Even with leading whitespace, it could be interpreted as setext heading
    expect(result).toBe("Some text\n  -\u200B");
  });

  it("should NOT modify complete list items", () => {
    const text = "Some text\n- Item 1\n- Item 2";
    const result = remend(text);
    expect(result).toBe(text);
  });

  it("should NOT modify when last line has other characters", () => {
    const text = "Some text\n-x";
    const result = remend(text);
    // Not a setext heading pattern
    expect(result).toBe(text);
  });

  it("should handle four or more dashes (horizontal rule)", () => {
    const text = "Some text\n----";
    const result = remend(text);
    // Four dashes is a horizontal rule, don't modify
    expect(result).toBe(text);
  });

  it("should handle mixed whitespace and dashes", () => {
    const text = "Some text\n- ";
    const result = remend(text);
    // Already has a space, should not be modified
    expect(result).toBe(text);
  });

  it("should handle the original issue example precisely", () => {
    // Original issue: "here is a list\n-" gets interpreted as heading
    const streaming1 = remend("here is a list");
    expect(streaming1).toBe("here is a list");

    const streaming2 = remend("here is a list\n");
    expect(streaming2).toBe("here is a list\n");

    const streaming3 = remend("here is a list\n-");
    // This should add a zero-width space to prevent setext heading
    expect(streaming3).toBe("here is a list\n-\u200B");

    const streaming4 = remend("here is a list\n- list item 1");
    expect(streaming4).toBe("here is a list\n- list item 1");
  });

  it("should handle setext heading with equals signs during streaming", () => {
    const streaming1 = remend("This is a title\n=");
    expect(streaming1).toBe("This is a title\n=\u200B");

    const streaming2 = remend("This is a title\n==");
    expect(streaming2).toBe("This is a title\n==\u200B");

    const streaming3 = remend("This is a title\n===");
    // Three equals is valid setext heading (H1), don't modify
    expect(streaming3).toBe("This is a title\n===");
  });

  it("should not interfere with other markdown syntax", () => {
    // Make sure we don't break other markdown features
    const text1 = "**bold text**\n-";
    expect(remend(text1)).toBe("**bold text**\n-\u200B");

    const text2 = "*italic text*\n-";
    expect(remend(text2)).toBe("*italic text*\n-\u200B");

    const text3 = "`code`\n-";
    expect(remend(text3)).toBe("`code`\n-\u200B");
  });

  it("should handle multiple potential setext headings in sequence", () => {
    // Only the last line matters for setext heading detection
    const text = "Text 1\n-\nText 2\n-";
    const result = remend(text);
    // Only the final "-" should be modified
    expect(result).toBe("Text 1\n-\nText 2\n-\u200B");
  });
});
