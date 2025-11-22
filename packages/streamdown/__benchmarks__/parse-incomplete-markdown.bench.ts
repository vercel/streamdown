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

  bench(
    "short text with incomplete bold",
    () => {
      parseIncompleteMarkdown(shortText);
    },
    { iterations: 1000 }
  );

  bench(
    "medium text with mixed formatting",
    () => {
      parseIncompleteMarkdown(mediumText);
    },
    { iterations: 1000 }
  );

  bench(
    "long text with complex formatting",
    () => {
      parseIncompleteMarkdown(longText);
    },
    { iterations: 1000 }
  );
});

describe("parseIncompleteMarkdown - Incomplete Patterns", () => {
  bench(
    "incomplete bold (**)",
    () => {
      parseIncompleteMarkdown("Some text with **incomplete bold");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete italic (*)",
    () => {
      parseIncompleteMarkdown("Some text with *incomplete italic");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete italic (__)",
    () => {
      parseIncompleteMarkdown("Some text with __incomplete italic");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete inline code (`)",
    () => {
      parseIncompleteMarkdown("Some text with `incomplete code");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete strikethrough (~~)",
    () => {
      parseIncompleteMarkdown("Some text with ~~incomplete strikethrough");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete bold-italic (***)",
    () => {
      parseIncompleteMarkdown("Some text with ***incomplete bold-italic");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete link",
    () => {
      parseIncompleteMarkdown("Some text with [incomplete link](");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete link text",
    () => {
      parseIncompleteMarkdown("Some text with [incomplete");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete block math ($$)",
    () => {
      parseIncompleteMarkdown("$$\nE = mc^2\n");
    },
    { iterations: 1000 }
  );
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

  bench(
    "incomplete code block",
    () => {
      parseIncompleteMarkdown(incompleteCodeBlock);
    },
    { iterations: 1000 }
  );

  bench(
    "complete code block",
    () => {
      parseIncompleteMarkdown(completeCodeBlock);
    },
    { iterations: 1000 }
  );

  bench(
    "multiple code blocks (one incomplete)",
    () => {
      parseIncompleteMarkdown(multipleCodeBlocks);
    },
    { iterations: 1000 }
  );
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

  bench(
    "streaming bold text (10 steps)",
    () => {
      for (const step of streamingSteps) {
        parseIncompleteMarkdown(step);
      }
    },
    { iterations: 1000 }
  );

  const codeStreamingSteps = ["`", "`c", "`co", "`cod", "`code", "`code`"];

  bench(
    "streaming inline code (6 steps)",
    () => {
      for (const step of codeStreamingSteps) {
        parseIncompleteMarkdown(step);
      }
    },
    { iterations: 1000 }
  );
});

describe("parseIncompleteMarkdown - Edge Cases", () => {
  bench(
    "empty string",
    () => {
      parseIncompleteMarkdown("");
    },
    { iterations: 1000 }
  );

  bench(
    "plain text (no markdown)",
    () => {
      parseIncompleteMarkdown(
        "This is plain text without any markdown formatting."
      );
    },
    { iterations: 1000 }
  );

  bench(
    "text with many asterisks",
    () => {
      parseIncompleteMarkdown("****************************");
    },
    { iterations: 1000 }
  );

  bench(
    "text with mixed emphasis markers",
    () => {
      parseIncompleteMarkdown("**_*~`**_*~`**_*~`");
    },
    { iterations: 1000 }
  );

  bench(
    "list with emphasis",
    () => {
      parseIncompleteMarkdown("- **bold\n- *italic\n- `code");
    },
    { iterations: 1000 }
  );

  bench(
    "text with underscores in math",
    () => {
      parseIncompleteMarkdown("$x_1 + x_2 = x_");
    },
    { iterations: 1000 }
  );
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

  bench(
    "large document (realistic size)",
    () => {
      parseIncompleteMarkdown(largeDoc);
    },
    { iterations: 1000 }
  );

  bench(
    "very large document (2x realistic)",
    () => {
      parseIncompleteMarkdown(largeDoc + largeDoc);
    },
    { iterations: 1000 }
  );
});
