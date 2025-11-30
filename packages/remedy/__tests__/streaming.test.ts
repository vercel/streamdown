import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("chunked streaming scenarios", () => {
  it("should handle nested formatting cut mid-stream", () => {
    expect(parseIncompleteMarkdown("This is **bold with *ital")).toBe(
      "This is **bold with *ital*"
    );
    // When bold is unclosed, it gets closed first, then underscore
    expect(parseIncompleteMarkdown("**bold _und")).toBe("**bold _und**_");
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
});
