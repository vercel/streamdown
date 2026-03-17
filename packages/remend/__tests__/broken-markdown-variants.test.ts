import { describe, expect, it } from "vitest";
import remend from "../src";

// 1. Rapid successive formatting switches
describe("rapid successive formatting switches", () => {
  it("should close italic and strikethrough but not bold when asterisk in content", () => {
    // Bold pattern can't match when there's a * in content between ** and end
    // Only italic (*) and strikethrough (~~) close
    const result = remend("**bold then *italic then ~~strike");
    expect(result).toBe("**bold then *italic then ~~strike*~~");
  });

  it("should close italic and strikethrough when bold pattern blocked", () => {
    // Bold pattern blocked by * in content; italic and strikethrough close
    const result = remend("~~strike **bold *italic");
    expect(result).toBe("~~strike **bold *italic*~~");
  });

  it("should close handlers in priority order (bold before strikethrough before code)", () => {
    // Bold can't match (asterisk in content), italic appends *, boldItalic appends ***,
    // then inline code appends `, then strikethrough appends ~~
    const result = remend("*italic **bold ~~strike `code");
    expect(result).toBe("*italic **bold ~~strike `code***`~~");
  });

  it("should close bold before strikethrough (priority order)", () => {
    // Bold handler (priority 35) runs before strikethrough (priority 60)
    const result = remend("**bold ~~strike");
    expect(result).toBe("**bold ~~strike**~~");
  });

  it("should close italic then bold via bold-italic handler", () => {
    const result = remend("*italic **bold");
    expect(result).toBe("*italic **bold***");
  });
});

// 2. Formatting cut mid-marker
describe("formatting cut mid-marker", () => {
  it("should not close single asterisk at end (ambiguous)", () => {
    // Single trailing * could be start of ** - not meaningful content after it
    const result = remend("text*");
    expect(result).toBe("text*");
  });

  it("should not close single tilde at end (not a valid marker alone)", () => {
    const result = remend("text~");
    expect(result).toBe("text~");
  });

  it("should not close single dollar at end without inlineKatex", () => {
    const result = remend("text$");
    expect(result).toBe("text$");
  });

  it("should close single dollar at end with inlineKatex enabled", () => {
    // countSingleDollars sees 1 (odd), appends $
    const result = remend("text$", { inlineKatex: true });
    expect(result).toBe("text$$");
  });

  it("should handle opening marker + single char of closing", () => {
    // **bold* is a half-complete bold closing
    expect(remend("**bold*")).toBe("**bold**");
    // ~~strike~ is a half-complete strikethrough closing
    expect(remend("~~strike~")).toBe("~~strike~~");
    // $$formula$ is a half-complete block katex closing
    expect(remend("$$formula$")).toBe("$$formula$$");
  });
});

// 3. Backslash escapes + incomplete formatting
describe("backslash escapes with incomplete formatting", () => {
  it("should not close escaped asterisks", () => {
    // \\* means escaped backslash + real asterisk
    const result = remend("\\*not italic");
    expect(result).toBe("\\*not italic");
  });

  it("should not close double-escaped backslash before asterisk", () => {
    // remend sees the char before * as \ (the second backslash) and treats it as escaped
    const result = remend("\\\\*actually italic");
    expect(result).toBe("\\\\*actually italic");
  });

  it("should close escaped double asterisks (remend does not track escape depth)", () => {
    // remend doesn't understand that \** has the first * escaped;
    // it sees ** and closes bold
    const result = remend("\\**not bold");
    expect(result).toBe("\\**not bold**");
  });

  it("should handle mixed escaped and real formatting", () => {
    // \\* is escaped, but the later *real* is valid
    const result = remend("\\*escaped\\* but *real italic");
    expect(result).toBe("\\*escaped\\* but *real italic*");
  });
});

