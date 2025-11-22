import { bench, describe } from "vitest";
import { parseIncompleteMarkdown } from "../lib/parse-incomplete-markdown";

describe("parseIncompleteMarkdown - Basic Formatting", () => {
  const shortText = "This is **bold text";
  const mediumText =
    "# Heading\n\nThis is **bold** and *italic* text with `code` and ~~strikethrough~~";
  const longText = `
# Complex Document

This document contains **bold**, *italic*, and ***bold-italic*** text.
It also has \`inline code\` and ~~strikethrough~~ formatting.

Here's a [link](https://example.com) and an incomplete link [text](

## Math Support

Inline math: $E = mc^2$ and block math:

$$
\\int_0^\\infty x^2 dx
`;

  bench("short text with incomplete bold", () => {
    parseIncompleteMarkdown(shortText);
  });

  bench("medium text with mixed formatting", () => {
    parseIncompleteMarkdown(mediumText);
  });

  bench("long text with complex formatting", () => {
    parseIncompleteMarkdown(longText);
  });
});

describe("parseIncompleteMarkdown - Incomplete Patterns", () => {
  bench("incomplete bold (**)", () => {
    parseIncompleteMarkdown("Some text with **incomplete bold");
  });

  bench("incomplete italic (*)", () => {
    parseIncompleteMarkdown("Some text with *incomplete italic");
  });

  bench("incomplete italic (__)", () => {
    parseIncompleteMarkdown("Some text with __incomplete italic");
  });

  bench("incomplete inline code (`)", () => {
    parseIncompleteMarkdown("Some text with `incomplete code");
  });

  bench("incomplete strikethrough (~~)", () => {
    parseIncompleteMarkdown("Some text with ~~incomplete strikethrough");
  });

  bench("incomplete bold-italic (***)", () => {
    parseIncompleteMarkdown("Some text with ***incomplete bold-italic");
  });

  bench("incomplete link", () => {
    parseIncompleteMarkdown("Some text with [incomplete link](");
  });

  bench("incomplete link text", () => {
    parseIncompleteMarkdown("Some text with [incomplete");
  });

  bench("incomplete block math ($$)", () => {
    parseIncompleteMarkdown("$$\nE = mc^2\n");
  });
});

describe("parseIncompleteMarkdown - Code Blocks", () => {
  const incompleteCodeBlock = "```javascript\nconst x = 1;\n";
  const completeCodeBlock = "```javascript\nconst x = 1;\n```";
  const multipleCodeBlocks = `
\`\`\`javascript
const x = 1;
\`\`\`

Some text

\`\`\`python
y = 2
`;

  bench("incomplete code block", () => {
    parseIncompleteMarkdown(incompleteCodeBlock);
  });

  bench("complete code block", () => {
    parseIncompleteMarkdown(completeCodeBlock);
  });

  bench("multiple code blocks (one incomplete)", () => {
    parseIncompleteMarkdown(multipleCodeBlocks);
  });
});

describe("parseIncompleteMarkdown - Streaming Simulation", () => {
  const streamingSteps = [
    "**",
    "**B",
    "**Bo",
    "**Bol",
    "**Bold",
    "**Bold ",
    "**Bold t",
    "**Bold te",
    "**Bold tex",
    "**Bold text",
  ];

  bench("streaming bold text (10 steps)", () => {
    for (const step of streamingSteps) {
      parseIncompleteMarkdown(step);
    }
  });

  const codeStreamingSteps = ["`", "`c", "`co", "`cod", "`code", "`code`"];

  bench("streaming inline code (6 steps)", () => {
    for (const step of codeStreamingSteps) {
      parseIncompleteMarkdown(step);
    }
  });
});

describe("parseIncompleteMarkdown - Edge Cases", () => {
  bench("empty string", () => {
    parseIncompleteMarkdown("");
  });

  bench("plain text (no markdown)", () => {
    parseIncompleteMarkdown(
      "This is plain text without any markdown formatting."
    );
  });

  bench("text with many asterisks", () => {
    parseIncompleteMarkdown("****************************");
  });

  bench("text with mixed emphasis markers", () => {
    parseIncompleteMarkdown("**_*~`**_*~`**_*~`");
  });

  bench("list with emphasis", () => {
    parseIncompleteMarkdown("- **bold\n- *italic\n- `code");
  });

  bench("text with underscores in math", () => {
    parseIncompleteMarkdown("$x_1 + x_2 = x_");
  });
});

describe("parseIncompleteMarkdown - Large Documents", () => {
  const largeDoc = `
# Large Document Benchmark

${"## Section\n\nThis is a paragraph with **bold**, *italic*, and `code` formatting.\n\n".repeat(50)}

## Code Section

\`\`\`javascript
${"const x = 1;\n".repeat(100)}
\`\`\`

## More Content

${"Regular paragraph text with some [links](https://example.com) and more content.\n\n".repeat(50)}
`;

  bench("large document (realistic size)", () => {
    parseIncompleteMarkdown(largeDoc);
  });

  bench("very large document (2x realistic)", () => {
    parseIncompleteMarkdown(largeDoc + largeDoc);
  });
});
