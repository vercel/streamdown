import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("list handling", () => {
  it("should not add asterisk to lists using asterisk markers", () => {
    const text = "* Item 1\n* Item 2\n* Item 3";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not add asterisk to single list item", () => {
    const text = "* Single item";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not add asterisk to nested lists", () => {
    const text = "* Parent item\n  * Nested item 1\n  * Nested item 2";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle lists with italic text correctly", () => {
    const text = "* Item with *italic* text\n* Another item";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should complete incomplete italic even in list items", () => {
    // List markers are not counted, but incomplete italic formatting is still completed
    const text = "* Item with *incomplete italic\n* Another item";
    // The function adds an asterisk to complete the italic, though at the end of text
    // This is not ideal but matches current behavior
    expect(parseIncompleteMarkdown(text)).toBe(
      "* Item with *incomplete italic\n* Another item*"
    );
  });

  it("should handle mixed list markers and italic formatting", () => {
    const text = "* First item\n* Second *italic* item\n* Third item";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle lists with tabs for indentation", () => {
    const text = "*\tItem with tab\n*\tAnother item";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not interfere with dash lists", () => {
    const text = "- Item 1\n- Item 2 with *italic*\n- Item 3";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle the Gemini response example from issue", () => {
    const geminiResponse = "* user123\n* user456\n* user789";
    expect(parseIncompleteMarkdown(geminiResponse)).toBe(geminiResponse);
  });

  it("should handle lists with incomplete formatting", () => {
    expect(parseIncompleteMarkdown("- Item 1\n- Item 2 with **bol")).toBe(
      "- Item 1\n- Item 2 with **bol**"
    );
  });

  it("should handle lists with emphasis character blocks (#97)", () => {
    // Lists with just emphasis markers should not be auto-completed
    expect(parseIncompleteMarkdown("- __")).toBe("- __");
    expect(parseIncompleteMarkdown("- **")).toBe("- **");
    expect(parseIncompleteMarkdown("- __\n- **")).toBe("- __\n- **");
    expect(parseIncompleteMarkdown("\n- __\n- **")).toBe("\n- __\n- **");

    // Multiple list items with emphasis markers
    expect(parseIncompleteMarkdown("* __\n* **")).toBe("* __\n* **");
    expect(parseIncompleteMarkdown("+ __\n+ **")).toBe("+ __\n+ **");

    // List items with emphasis markers and text should still complete
    expect(parseIncompleteMarkdown("- __ text after")).toBe(
      "- __ text after__"
    );
    expect(parseIncompleteMarkdown("- ** text after")).toBe(
      "- ** text after**"
    );

    // Mixed list items
    expect(parseIncompleteMarkdown("- __\n- Normal item\n- **")).toBe(
      "- __\n- Normal item\n- **"
    );

    // Lists with other emphasis markers
    expect(parseIncompleteMarkdown("- ***")).toBe("- ***");
    expect(parseIncompleteMarkdown("- *")).toBe("- *");
    expect(parseIncompleteMarkdown("- _")).toBe("- _");
    expect(parseIncompleteMarkdown("- ~~")).toBe("- ~~");
    expect(parseIncompleteMarkdown("- `")).toBe("- `");
  });

  it("should not complete list items with emphasis markers spanning multiple lines", () => {
    // When a list item starts with ** followed by content with newline, don't complete
    expect(parseIncompleteMarkdown("- **text\nmore text")).toBe(
      "- **text\nmore text"
    );
    expect(parseIncompleteMarkdown("* **content\n* Another item")).toBe(
      "* **content\n* Another item"
    );
  });
});
