import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("bold-italic formatting (***)", () => {
  it("should complete incomplete bold-italic formatting", () => {
    expect(parseIncompleteMarkdown("Text with ***bold-italic")).toBe(
      "Text with ***bold-italic***"
    );
    expect(parseIncompleteMarkdown("***incomplete")).toBe("***incomplete***");
  });

  it("should keep complete bold-italic formatting unchanged", () => {
    const text = "Text with ***bold and italic text***";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple bold-italic sections", () => {
    const text = "***first*** and ***second***";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should complete odd number of triple asterisk markers", () => {
    expect(parseIncompleteMarkdown("***first*** and ***second")).toBe(
      "***first*** and ***second***"
    );
  });

  it("should not confuse triple asterisks with single or double", () => {
    expect(parseIncompleteMarkdown("*italic* **bold** ***both")).toBe(
      "*italic* **bold** ***both***"
    );
  });

  it("should handle triple asterisks at start of text", () => {
    expect(parseIncompleteMarkdown("***Starting bold-italic")).toBe(
      "***Starting bold-italic***"
    );
  });

  it("should handle nested formatting with triple asterisks", () => {
    expect(parseIncompleteMarkdown("***bold-italic with `code")).toBe(
      "***bold-italic with `code***`"
    );
  });

  it("should handle bold-italic chunks", () => {
    const chunks = [
      "This is",
      "This is ***very",
      "This is ***very important",
      "This is ***very important***",
      "This is ***very important*** to know",
    ];

    expect(parseIncompleteMarkdown(chunks[0])).toBe("This is");
    expect(parseIncompleteMarkdown(chunks[1])).toBe("This is ***very***");
    expect(parseIncompleteMarkdown(chunks[2])).toBe(
      "This is ***very important***"
    );
    expect(parseIncompleteMarkdown(chunks[3])).toBe(chunks[3]);
    expect(parseIncompleteMarkdown(chunks[4])).toBe(chunks[4]);
  });

  it("should handle text ending with multiple consecutive asterisks", () => {
    // Test the case where text ends with trailing asterisks (>= 3)
    expect(parseIncompleteMarkdown("text ***")).toBe("text ***");
    expect(parseIncompleteMarkdown("text ****")).toBe("text ****");
    expect(parseIncompleteMarkdown("text *****")).toBe("text *****");
    expect(parseIncompleteMarkdown("text ******")).toBe("text ******");

    // Test text that ends without any space (lines 136-138 in emphasis-handlers.ts)
    expect(parseIncompleteMarkdown("text***")).toBe("text***");
    expect(parseIncompleteMarkdown("word****")).toBe("word****");
    expect(parseIncompleteMarkdown("end******")).toBe("end******");

    // Test cases where countTripleAsterisks is called with trailing asterisks
    expect(parseIncompleteMarkdown("***start***end***")).toBe(
      "***start***end***"
    );
    // 6 asterisks at end = 2 sets of ***, total 3 sets (odd), but this might not close
    // Let me test with different patterns
    expect(parseIncompleteMarkdown("***text***")).toBe("***text***");
    expect(parseIncompleteMarkdown("***incomplete")).toBe("***incomplete***");

    // Test lines 137-138: text that ends with >= 3 asterisks (but not 4+ consecutive)
    expect(parseIncompleteMarkdown("***word text***")).toBe("***word text***");
  });
});
