import { describe, expect, it } from "vitest";
import remend from "../src";

describe("italic formatting with underscores (__)", () => {
  it("should complete incomplete italic formatting with double underscores", () => {
    expect(remend("Text with __italic")).toBe("Text with __italic__");
    expect(remend("__incomplete")).toBe("__incomplete__");
  });

  it("should keep complete italic formatting unchanged", () => {
    const text = "Text with __italic text__";
    expect(remend(text)).toBe(text);
  });

  it("should handle odd number of double underscore pairs", () => {
    expect(remend("__first__ and __second")).toBe("__first__ and __second__");
  });
});

describe("italic formatting with asterisks (*)", () => {
  it("should complete incomplete italic formatting with single asterisks", () => {
    expect(remend("Text with *italic")).toBe("Text with *italic*");
    expect(remend("*incomplete")).toBe("*incomplete*");
  });

  it("should keep complete italic formatting unchanged", () => {
    const text = "Text with *italic text*";
    expect(remend(text)).toBe(text);
  });

  it("should not confuse single asterisks with bold markers", () => {
    expect(remend("**bold** and *italic")).toBe("**bold** and *italic*");
  });

  it("should not treat asterisks in the middle of words as italic markers - #189", () => {
    expect(remend("234234*123")).toBe("234234*123");
    expect(remend("hello*world")).toBe("hello*world");
    expect(remend("test*123*test")).toBe("test*123*test");

    // Test with mix of word-internal and formatting asterisks (lines 39-41)
    expect(remend("*italic with some*var*name inside")).toBe(
      "*italic with some*var*name inside*"
    );
    expect(remend("test*var and *incomplete italic")).toBe(
      "test*var and *incomplete italic*"
    );
  });

  it("should handle escaped asterisks correctly in countSingleAsterisks", () => {
    // Test lines 29-31: escaped asterisks should be skipped
    expect(remend("\\*escaped asterisk and *italic")).toBe(
      "\\*escaped asterisk and *italic*"
    );
    expect(remend("*start \\* middle \\* end")).toBe(
      "*start \\* middle \\* end*"
    );
  });

  it("should handle asterisks between letters and numbers", () => {
    expect(remend("abc*123")).toBe("abc*123");
    expect(remend("123*abc")).toBe("123*abc");
  });

  it("should still complete italic formatting with asterisks when not word-internal", () => {
    expect(remend("This is *italic")).toBe("This is *italic*");
    expect(remend("*word* and more text")).toBe("*word* and more text");
  });
});

describe("italic formatting with single underscores (_)", () => {
  it("should complete incomplete italic formatting with single underscores", () => {
    expect(remend("Text with _italic")).toBe("Text with _italic_");
    expect(remend("_incomplete")).toBe("_incomplete_");
  });

  it("should keep complete italic formatting unchanged", () => {
    const text = "Text with _italic text_";
    expect(remend(text)).toBe(text);
  });

  it("should not confuse single underscores with double underscore markers", () => {
    expect(remend("__bold__ and _italic")).toBe("__bold__ and _italic_");
  });

  it("should handle escaped single underscores", () => {
    const text = "Text with \\_escaped underscore";
    expect(remend(text)).toBe(text);

    const text2 = "some\\_text_with_underscores";
    expect(remend(text2)).toBe("some\\_text_with_underscores");
  });

  it("should handle mixed escaped and unescaped underscores correctly", () => {
    expect(remend("\\_escaped\\_ and _unescaped")).toBe(
      "\\_escaped\\_ and _unescaped_"
    );

    expect(remend("Start \\_escaped\\_ middle _incomplete")).toBe(
      "Start \\_escaped\\_ middle _incomplete_"
    );

    expect(remend("\\_fully\\_escaped\\_")).toBe("\\_fully\\_escaped\\_");

    expect(remend("\\_escaped\\_ _complete_ pair")).toBe(
      "\\_escaped\\_ _complete_ pair"
    );
  });

  it("should handle underscores with unicode word characters", () => {
    expect(remend("café_price")).toBe("café_price");
    expect(remend("naïve_approach")).toBe("naïve_approach");
  });

  it("should not count word-internal single underscores in countSingleUnderscores", () => {
    // This tests the path where underscore is between word characters (lines 106-108)
    expect(remend("some_variable_name")).toBe("some_variable_name");
    expect(remend("test_123_value")).toBe("test_123_value");
    expect(remend("_start with underscore")).toBe("_start with underscore_");

    // Test with mix of word-internal and formatting underscores
    expect(remend("_italic with some_var_name inside")).toBe(
      "_italic with some_var_name inside_"
    );
    expect(remend("test_var and _incomplete italic")).toBe(
      "test_var and _incomplete italic_"
    );
  });

  it("should handle incomplete single underscore with trailing newlines", () => {
    expect(remend("Text with _italic\n")).toBe("Text with _italic_\n");
    expect(remend("_incomplete\n\n")).toBe("_incomplete_\n\n");
    expect(remend("Start _text\n")).toBe("Start _text_\n");
  });
});