// 4. Multiple incomplete links
describe("multiple incomplete links", () => {
  it("should handle two incomplete links", () => {
    const result = remend("[link1 and [link2");
    expect(result).toBe("[link1 and [link2](streamdown:incomplete-link)");
  });

  it("should handle one complete and one incomplete link", () => {
    const result = remend("[first](url1) and [second");
    expect(result).toBe(
      "[first](url1) and [second](streamdown:incomplete-link)"
    );
  });

  it("should handle nested incomplete brackets", () => {
    const result = remend("[outer [inner]");
    // [inner] is complete, [outer has no closing ]
    expect(result).toBe("[outer [inner]](streamdown:incomplete-link)");
  });

  it("should handle incomplete link in text-only mode", () => {
    const result = remend("[incomplete link", { linkMode: "text-only" });
    expect(result).toBe("incomplete link");
  });

  it("should handle two incomplete links in text-only mode", () => {
    const result = remend("[link1 and [link2", { linkMode: "text-only" });
    expect(result).toBe("link1 and [link2");
  });
});

// 5. Link text containing formatting markers
describe("link text with formatting markers", () => {
  it("should handle bold inside incomplete link URL", () => {
    const result = remend("[**bold link**](incomplete-url");
    expect(result).toBe("[**bold link**](streamdown:incomplete-link)");
  });

  it("should handle italic inside incomplete link URL", () => {
    const result = remend("[*italic link*](incomplete");
    expect(result).toBe("[*italic link*](streamdown:incomplete-link)");
  });

  it("should handle code inside incomplete link URL", () => {
    const result = remend("[`code link`](incomplete");
    expect(result).toBe("[`code link`](streamdown:incomplete-link)");
  });

  it("should handle incomplete formatting inside incomplete link text", () => {
    // Link handler runs first (priority 20), early returns
    const result = remend("[**bold link");
    expect(result).toBe("[**bold link](streamdown:incomplete-link)");
  });
});

// 6. Nested blockquotes with formatting
describe("nested blockquotes with formatting", () => {
  it("should close bold in deeply nested blockquote", () => {
    expect(remend("> > **deeply nested bold")).toBe(
      "> > **deeply nested bold**"
    );
  });

  it("should close bold in blockquote with list", () => {
    expect(remend("> * list with **bold")).toBe("> * list with **bold**");
  });

  it("should close italic in triple nested blockquote", () => {
    expect(remend("> > > triple nested *italic")).toBe(
      "> > > triple nested *italic*"
    );
  });

  it("should close strikethrough in blockquote", () => {
    expect(remend("> ~~struck text")).toBe("> ~~struck text~~");
  });
});

// 7. Task lists with formatting
describe("task lists with formatting", () => {
  it("should close bold in unchecked task", () => {
    expect(remend("- [ ] **bold task")).toBe("- [ ] **bold task**");
  });

  it("should keep complete strikethrough in checked task", () => {
    expect(remend("- [x] completed ~~struck~~")).toBe(
      "- [x] completed ~~struck~~"
    );
  });

  it("should close italic in unchecked task", () => {
    expect(remend("- [ ] *italic task")).toBe("- [ ] *italic task*");
  });

  it("should close inline code in task", () => {
    expect(remend("- [ ] `code task")).toBe("- [ ] `code task`");
  });
});

// 8. Formatting inside table cells
describe("formatting inside table cells", () => {
  it("should close bold that appears to span cell boundary", () => {
    // The ** has content after it, so it should be closed
    expect(remend("| **bold | next |")).toBe("| **bold | next |**");
  });

  it("should close inline code that spans cell boundary", () => {
    expect(remend("| `code | next |")).toBe("| `code | next |`");
  });

  it("should handle complete formatting in table cell", () => {
    const text = "| **bold** | next |";
    expect(remend(text)).toBe(text);
  });
});

// 9. HTML comments and special HTML
describe("HTML comments and special HTML", () => {
  it("should not strip HTML comment (pattern requires <[a-zA-Z/])", () => {
    // <!-- starts with <! which doesn't match the handler's /^<[a-zA-Z/]/ pattern
    expect(remend("text <!-- incomplete comment")).toBe(
      "text <!-- incomplete comment"
    );
  });

  it("should not strip complete script tag with trailing text", () => {
    // <script> is a complete tag (has >), so the handler doesn't strip it
    expect(remend("text <script>alert('")).toBe("text <script>alert('");
  });

  it("should strip incomplete div with attributes", () => {
    expect(remend('text <div class="test')).toBe("text");
  });

  it("should keep complete HTML tags", () => {
    expect(remend("text <br>")).toBe("text <br>");
  });

  it("should keep complete HTML comments", () => {
    expect(remend("text <!-- comment -->")).toBe("text <!-- comment -->");
  });
});

