import { bench, describe } from "vitest";
import { parseMarkdownIntoBlocks } from "../packages/streamdown/lib/parse-blocks";
import { parseIncompleteMarkdown } from "../packages/streamdown/lib/parse-incomplete-markdown";
import { Lexer } from "marked";
import { fixtures } from "./fixtures";

describe("Parse Time: Streamdown vs Marked", () => {
  describe("Small Document", () => {
    const content = fixtures.small;

    bench("Streamdown: parseMarkdownIntoBlocks", () => {
      parseMarkdownIntoBlocks(content);
    });

    bench("Marked: Lexer.lex", () => {
      Lexer.lex(content, { gfm: true });
    });
  });

  describe("Medium Document", () => {
    const content = fixtures.medium;

    bench("Streamdown: parseMarkdownIntoBlocks", () => {
      parseMarkdownIntoBlocks(content);
    });

    bench("Marked: Lexer.lex", () => {
      Lexer.lex(content, { gfm: true });
    });
  });

  describe("Large Document", () => {
    const content = fixtures.large;

    bench("Streamdown: parseMarkdownIntoBlocks", () => {
      parseMarkdownIntoBlocks(content);
    });

    bench("Marked: Lexer.lex", () => {
      Lexer.lex(content, { gfm: true });
    });
  });

  describe("Code Heavy Document", () => {
    const content = fixtures.codeHeavy;

    bench("Streamdown: parseMarkdownIntoBlocks", () => {
      parseMarkdownIntoBlocks(content);
    });

    bench("Marked: Lexer.lex", () => {
      Lexer.lex(content, { gfm: true });
    });
  });
});

describe("Incomplete Markdown Parsing", () => {
  describe("Small Document", () => {
    const content = fixtures.small;

    bench("parseIncompleteMarkdown", () => {
      parseIncompleteMarkdown(content);
    });

    bench("no processing (baseline)", () => {
      // Baseline - just return the text
      content;
    });
  });

  describe("Streaming Document (with incomplete tokens)", () => {
    const content = fixtures.streaming;

    bench("parseIncompleteMarkdown", () => {
      parseIncompleteMarkdown(content);
    });

    bench("no processing (baseline)", () => {
      // Baseline - just return the text
      content;
    });
  });

  describe("Large Document", () => {
    const content = fixtures.large;

    bench("parseIncompleteMarkdown", () => {
      parseIncompleteMarkdown(content);
    });

    bench("no processing (baseline)", () => {
      // Baseline - just return the text
      content;
    });
  });
});

describe("Combined Parsing Pipeline", () => {
  describe("Small Document", () => {
    const content = fixtures.small;

    bench("Streamdown: full pipeline", () => {
      const parsed = parseIncompleteMarkdown(content);
      parseMarkdownIntoBlocks(parsed);
    });

    bench("Marked only", () => {
      Lexer.lex(content, { gfm: true });
    });
  });

  describe("Medium Document", () => {
    const content = fixtures.medium;

    bench("Streamdown: full pipeline", () => {
      const parsed = parseIncompleteMarkdown(content);
      parseMarkdownIntoBlocks(parsed);
    });

    bench("Marked only", () => {
      Lexer.lex(content, { gfm: true });
    });
  });

  describe("Large Document", () => {
    const content = fixtures.large;

    bench("Streamdown: full pipeline", () => {
      const parsed = parseIncompleteMarkdown(content);
      parseMarkdownIntoBlocks(parsed);
    });

    bench("Marked only", () => {
      Lexer.lex(content, { gfm: true });
    });
  });

  describe("Streaming Document", () => {
    const content = fixtures.streaming;

    bench("Streamdown: full pipeline", () => {
      const parsed = parseIncompleteMarkdown(content);
      parseMarkdownIntoBlocks(parsed);
    });

    bench("Marked only", () => {
      Lexer.lex(content, { gfm: true });
    });
  });
});
