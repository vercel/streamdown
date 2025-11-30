import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("italic formatting with underscores (__)", () => {
  it("should complete incomplete italic formatting with double underscores", () => {
    expect(parseIncompleteMarkdown("Text with __italic")).toBe(
      "Text with __italic__"
    );
    expect(parseIncompleteMarkdown("__incomplete")).toBe("__incomplete__");
  });

  it("should keep complete italic formatting unchanged", () => {
    const text = "Text with __italic text__";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle odd number of double underscore pairs", () => {
    expect(parseIncompleteMarkdown("__first__ and __second")).toBe(
      "__first__ and __second__"
    );
  });
});

describe("italic formatting with asterisks (*)", () => {
  it("should complete incomplete italic formatting with single asterisks", () => {
    expect(parseIncompleteMarkdown("Text with *italic")).toBe(
      "Text with *italic*"
    );
    expect(parseIncompleteMarkdown("*incomplete")).toBe("*incomplete*");
  });

  it("should keep complete italic formatting unchanged", () => {
    const text = "Text with *italic text*";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not confuse single asterisks with bold markers", () => {
    expect(parseIncompleteMarkdown("**bold** and *italic")).toBe(
      "**bold** and *italic*"
    );
  });

  it("should not treat asterisks in the middle of words as italic markers - #189", () => {
    expect(parseIncompleteMarkdown("234234*123")).toBe("234234*123");
    expect(parseIncompleteMarkdown("hello*world")).toBe("hello*world");
    expect(parseIncompleteMarkdown("test*123*test")).toBe("test*123*test");

    // Test with mix of word-internal and formatting asterisks (lines 39-41)
    expect(parseIncompleteMarkdown("*italic with some*var*name inside")).toBe(
      "*italic with some*var*name inside*"
    );
    expect(parseIncompleteMarkdown("test*var and *incomplete italic")).toBe(
      "test*var and *incomplete italic*"
    );
  });

  it("should handle escaped asterisks correctly in countSingleAsterisks", () => {
    // Test lines 29-31: escaped asterisks should be skipped
    expect(parseIncompleteMarkdown("\\*escaped asterisk and *italic")).toBe(
      "\\*escaped asterisk and *italic*"
    );
    expect(parseIncompleteMarkdown("*start \\* middle \\* end")).toBe(
      "*start \\* middle \\* end*"
    );
  });

  it("should handle asterisks between letters and numbers", () => {
    expect(parseIncompleteMarkdown("abc*123")).toBe("abc*123");
    expect(parseIncompleteMarkdown("123*abc")).toBe("123*abc");
  });

  it("should still complete italic formatting with asterisks when not word-internal", () => {
    expect(parseIncompleteMarkdown("This is *italic")).toBe(
      "This is *italic*"
    );
    expect(parseIncompleteMarkdown("*word* and more text")).toBe(
      "*word* and more text"
    );
  });
});

describe("italic formatting with single underscores (_)", () => {
  it("should complete incomplete italic formatting with single underscores", () => {
    expect(parseIncompleteMarkdown("Text with _italic")).toBe(
      "Text with _italic_"
    );
    expect(parseIncompleteMarkdown("_incomplete")).toBe("_incomplete_");
  });

  it("should keep complete italic formatting unchanged", () => {
    const text = "Text with _italic text_";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not confuse single underscores with double underscore markers", () => {
    expect(parseIncompleteMarkdown("__bold__ and _italic")).toBe(
      "__bold__ and _italic_"
    );
  });

  it("should handle escaped single underscores", () => {
    const text = "Text with \\_escaped underscore";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "some\\_text_with_underscores";
    expect(parseIncompleteMarkdown(text2)).toBe(
      "some\\_text_with_underscores"
    );
  });

  it("should handle mixed escaped and unescaped underscores correctly", () => {
    expect(parseIncompleteMarkdown("\\_escaped\\_ and _unescaped")).toBe(
      "\\_escaped\\_ and _unescaped_"
    );

    expect(
      parseIncompleteMarkdown("Start \\_escaped\\_ middle _incomplete")
    ).toBe("Start \\_escaped\\_ middle _incomplete_");

    expect(parseIncompleteMarkdown("\\_fully\\_escaped\\_")).toBe(
      "\\_fully\\_escaped\\_"
    );

    expect(parseIncompleteMarkdown("\\_escaped\\_ _complete_ pair")).toBe(
      "\\_escaped\\_ _complete_ pair"
    );
  });

  it("should handle underscores with unicode word characters", () => {
    expect(parseIncompleteMarkdown("café_price")).toBe("café_price");
    expect(parseIncompleteMarkdown("naïve_approach")).toBe("naïve_approach");
  });

  it("should not count word-internal single underscores in countSingleUnderscores", () => {
    // This tests the path where underscore is between word characters (lines 106-108)
    expect(parseIncompleteMarkdown("some_variable_name")).toBe(
      "some_variable_name"
    );
    expect(parseIncompleteMarkdown("test_123_value")).toBe("test_123_value");
    expect(parseIncompleteMarkdown("_start with underscore")).toBe(
      "_start with underscore_"
    );

    // Test with mix of word-internal and formatting underscores
    expect(parseIncompleteMarkdown("_italic with some_var_name inside")).toBe(
      "_italic with some_var_name inside_"
    );
    expect(parseIncompleteMarkdown("test_var and _incomplete italic")).toBe(
      "test_var and _incomplete italic_"
    );
  });

  it("should handle incomplete single underscore with trailing newlines", () => {
    expect(parseIncompleteMarkdown("Text with _italic\n")).toBe(
      "Text with _italic_\n"
    );
    expect(parseIncompleteMarkdown("_incomplete\n\n")).toBe("_incomplete_\n\n");
    expect(parseIncompleteMarkdown("Start _text\n")).toBe("Start _text_\n");
  });
});