// 10. KaTeX with complex content
describe("KaTeX with complex content", () => {
  it("should close block katex with braces inside", () => {
    // remend just appends $$, it doesn't complete LaTeX braces
    expect(remend("$$\\frac{x}{y")).toBe("$$\\frac{x}{y$$");
  });

  it("should close block katex with latex environments", () => {
    expect(remend("$$\\begin{matrix} a")).toBe("$$\\begin{matrix} a$$");
  });

  it("should close inline katex when enabled", () => {
    expect(remend("$x^2 + y^2", { inlineKatex: true })).toBe("$x^2 + y^2$");
  });

  it("should not treat currency as katex without inlineKatex", () => {
    const text = "The price is $50 and $100";
    expect(remend(text)).toBe(text);
  });

  it("should close odd inline katex with currency-like text", () => {
    // With inlineKatex enabled, $50 and $100 look like two single $ signs (even count)
    const result = remend("The price is $50 and $100", { inlineKatex: true });
    expect(result).toBe("The price is $50 and $100");
  });

  it("should close multiline block katex with complex content", () => {
    expect(remend("$$\n\\sum_{i=0}^{n} x_i")).toBe(
      "$$\n\\sum_{i=0}^{n} x_i\n$$"
    );
  });
});

// 11. Consecutive completed + incomplete
describe("consecutive completed + incomplete formatting", () => {
  it("should close second bold after complete bold", () => {
    expect(remend("**bold** then **more")).toBe("**bold** then **more**");
  });

  it("should close second inline code after complete code", () => {
    expect(remend("`code` then `more")).toBe("`code` then `more`");
  });

  it("should close second strikethrough after complete strikethrough", () => {
    expect(remend("~~done~~ and ~~undone")).toBe("~~done~~ and ~~undone~~");
  });

  it("should close second italic after complete italic", () => {
    expect(remend("*first* and *second")).toBe("*first* and *second*");
  });

  it("should close second bold-italic after complete bold-italic", () => {
    expect(remend("***first*** and ***second")).toBe(
      "***first*** and ***second***"
    );
  });
});

// 12. Formatting at paragraph boundaries
describe("formatting at paragraph boundaries", () => {
  it("should close bold after paragraph break", () => {
    expect(remend("paragraph1\n\n**bold")).toBe("paragraph1\n\n**bold**");
  });

  it("should close italic after paragraph break", () => {
    expect(remend("line1\n\n*italic text")).toBe("line1\n\n*italic text*");
  });

  it("should close formatting after multiple newlines", () => {
    expect(remend("text\n\n\n**bold")).toBe("text\n\n\n**bold**");
  });

  it("should close inline code across paragraph", () => {
    expect(remend("text\n\n`code")).toBe("text\n\n`code`");
  });
});

// 13. Deeply nested formatting (4+ levels)
describe("deeply nested formatting", () => {
  it("should close handlers in priority order with deeply nested formatting", () => {
    // Bold can't match (asterisk in content), italic appends *,
    // inline code appends `, strikethrough appends ~~
    const result = remend("**bold *italic ~~strike `code");
    expect(result).toBe("**bold *italic ~~strike `code*`~~");
  });

  it("should close bold-italic then code then strikethrough", () => {
    // BoldItalic (priority 30) appends ***, then inline code (50) appends `,
    // then strikethrough (60) appends ~~
    const result = remend("***bold-italic ~~strike `code");
    expect(result).toBe("***bold-italic ~~strike `code***`~~");
  });

  it("should close italic but not bold when asterisk blocks bold pattern", () => {
    // Bold handler can't match when * appears in content after **
    // Italic handler closes the *, leaving ** unclosed
    const result = remend("**bold and *italic");
    expect(result).toBe("**bold and *italic*");
  });
});

