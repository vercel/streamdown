import { describe, expect, it } from "vitest";
import remend from "../src";

describe("bold-italic formatting (***)", () => {
  it("should complete incomplete bold-italic formatting", () => {
    expect(remend("Text with ***bold-italic")).toBe(
      "Text with ***bold-italic***"
    );
    expect(remend("***incomplete")).toBe("***incomplete***");
  });

  it("should keep complete bold-italic formatting unchanged", () => {
    const text = "Text with ***bold and italic text***";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple bold-italic sections", () => {
    const text = "***first*** and ***second***";
    expect(remend(text)).toBe(text);
  });

  it("should complete odd number of triple asterisk markers", () => {
    expect(remend("***first*** and ***second")).toBe(
      "***first*** and ***second***"
    );
  });

  it("should not confuse triple asterisks with single or double", () => {
    expect(remend("*italic* **bold** ***both")).toBe(
      "*italic* **bold** ***both***"
    );
  });

  it("should handle triple asterisks at start of text", () => {
    expect(remend("***Starting bold-italic")).toBe(
      "***Starting bold-italic***"
    );
  });

  it("should handle nested formatting with triple asterisks", () => {
    expect(remend("***bold-italic with `code")).toBe(
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

    expect(remend(chunks[0])).toBe("This is");
    expect(remend(chunks[1])).toBe("This is ***very***");
    expect(remend(chunks[2])).toBe("This is ***very important***");
    expect(remend(chunks[3])).toBe(chunks[3]);
    expect(remend(chunks[4])).toBe(chunks[4]);
  });

  it("should handle text ending with multiple consecutive asterisks", () => {
    // Test the case where text ends with trailing asterisks (>= 3)
    expect(remend("text ***")).toBe("text ***");
    expect(remend("text ****")).toBe("text ****");
    expect(remend("text *****")).toBe("text *****");
    expect(remend("text ******")).toBe("text ******");

    // Test text that ends without any space (lines 136-138 in emphasis-handlers.ts)
    expect(remend("text***")).toBe("text***");
    expect(remend("word****")).toBe("word****");
    expect(remend("end******")).toBe("end******");

    // Test cases where countTripleAsterisks is called with trailing asterisks
    expect(remend("***start***end***")).toBe("***start***end***");
    // 6 asterisks at end = 2 sets of ***, total 3 sets (odd), but this might not close
    // Let me test with different patterns
    expect(remend("***text***")).toBe("***text***");
    expect(remend("***incomplete")).toBe("***incomplete***");

    // Test lines 137-138: text that ends with >= 3 asterisks (but not 4+ consecutive)
    expect(remend("***word text***")).toBe("***word text***");
  });
});
