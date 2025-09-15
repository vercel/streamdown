import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../lib/parse-incomplete-markdown";

describe("parseIncompleteMarkdown - word-internal underscores", () => {
  describe("underscores as word separators", () => {
    it("should handle single underscore between words", () => {
      const input = "hello_world";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("hello_world");
    });

    it("should handle multiple underscores between words", () => {
      const input = "hello_world_test";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("hello_world_test");
    });

    it("should handle CONSTANT_CASE", () => {
      const input = "MAX_VALUE";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("MAX_VALUE");
    });

    it("should handle multiple snake_case words in text", () => {
      const input = "The user_name and user_email are required";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("The user_name and user_email are required");
    });

    it("should handle underscore in URLs", () => {
      const input = "Visit https://example.com/path_with_underscore";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("Visit https://example.com/path_with_underscore");
    });

    it("should handle numbers with underscores", () => {
      const input = "The value is 1_000_000";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("The value is 1_000_000");
    });
  });

  describe("incomplete italic formatting", () => {
    it("should complete italic at word boundary", () => {
      const input = "_italic text";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("_italic text_");
    });

    it("should complete italic with punctuation", () => {
      const input = "This is _italic";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("This is _italic_");
    });

    it("should complete italic before newline", () => {
      const input = "_italic\n";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("_italic_\n");
    });
  });

  describe("edge cases", () => {
    it("should handle underscore at end of word (ambiguous case)", () => {
      const input = "word_";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("word_");
    });

    it("should handle leading underscore in identifier", () => {
      const input = "_privateVariable";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("_privateVariable_");
    });

    it("should handle code with underscores in markdown", () => {
      const input = "Use `variable_name` in your code";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("Use `variable_name` in your code");
    });

    it("should handle mixed snake_case and italic", () => {
      const input = "The variable_name is _important";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("The variable_name is _important_");
    });

    it("should not modify complete italic pairs", () => {
      const input = "_complete italic_ and some_other_text";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("_complete italic_ and some_other_text");
    });

    it("should handle underscore in code blocks", () => {
      const input = "```\nfunction_name()\n```";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("```\nfunction_name()\n```");
    });

    it("should handle HTML attributes with underscores", () => {
      const input = '<div data_attribute="value">';
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe('<div data_attribute="value">');
    });
  });

  describe("real-world scenarios", () => {
    it("should handle Python-style names", () => {
      const input = "__init__ and __main__ are special";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("__init__ and __main__ are special");
    });

    it("should handle markdown in sentences with snake_case", () => {
      const input = "The user_id field stores the _unique identifier";
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe("The user_id field stores the _unique identifier_");
    });

    it("should handle the original bug report case", () => {
      const input = `hello_world

<a href="example_link"/>`;
      const result = parseIncompleteMarkdown(input);
      expect(result).toBe(input);
      expect(result).not.toMatch(/hello_world_/);
      expect(result).not.toMatch(/_$/);
    });
  });
});
