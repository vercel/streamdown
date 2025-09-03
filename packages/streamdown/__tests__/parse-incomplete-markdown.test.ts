import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../lib/parse-incomplete-markdown";

describe("parseIncompleteMarkdown", () => {
  describe("basic input handling", () => {
    it("should return non-string inputs unchanged", () => {
      expect(parseIncompleteMarkdown(null as any)).toBe(null);
      expect(parseIncompleteMarkdown(undefined as any)).toBe(undefined);
      expect(parseIncompleteMarkdown(123 as any)).toBe(123);
    });

    it("should return empty string unchanged", () => {
      expect(parseIncompleteMarkdown("")).toBe("");
    });

    it("should return regular text unchanged", () => {
      const text = "This is plain text without any markdown";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe("link handling", () => {
    it("should preserve incomplete links with special marker", () => {
      expect(parseIncompleteMarkdown("Text with [incomplete link")).toBe(
        "Text with [incomplete link](streamdown:incomplete-link)"
      );
      expect(parseIncompleteMarkdown("Text [partial")).toBe(
        "Text [partial](streamdown:incomplete-link)"
      );
    });

    it("should keep complete links unchanged", () => {
      const text = "Text with [complete link](url)";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple complete links", () => {
      const text = "[link1](url1) and [link2](url2)";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe("image handling", () => {
    it("should remove incomplete images", () => {
      expect(parseIncompleteMarkdown("Text with ![incomplete image")).toBe(
        "Text with "
      );
      expect(parseIncompleteMarkdown("![partial")).toBe("");
    });

    it("should keep complete images unchanged", () => {
      const text = "Text with ![alt text](image.png)";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe("bold formatting (**)", () => {
    it("should complete incomplete bold formatting", () => {
      expect(parseIncompleteMarkdown("Text with **bold")).toBe(
        "Text with **bold**"
      );
      expect(parseIncompleteMarkdown("**incomplete")).toBe("**incomplete**");
    });

    it("should keep complete bold formatting unchanged", () => {
      const text = "Text with **bold text**";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple bold sections", () => {
      const text = "**bold1** and **bold2**";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should complete odd number of bold markers", () => {
      expect(parseIncompleteMarkdown("**first** and **second")).toBe(
        "**first** and **second**"
      );
    });
  });

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
  });

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
  });

  describe("inline code formatting (`)", () => {
    it("should complete incomplete inline code", () => {
      expect(parseIncompleteMarkdown("Text with `code")).toBe(
        "Text with `code`"
      );
      expect(parseIncompleteMarkdown("`incomplete")).toBe("`incomplete`");
    });

    it("should keep complete inline code unchanged", () => {
      const text = "Text with `inline code`";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple inline code sections", () => {
      const text = "`code1` and `code2`";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should not complete backticks inside code blocks", () => {
      const text = "```\ncode block with `backtick\n```";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle incomplete code blocks correctly", () => {
      const text = "```javascript\nconst x = `template";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle inline triple backticks correctly", () => {
      const text = '```python print("Hello, Sunnyvale!")```';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle incomplete inline triple backticks", () => {
      const text = '```python print("Hello, Sunnyvale!")``';
      expect(parseIncompleteMarkdown(text)).toBe(
        '```python print("Hello, Sunnyvale!")```'
      );
    });
  });

  describe("strikethrough formatting (~~)", () => {
    it("should complete incomplete strikethrough", () => {
      expect(parseIncompleteMarkdown("Text with ~~strike")).toBe(
        "Text with ~~strike~~"
      );
      expect(parseIncompleteMarkdown("~~incomplete")).toBe("~~incomplete~~");
    });

    it("should keep complete strikethrough unchanged", () => {
      const text = "Text with ~~strikethrough text~~";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple strikethrough sections", () => {
      const text = "~~strike1~~ and ~~strike2~~";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should complete odd number of strikethrough markers", () => {
      expect(parseIncompleteMarkdown("~~first~~ and ~~second")).toBe(
        "~~first~~ and ~~second~~"
      );
    });
  });

  describe("mixed formatting", () => {
    it("should handle multiple formatting types", () => {
      const text = "**bold** and *italic* and `code` and ~~strike~~";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should complete multiple incomplete formats", () => {
      expect(parseIncompleteMarkdown("**bold and *italic")).toBe(
        "**bold and *italic*"
      );
    });

    it("should handle nested formatting", () => {
      const text = "**bold with *italic* inside**";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should prioritize link/image preservation over formatting completion", () => {
      expect(parseIncompleteMarkdown("Text with [link and **bold")).toBe(
        "Text with [link and **bold](streamdown:incomplete-link)"
      );
    });

    it("should handle complex real-world markdown", () => {
      const text =
        "# Heading\n\n**Bold text** with *italic* and `code`.\n\n- List item\n- Another item with ~~strike~~";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe("KaTeX block formatting ($$)", () => {
    it("should complete incomplete block KaTeX", () => {
      expect(parseIncompleteMarkdown("Text with $$formula")).toBe(
        "Text with $$formula$$"
      );
      expect(parseIncompleteMarkdown("$$incomplete")).toBe("$$incomplete$$");
    });

    it("should keep complete block KaTeX unchanged", () => {
      const text = "Text with $$E = mc^2$$";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple block KaTeX sections", () => {
      const text = "$$formula1$$ and $$formula2$$";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should complete odd number of block KaTeX markers", () => {
      expect(parseIncompleteMarkdown("$$first$$ and $$second")).toBe(
        "$$first$$ and $$second$$"
      );
    });

    it("should handle block KaTeX at start of text", () => {
      expect(parseIncompleteMarkdown("$$x + y = z")).toBe("$$x + y = z$$");
    });

    it("should handle multiline block KaTeX", () => {
      expect(parseIncompleteMarkdown("$$\nx = 1\ny = 2")).toBe(
        "$$\nx = 1\ny = 2\n$$"
      );
    });
  });

  describe("KaTeX inline formatting ($)", () => {
    it("should NOT complete single dollar signs (likely currency)", () => {
      // Single dollar signs are likely currency, not math
      expect(parseIncompleteMarkdown("Text with $formula")).toBe(
        "Text with $formula"
      );
      expect(parseIncompleteMarkdown("$incomplete")).toBe("$incomplete");
    });

    it("should keep text with paired dollar signs unchanged", () => {
      // Even paired dollar signs are preserved but not treated as math
      const text = "Text with $x^2 + y^2 = z^2$";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple inline KaTeX sections", () => {
      const text = "$a = 1$ and $b = 2$";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should NOT complete odd number of dollar signs", () => {
      // We don't auto-complete dollar signs anymore
      expect(parseIncompleteMarkdown("$first$ and $second")).toBe(
        "$first$ and $second"
      );
    });

    it("should not complete single $ but should complete block $$", () => {
      // Block math $$ is completed, single $ is not
      expect(parseIncompleteMarkdown("$$block$$ and $inline")).toBe(
        "$$block$$ and $inline"
      );
    });

    it("should NOT complete dollar sign at start of text", () => {
      // Single dollar sign is likely currency
      expect(parseIncompleteMarkdown("$x + y = z")).toBe("$x + y = z");
    });

    it("should handle escaped dollar signs", () => {
      const text = "Price is \\$100";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle multiple consecutive dollar signs correctly", () => {
      expect(parseIncompleteMarkdown("$$$")).toBe("$$$$$");
      expect(parseIncompleteMarkdown("$$$$")).toBe("$$$$");
    });
  });

  describe("code block handling", () => {
    it("should handle incomplete multiline code blocks", () => {
      expect(parseIncompleteMarkdown("```javascript\nconst x = 5;")).toBe(
        "```javascript\nconst x = 5;"
      );
      expect(parseIncompleteMarkdown("```\ncode here")).toBe("```\ncode here");
    });

    it("should handle complete multiline code blocks", () => {
      const text = "```javascript\nconst x = 5;\n```";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle code blocks with language and incomplete content", () => {
      expect(parseIncompleteMarkdown("```python\ndef hello():")).toBe(
        "```python\ndef hello():"
      );
    });

    it("should handle nested backticks inside code blocks", () => {
      const text = "```\nconst str = `template`;\n```";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle incomplete code blocks at end of chunked response", () => {
      expect(parseIncompleteMarkdown("Some text\n```js\nconsole.log")).toBe(
        "Some text\n```js\nconsole.log"
      );
    });

    it("should handle code blocks with trailing content", () => {
      const text = "```\ncode\n```\nMore text";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle complete code blocks ending with triple backticks on newline", () => {
      const text =
        '```python\ndef greet(name):\n    return f"Hello, {name}!"\n```';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle complete code blocks with trailing newline after closing backticks", () => {
      const text =
        '```python\ndef greet(name):\n    return f"Hello, {name}!"\n```\n';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should not add extra characters to complete simple code block", () => {
      // Bug report: This was being rendered with extra characters at the end
      const text =
        "```\nSimple code block\nwith multiple lines\nand some special characters: !@#$%^&*()\n```";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should not add extra characters to complete Python code block with underscores and asterisks", () => {
      // Bug report: This was being rendered with **_ appended
      const text =
        '```python\ndef hello_world():\n    """A simple function"""\n    name = "World"\n    print(f"Hello, {name}!")\n    \n    # List comprehension\n    numbers = [x**2 for x in range(10) if x % 2 == 0]\n    return numbers\n\nclass TestClass:\n    def __init__(self, value):\n        self.value = value\n```';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should not add backticks when code block ends properly", () => {
      // This is the exact case from Grok
      const grokOutput =
        '```python def greet(name): return f"Hello, {name}!"\n```';
      expect(parseIncompleteMarkdown(grokOutput)).toBe(grokOutput);
    });

    it("should handle multiple complete code blocks with newlines", () => {
      const text = "```js\ncode1\n```\n\n```python\ncode2\n```";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should correctly handle code on same line as opening backticks with closing on newline", () => {
      // This was causing issues - being treated as inline when it should be multiline
      const text = '```python def greet(name): return f"Hello, {name}!"\n```';
      expect(parseIncompleteMarkdown(text)).toBe(text);

      // Should NOT be treated as inline triple backticks
      const result = parseIncompleteMarkdown(text);
      expect(result).not.toContain("````"); // Should not add extra backticks
    });

    it("should only treat truly inline triple backticks as inline", () => {
      // This SHOULD be treated as inline (no newlines)
      const inline = "```python code```";
      expect(parseIncompleteMarkdown(inline)).toBe(inline);

      // This should NOT be treated as inline (has newline)
      const multiline = "```python code\n```";
      expect(parseIncompleteMarkdown(multiline)).toBe(multiline);
    });
  });

  describe("chunked streaming scenarios", () => {
    it("should handle partial bold text at chunk boundary", () => {
      expect(parseIncompleteMarkdown("Here is some **bold tex")).toBe(
        "Here is some **bold tex**"
      );
    });

    it("should handle partial link at chunk boundary", () => {
      expect(parseIncompleteMarkdown("Check out [this lin")).toBe(
        "Check out [this lin](streamdown:incomplete-link)"
      );
      // Links with partial URLs are kept as-is since they might be complete
      expect(parseIncompleteMarkdown("Visit [our site](https://exa")).toBe(
        "Visit [our site](https://exa"
      );
    });

    it("should handle partial image at chunk boundary", () => {
      expect(parseIncompleteMarkdown("See ![the diag")).toBe("See ");
      // Images with partial URLs are kept as-is since they might be complete
      expect(parseIncompleteMarkdown("![logo](./assets/log")).toBe(
        "![logo](./assets/log"
      );
    });

    it("should handle nested formatting cut mid-stream", () => {
      expect(parseIncompleteMarkdown("This is **bold with *ital")).toBe(
        "This is **bold with *ital*"
      );
      // When bold is unclosed, it gets closed first, then underscore
      expect(parseIncompleteMarkdown("**bold _und")).toBe("**bold _und**_");
    });

    it("should handle lists with incomplete formatting", () => {
      expect(parseIncompleteMarkdown("- Item 1\n- Item 2 with **bol")).toBe(
        "- Item 1\n- Item 2 with **bol**"
      );
    });

    it("should handle headings with incomplete formatting", () => {
      expect(
        parseIncompleteMarkdown("# Main Title\n## Subtitle with **emph")
      ).toBe("# Main Title\n## Subtitle with **emph**");
    });

    it("should handle blockquotes with incomplete formatting", () => {
      expect(parseIncompleteMarkdown("> Quote with **bold")).toBe(
        "> Quote with **bold**"
      );
    });

    it("should handle tables with incomplete formatting", () => {
      expect(
        parseIncompleteMarkdown("| Col1 | Col2 |\n|------|------|\n| **dat")
      ).toBe("| Col1 | Col2 |\n|------|------|\n| **dat**");
    });

    it("should handle complex nested structures from chunks", () => {
      // Backticks spanning multiple lines need special handling
      expect(
        parseIncompleteMarkdown(
          "1. First item\n   - Nested with `code\n2. Second"
        )
      ).toBe("1. First item\n   - Nested with `code\n2. Second`");
    });

    it("should handle multiple incomplete formats in one chunk", () => {
      // Formats are closed in order they're processed
      expect(parseIncompleteMarkdown("Text **bold `code")).toBe(
        "Text **bold `code**`"
      );
    });
  });

  describe("mixed formatting scenarios", () => {
    it("should handle bold inside italic", () => {
      expect(parseIncompleteMarkdown("*italic with **bold")).toBe(
        "*italic with **bold**"
      );
    });

    it("should handle code inside bold", () => {
      // Bold gets closed first, then code
      expect(parseIncompleteMarkdown("**bold with `code")).toBe(
        "**bold with `code**`"
      );
    });

    it("should handle strikethrough with other formatting", () => {
      // Both formats get closed
      expect(parseIncompleteMarkdown("~~strike with **bold")).toBe(
        "~~strike with **bold**~~"
      );
    });

    it("should handle dollar sign inside other formatting", () => {
      // Bold gets closed, dollar sign stays as-is (likely currency)
      expect(parseIncompleteMarkdown("**bold with $x^2")).toBe(
        "**bold with $x^2**"
      );
    });

    it("should handle deeply nested incomplete formatting", () => {
      // Formats are closed in the order they're processed
      expect(parseIncompleteMarkdown("**bold *italic `code ~~strike")).toBe(
        "**bold *italic `code ~~strike*`~~"
      );
    });

    it("should preserve complete nested formatting", () => {
      const text = "**bold *italic* text** and `code`";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe("real-world streaming chunks", () => {
    it("should handle typical GPT response chunks", () => {
      const chunks = [
        "Here is",
        "Here is a **bold",
        "Here is a **bold statement",
        "Here is a **bold statement** about",
        "Here is a **bold statement** about `code",
        "Here is a **bold statement** about `code`.",
      ];

      expect(parseIncompleteMarkdown(chunks[0])).toBe("Here is");
      expect(parseIncompleteMarkdown(chunks[1])).toBe("Here is a **bold**");
      expect(parseIncompleteMarkdown(chunks[2])).toBe(
        "Here is a **bold statement**"
      );
      expect(parseIncompleteMarkdown(chunks[3])).toBe(
        "Here is a **bold statement** about"
      );
      expect(parseIncompleteMarkdown(chunks[4])).toBe(
        "Here is a **bold statement** about `code`"
      );
      expect(parseIncompleteMarkdown(chunks[5])).toBe(chunks[5]);
    });

    it("should handle code explanation chunks", () => {
      const chunks = [
        "To use this function",
        "To use this function, call `getData(",
        "To use this function, call `getData()` with",
      ];

      expect(parseIncompleteMarkdown(chunks[0])).toBe(chunks[0]);
      expect(parseIncompleteMarkdown(chunks[1])).toBe(
        "To use this function, call `getData(`"
      );
      expect(parseIncompleteMarkdown(chunks[2])).toBe(chunks[2]);
    });

    it("should handle mathematical expression chunks", () => {
      const chunks = [
        "The formula",
        "The formula $E",
        "The formula $E = mc",
        "The formula $E = mc^2",
        "The formula $E = mc^2$ shows",
      ];

      // Single dollar signs are not auto-completed (likely currency)
      expect(parseIncompleteMarkdown(chunks[0])).toBe(chunks[0]);
      expect(parseIncompleteMarkdown(chunks[1])).toBe("The formula $E");
      expect(parseIncompleteMarkdown(chunks[2])).toBe("The formula $E = mc");
      expect(parseIncompleteMarkdown(chunks[3])).toBe("The formula $E = mc^2");
      expect(parseIncompleteMarkdown(chunks[4])).toBe(chunks[4]);
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

  describe("math blocks with underscores", () => {
    it("should not complete underscores within inline math blocks", () => {
      const text = "The variable $x_1$ represents the first element";
      expect(parseIncompleteMarkdown(text)).toBe(text);

      const text2 = "Formula: $a_b + c_d = e_f$";
      expect(parseIncompleteMarkdown(text2)).toBe(text2);
    });

    it("should not complete underscores within block math", () => {
      const text = "$$x_1 + y_2 = z_3$$";
      expect(parseIncompleteMarkdown(text)).toBe(text);

      const text2 = "$$\na_1 + b_2\nc_3 + d_4\n$$";
      expect(parseIncompleteMarkdown(text2)).toBe(text2);
    });

    it("should not add underscore when math block has incomplete underscore", () => {
      // We no longer auto-complete single dollar signs
      // The underscore inside is not treated as italic since it's likely part of a variable name
      const text = "Math expression $x_";
      expect(parseIncompleteMarkdown(text)).toBe("Math expression $x_");

      const text2 = "$$formula_";
      expect(parseIncompleteMarkdown(text2)).toBe("$$formula_$$");
    });

    it("should handle underscores outside math blocks normally", () => {
      const text = "Text with _italic_ and math $x_1$";
      expect(parseIncompleteMarkdown(text)).toBe(text);

      const text2 = "_italic text_ followed by $a_b$";
      expect(parseIncompleteMarkdown(text2)).toBe(text2);
    });

    it("should complete italic underscore outside math but not inside", () => {
      const text = "Start _italic with $x_1$";
      expect(parseIncompleteMarkdown(text)).toBe("Start _italic with $x_1$_");
    });

    it("should handle complex math expressions with multiple underscores", () => {
      const text = "$x_1 + x_2 + x_3 = y_1$";
      expect(parseIncompleteMarkdown(text)).toBe(text);

      const text2 = "$$\\sum_{i=1}^{n} x_i = \\prod_{j=1}^{m} y_j$$";
      expect(parseIncompleteMarkdown(text2)).toBe(text2);
    });

    it("should handle escaped dollar signs correctly", () => {
      const text = "Price is \\$50 and _this is italic_";
      expect(parseIncompleteMarkdown(text)).toBe(text);

      const text2 = "Cost \\$100 with _incomplete";
      expect(parseIncompleteMarkdown(text2)).toBe(
        "Cost \\$100 with _incomplete_"
      );
    });

    it("should handle mixed inline and block math", () => {
      const text = "Inline $x_1$ and block $$y_2$$ math";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should not interfere with complete math blocks when adding underscores outside", () => {
      const text = "_italic start $x_1$ italic end_";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

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
  });

  describe("edge cases", () => {
    it("should handle text ending with formatting characters", () => {
      expect(parseIncompleteMarkdown("Text ending with *")).toBe(
        "Text ending with *"
      );
      expect(parseIncompleteMarkdown("Text ending with **")).toBe(
        "Text ending with **"
      );
    });

    it("should handle empty formatting markers", () => {
      expect(parseIncompleteMarkdown("****")).toBe("****");
      expect(parseIncompleteMarkdown("``")).toBe("``");
    });

    it("should handle standalone emphasis characters (issue #90)", () => {
      // Standalone markers should not be auto-closed
      expect(parseIncompleteMarkdown("**")).toBe("**");
      expect(parseIncompleteMarkdown("__")).toBe("__");
      expect(parseIncompleteMarkdown("***")).toBe("***");
      expect(parseIncompleteMarkdown("*")).toBe("*");
      expect(parseIncompleteMarkdown("_")).toBe("_");
      expect(parseIncompleteMarkdown("~~")).toBe("~~");
      expect(parseIncompleteMarkdown("`")).toBe("`");
      
      // Multiple standalone markers on the same line
      expect(parseIncompleteMarkdown("** __")).toBe("** __");
      expect(parseIncompleteMarkdown("\n** __\n")).toBe("\n** __\n");
      expect(parseIncompleteMarkdown("* _ ~~ `")).toBe("* _ ~~ `");
      
      // Standalone markers with only whitespace
      expect(parseIncompleteMarkdown("** ")).toBe("** ");
      expect(parseIncompleteMarkdown(" **")).toBe(" **");
      expect(parseIncompleteMarkdown("  **  ")).toBe("  **  ");
      
      // But markers with actual content should still be closed
      expect(parseIncompleteMarkdown("**text")).toBe("**text**");
      expect(parseIncompleteMarkdown("__text")).toBe("__text__");
      expect(parseIncompleteMarkdown("*text")).toBe("*text*");
      expect(parseIncompleteMarkdown("_text")).toBe("_text_");
      expect(parseIncompleteMarkdown("~~text")).toBe("~~text~~");
      expect(parseIncompleteMarkdown("`text")).toBe("`text`");
    });

    it("should handle very long text", () => {
      const longText = `${"a".repeat(10_000)} **bold`;
      const expected = `${"a".repeat(10_000)} **bold**`;
      expect(parseIncompleteMarkdown(longText)).toBe(expected);
    });

    it("should handle text with only formatting characters", () => {
      expect(parseIncompleteMarkdown("*")).toBe("*");
      expect(parseIncompleteMarkdown("**")).toBe("**");
      expect(parseIncompleteMarkdown("`")).toBe("`");
    });

    it("should handle escaped characters", () => {
      const text = "Text with \\* escaped asterisk";
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it("should handle markdown at very end of string", () => {
      expect(parseIncompleteMarkdown("text**")).toBe("text**");
      expect(parseIncompleteMarkdown("text*")).toBe("text*");
      expect(parseIncompleteMarkdown("text`")).toBe("text`");
      expect(parseIncompleteMarkdown("text$")).toBe("text$"); // Single dollar not completed
      expect(parseIncompleteMarkdown("text~~")).toBe("text~~");
    });

    it("should handle whitespace before incomplete markdown", () => {
      expect(parseIncompleteMarkdown("text **bold")).toBe("text **bold**");
      expect(parseIncompleteMarkdown("text\n**bold")).toBe("text\n**bold**");
      expect(parseIncompleteMarkdown("text\t`code")).toBe("text\t`code`");
    });

    it("should handle unicode characters in incomplete markdown", () => {
      expect(parseIncompleteMarkdown("**émoji 🎉")).toBe("**émoji 🎉**");
      expect(parseIncompleteMarkdown("`código")).toBe("`código`");
    });

    it("should handle HTML entities in incomplete markdown", () => {
      expect(parseIncompleteMarkdown("**&lt;tag&gt;")).toBe("**&lt;tag&gt;**");
      expect(parseIncompleteMarkdown("`&amp;")).toBe("`&amp;`");
    });
  });
});
