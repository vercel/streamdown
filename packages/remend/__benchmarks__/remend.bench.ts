import { bench, describe } from "vitest";
import remend from "../src";

describe("Basic Formatting", () => {
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
      remend(shortText);
    },
    { iterations: 1000 }
  );

  bench(
    "medium text with mixed formatting",
    () => {
      remend(mediumText);
    },
    { iterations: 1000 }
  );

  bench(
    "long text with complex formatting",
    () => {
      remend(longText);
    },
    { iterations: 1000 }
  );
});

describe("Incomplete Patterns", () => {
  bench(
    "incomplete bold (**)",
    () => {
      remend("Some text with **incomplete bold");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete italic (*)",
    () => {
      remend("Some text with *incomplete italic");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete italic (__)",
    () => {
      remend("Some text with __incomplete italic");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete inline code (`)",
    () => {
      remend("Some text with `incomplete code");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete strikethrough (~~)",
    () => {
      remend("Some text with ~~incomplete strikethrough");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete bold-italic (***)",
    () => {
      remend("Some text with ***incomplete bold-italic");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete link",
    () => {
      remend("Some text with [incomplete link](");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete link text",
    () => {
      remend("Some text with [incomplete");
    },
    { iterations: 1000 }
  );

  bench(
    "incomplete block math ($$)",
    () => {
      remend("$$\nE = mc^2\n");
    },
    { iterations: 1000 }
  );
});

describe("Code Blocks", () => {
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
      remend(incompleteCodeBlock);
    },
    { iterations: 1000 }
  );

  bench(
    "complete code block",
    () => {
      remend(completeCodeBlock);
    },
    { iterations: 1000 }
  );

  bench(
    "multiple code blocks (one incomplete)",
    () => {
      remend(multipleCodeBlocks);
    },
    { iterations: 1000 }
  );
});

describe("Streaming Simulation", () => {
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
        remend(step);
      }
    },
    { iterations: 1000 }
  );

  const codeStreamingSteps = ["`", "`c", "`co", "`cod", "`code", "`code`"];

  bench(
    "streaming inline code (6 steps)",
    () => {
      for (const step of codeStreamingSteps) {
        remend(step);
      }
    },
    { iterations: 1000 }
  );
});

describe("Edge Cases", () => {
  bench(
    "empty string",
    () => {
      remend("");
    },
    { iterations: 1000 }
  );

  bench(
    "plain text (no markdown)",
    () => {
      remend("This is plain text without any markdown formatting.");
    },
    { iterations: 1000 }
  );

  bench(
    "text with many asterisks",
    () => {
      remend("****************************");
    },
    { iterations: 1000 }
  );

  bench(
    "text with mixed emphasis markers",
    () => {
      remend("**_*~`**_*~`**_*~`");
    },
    { iterations: 1000 }
  );

  bench(
    "list with emphasis",
    () => {
      remend("- **bold\n- *italic\n- `code");
    },
    { iterations: 1000 }
  );

  bench(
    "text with underscores in math",
    () => {
      remend("$x_1 + x_2 = x_");
    },
    { iterations: 1000 }
  );
});

describe("Large Documents", () => {
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
      remend(largeDoc);
    },
    { iterations: 1000 }
  );

  bench(
    "very large document (2x realistic)",
    () => {
      remend(largeDoc + largeDoc);
    },
    { iterations: 1000 }
  );
});

describe("Streamed Code Blocks", () => {
  // An unclosed fence full of brackets is the pathological case for the
  // code-block scan: every "[" probes isInsideCodeBlock, which previously
  // rescanned the whole prefix per probe (quadratic overall).
  const bracketHeavyLine =
    "const x = arr[i]; if (map[key]) { list[j] = grid[a][b]; }\n";
  const streamingCodeBlock = `\`\`\`ts\n${bracketHeavyLine.repeat(1000)}`;

  bench(
    "unclosed bracket-heavy code block (58k chars)",
    () => {
      remend(streamingCodeBlock);
    },
    { iterations: 10 }
  );
});

// Delimiter-heavy input at doubling sizes. Cost should grow in proportion to
// input size: a doubling that more than doubles the time signals a
// superlinear rescan in a handler.
describe("Scaling", () => {
  const unit =
    "word snake__case text __bold__ and _it_ plus `code` *star* ~~del~~ ".repeat(
      30
    );
  const sizes = [1, 2, 4, 8] as const;

  for (const mult of sizes) {
    const doc = `${unit.repeat(mult)}__open`;
    bench(
      `delimiter-heavy ${doc.length} chars`,
      () => {
        remend(doc);
      },
      { iterations: 200 }
    );
  }
});

// Bare URLs build the literal autolink mask; prose without :// or www. skips
// it entirely.
describe("Bare URLs", () => {
  const urlParagraph =
    "Static files live at https://example.com/_next/static/chunks/main.js and the " +
    "package entry is https://github.com/python/cpython/blob/main/Lib/__init__.py, " +
    "while www.example.com/docs/*/items lists the routes and **bold** stays bold.\n\n";
  const urlMessage = `${urlParagraph.repeat(20)}Finally see https://example.com/__in`;
  const proseMessage = `${"This is a long paragraph of chat prose with **bold**, *italic* and snake_case words but no links at all.\n\n".repeat(30)}And **an open`;
  const linksAndBold = `${"Read [the docs](https://example.com/_a) and https://example.com/_b then **more\n\n".repeat(20)}**open`;
  const streamed = `${urlParagraph.repeat(30)}`.slice(0, 8000);
  const prefixes: string[] = [];
  for (let i = 1; i <= streamed.length; i += 1) {
    prefixes.push(streamed.slice(0, i));
  }

  bench(
    `chat message with many bare URLs (${urlMessage.length} chars)`,
    () => {
      remend(urlMessage);
    },
    { iterations: 200 }
  );

  bench(
    `long prose without URLs (${proseMessage.length} chars)`,
    () => {
      remend(proseMessage);
    },
    { iterations: 200 }
  );

  bench(
    `links, bare URLs and open bold (${linksAndBold.length} chars)`,
    () => {
      remend(linksAndBold);
    },
    { iterations: 200 }
  );

  bench(
    `streaming every prefix of a ${streamed.length}-char message with URLs`,
    () => {
      for (const prefix of prefixes) {
        remend(prefix);
      }
    },
    { iterations: 3 }
  );
});