// 14. CJK and Unicode with formatting
describe("CJK and Unicode with formatting", () => {
  it("should close bold with Chinese text", () => {
    expect(remend("**中文粗体")).toBe("**中文粗体**");
  });

  it("should close italic with Japanese text", () => {
    expect(remend("*日本語")).toBe("*日本語*");
  });

  it("should close inline code with Korean text", () => {
    expect(remend("`한국어 코드")).toBe("`한국어 코드`");
  });

  it("should close strikethrough with emoji content", () => {
    expect(remend("~~🎉 celebration")).toBe("~~🎉 celebration~~");
  });

  it("should close bold with mixed CJK and Latin", () => {
    expect(remend("**Hello 世界")).toBe("**Hello 世界**");
  });
});

// 15. Formatting after structural elements
describe("formatting after structural elements", () => {
  it("should close bold after horizontal rule", () => {
    expect(remend("---\n**bold after rule")).toBe("---\n**bold after rule**");
  });

  it("should close bold after heading", () => {
    expect(remend("# Heading\n**bold")).toBe("# Heading\n**bold**");
  });

  it("should close bold after blockquote", () => {
    expect(remend("> quote\n**bold")).toBe("> quote\n**bold**");
  });

  it("should close italic after code block", () => {
    expect(remend("```\ncode\n```\n*italic")).toBe("```\ncode\n```\n*italic*");
  });
});

// 16. Reference-style links and footnotes
describe("reference-style links and footnotes", () => {
  it("should handle reference-style link with complete brackets", () => {
    const text = "[text][ref]";
    expect(remend(text)).toBe(text);
  });

  it("should handle footnote reference", () => {
    const text = "[^1]";
    expect(remend(text)).toBe(text);
  });

  it("should handle incomplete reference link", () => {
    const result = remend("[text][");
    expect(result).toBe("[text][](streamdown:incomplete-link)");
  });

  it("should keep complete footnote definition", () => {
    const text = "[^1]: footnote text";
    expect(remend(text)).toBe(text);
  });
});

// 17. Indented code blocks
describe("indented code blocks", () => {
  it("should still close asterisks in indented text (not fenced)", () => {
    // remend only tracks fenced code blocks, so indented code is treated as normal text
    expect(remend("    *asterisks in indented")).toBe(
      "    *asterisks in indented*"
    );
  });

  it("should close bold in indented text", () => {
    expect(remend("    **bold in indented")).toBe("    **bold in indented**");
  });
});

// 18. Back-to-back code blocks
describe("back-to-back code blocks", () => {
  it("should handle formatting after closed code block", () => {
    expect(remend("```\ncode\n```\n**bold")).toBe("```\ncode\n```\n**bold**");
  });

  it("should not close formatting inside open code block", () => {
    // Second ``` opens a new code block that isn't closed
    const text = "```\ncode\n```\n```\nmore";
    expect(remend(text)).toBe(text);
  });

  it("should handle inline code after code block", () => {
    expect(remend("```\nblock\n```\n`inline")).toBe(
      "```\nblock\n```\n`inline`"
    );
  });
});

// 19. Confusing asterisk sequences
describe("confusing asterisk sequences", () => {
  it("should handle four asterisks (bold-italic handler appends ***)", () => {
    // BoldItalic sees odd triple-asterisk count and markers not balanced, appends ***
    const result = remend("****text");
    expect(result).toBe("****text***");
  });

  it("should handle five asterisks (bold-italic handler appends ***)", () => {
    const result = remend("*****text");
    expect(result).toBe("*****text***");
  });

  it("should handle mixed asterisk counts", () => {
    // *a**b: single * then ** - each handler works independently
    const result = remend("*a**b");
    expect(result).toBe("*a**b***");
  });
});

// 20. Whitespace edge cases
describe("whitespace edge cases", () => {
  it("should close bold with tabs in content", () => {
    expect(remend("**bold\twith\ttabs")).toBe("**bold\twith\ttabs**");
  });

  it("should close bold with CRLF", () => {
    expect(remend("**bold\r\nwith CRLF")).toBe("**bold\r\nwith CRLF**");
  });

  it("should close bold after many leading newlines", () => {
    expect(remend("\n\n\n**bold")).toBe("\n\n\n**bold**");
  });

  it("should trim trailing single space", () => {
    expect(remend("text ")).toBe("text");
  });

  it("should preserve trailing double space", () => {
    expect(remend("text  ")).toBe("text  ");
  });

  it("should close bold and trim trailing space", () => {
    expect(remend("**bold ")).toBe("**bold**");
  });
});

