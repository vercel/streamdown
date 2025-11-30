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
});
