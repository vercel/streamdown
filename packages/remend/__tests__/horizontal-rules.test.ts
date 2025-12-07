import { describe, expect, it } from "vitest";
import remend from "../src";

describe("horizontal rule handling", () => {
  it("should preserve complete horizontal rules with hyphens", () => {
    expect(remend("---")).toBe("---");
    expect(remend("----")).toBe("----");
    expect(remend("-----")).toBe("-----");
  });

  it("should preserve complete horizontal rules with asterisks", () => {
    expect(remend("***")).toBe("***");
    expect(remend("****")).toBe("****");
    expect(remend("*****")).toBe("*****");
  });

  it("should preserve complete horizontal rules with underscores", () => {
    expect(remend("___")).toBe("___");
    expect(remend("____")).toBe("____");
    expect(remend("_____")).toBe("_____");
  });

  it("should preserve horizontal rules with spaces", () => {
    expect(remend("- - -")).toBe("- - -");
    expect(remend("* * *")).toBe("* * *");
    expect(remend("_ _ _")).toBe("_ _ _");
  });

  it("should preserve horizontal rules with mixed spacing", () => {
    expect(remend("-  -  -")).toBe("-  -  -");
    expect(remend("*   *   *")).toBe("*   *   *");
    expect(remend("_    _    _")).toBe("_    _    _");
  });

  it("should not confuse horizontal rules with emphasis", () => {
    // *** on its own line should be recognized as a horizontal rule
    expect(remend("Text before\n***\nText after")).toBe(
      "Text before\n***\nText after"
    );

    // Three underscores on own line = horizontal rule, not italic
    expect(remend("Text before\n___\nText after")).toBe(
      "Text before\n___\nText after"
    );
  });

  it("should handle horizontal rules at the end of text", () => {
    expect(remend("Some text\n\n---")).toBe("Some text\n\n---");
    expect(remend("Some text\n\n***")).toBe("Some text\n\n***");
    expect(remend("Some text\n\n___")).toBe("Some text\n\n___");
  });

  it("should handle horizontal rules at the start of text", () => {
    expect(remend("---\n\nSome text")).toBe("---\n\nSome text");
    // *** on its own line should be recognized as a horizontal rule
    expect(remend("***\n\nSome text")).toBe("***\n\nSome text");
    // ___ on its own line should be recognized as a horizontal rule
    expect(remend("___\n\nSome text")).toBe("___\n\nSome text");
  });

  it("should handle multiple horizontal rules", () => {
    expect(remend("Section 1\n\n---\n\nSection 2\n\n---\n\nSection 3")).toBe(
      "Section 1\n\n---\n\nSection 2\n\n---\n\nSection 3"
    );
  });

  it("should not confuse two asterisks with horizontal rule start", () => {
    // ** is bold, not a horizontal rule
    expect(remend("Text with **bold")).toBe("Text with **bold**");
  });

  it("should not confuse two hyphens with horizontal rule", () => {
    // -- is not a valid horizontal rule (needs 3+)
    expect(remend("Text with --")).toBe("Text with --");
  });

  it("should handle horizontal rules after lists", () => {
    const text = "- Item 1\n- Item 2\n\n---\n\nNew section";
    expect(remend(text)).toBe(text);
  });

  it("should handle horizontal rules before headings", () => {
    const text = "---\n\n# Heading";
    expect(remend(text)).toBe(text);
  });

  it("should handle partial horizontal rules during streaming", () => {
    // Two characters - not yet a valid horizontal rule
    expect(remend("--")).toBe("--");
    expect(remend("**")).toBe("**");
    expect(remend("__")).toBe("__");

    // With context showing it's meant to be a rule
    expect(remend("Text\n\n--")).toBe("Text\n\n--");
  });

  it("should not add closing markers to standalone asterisk sequences that could be rules", () => {
    // 4+ asterisks should not be completed as bold-italic
    expect(remend("****")).toBe("****");
    expect(remend("*****")).toBe("*****");
  });

  it("should handle horizontal rules with leading whitespace", () => {
    // Up to 3 spaces before a horizontal rule is valid
    expect(remend("   ---")).toBe("   ---");
    expect(remend("  ***")).toBe("  ***");
    expect(remend(" ___")).toBe(" ___");
  });

  it("should handle horizontal rule-like patterns in text", () => {
    // Horizontal rules need to be on their own line
    // When --- appears inline, it's treated as text, not a horizontal rule
    expect(remend("This is not a --- horizontal rule")).toBe(
      "This is not a --- horizontal rule"
    );
  });

  it("should not complete emphasis when asterisks form potential horizontal rule", () => {
    // Text ending with newline then *** should not add closing ***
    expect(remend("Text\n***")).toBe("Text\n***");
  });

  it("should handle horizontal rules in complex markdown", () => {
    const text = `# Title

Some content with **bold** text.

---

## Section 2

More content.`;
    expect(remend(text)).toBe(text);
  });
});