// 21. Options/disabled handlers
describe("disabled handlers via options", () => {
  it("should not close bold when bold is disabled", () => {
    expect(remend("**bold text", { bold: false })).toBe("**bold text");
  });

  it("should close italic even when bold is disabled", () => {
    expect(remend("**bold *italic", { bold: false })).toBe("**bold *italic*");
  });

  it("should not close anything when all are disabled", () => {
    const result = remend("**bold *italic `code ~~strike", {
      bold: false,
      italic: false,
      inlineCode: false,
      strikethrough: false,
      boldItalic: false,
    });
    expect(result).toBe("**bold *italic `code ~~strike");
  });

  it("should not close bold when asterisk in content blocks pattern (italic disabled)", () => {
    // Bold pattern can't match when * appears in content; italic is disabled
    // So nothing closes
    expect(remend("**bold *italic", { italic: false })).toBe("**bold *italic");
  });

  it("should close strikethrough but not bold when bold is disabled", () => {
    expect(remend("**bold ~~strike", { bold: false })).toBe(
      "**bold ~~strike~~"
    );
  });

  it("should still close links when only links disabled (images defaults to true)", () => {
    // The links handler is enabled when EITHER links or images option is true
    // Since images defaults to true, disabling only links doesn't disable the handler
    expect(remend("[link text", { links: false })).toBe(
      "[link text](streamdown:incomplete-link)"
    );
  });

  it("should not close links when both links and images disabled", () => {
    expect(remend("[link text", { links: false, images: false })).toBe(
      "[link text"
    );
  });

  it("should not close katex when katex disabled", () => {
    expect(remend("$$formula", { katex: false })).toBe("$$formula");
  });
});

// 22. Real-world AI streaming patterns
describe("real-world AI streaming patterns", () => {
  it("should handle code explanation with incomplete code block", () => {
    const text = "Here's how to use it:\n\n```typescript\nconst x = 1";
    // Inside an incomplete fenced code block - should not modify
    expect(remend(text)).toBe(text);
  });

  it("should handle markdown list being built with bold", () => {
    expect(remend("1. First\n2. **Second item with bold")).toBe(
      "1. First\n2. **Second item with bold**"
    );
  });

  it("should handle mixed inline code and bold", () => {
    expect(remend("The function `getData` returns a **Promise")).toBe(
      "The function `getData` returns a **Promise**"
    );
  });

  it("should handle incomplete link in explanation", () => {
    expect(remend("Check the [documentation")).toBe(
      "Check the [documentation](streamdown:incomplete-link)"
    );
  });

  it("should handle code block followed by explanation", () => {
    expect(
      remend("```js\nconst x = 1;\n```\n\nThis creates a **variable")
    ).toBe("```js\nconst x = 1;\n```\n\nThis creates a **variable**");
  });

  it("should handle bullet list with inline code", () => {
    expect(remend("- Use `map` to transform\n- Use `filter")).toBe(
      "- Use `map` to transform\n- Use `filter`"
    );
  });

  it("should handle heading with incomplete italic", () => {
    expect(remend("## Important *note")).toBe("## Important *note*");
  });

  it("should handle incomplete image (preserves newlines before removed image)", () => {
    expect(remend("Here's the diagram:\n\n![architecture")).toBe(
      "Here's the diagram:\n\n"
    );
  });

  it("should handle incomplete image with partial URL (preserves trailing space)", () => {
    // Image is removed, leaving "See " - the trailing space remains
    // because remend only trims single trailing space at the very start
    // before handlers run, and the handler produces new trailing space
    expect(remend("See ![diagram](http://example.com/img")).toBe("See ");
  });

  it("should handle link with incomplete formatting after it", () => {
    expect(remend("[click here](https://example.com) for **more")).toBe(
      "[click here](https://example.com) for **more**"
    );
  });
});
