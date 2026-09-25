import { test } from "vitest";
import remend from "../src";

test("Basic Formatting", async ({ bench }) => {
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

  await bench("short text with incomplete bold", () => {
    remend(shortText);
  }).run();

  await bench("medium text with mixed formatting", () => {
    remend(mediumText);
  }).run();

  await bench("long text with complex formatting", () => {
    remend(longText);
  }).run();
});

test("Incomplete Patterns", async ({ bench }) => {
  await bench("incomplete bold (**)", () => {
    remend("Some text with **incomplete bold");
  }).run();

  await bench("incomplete italic (*)", () => {
    remend("Some text with *incomplete italic");
  }).run();

  await bench("incomplete italic (__)", () => {
    remend("Some text with __incomplete italic");
  }).run();

  await bench("incomplete inline code (`)", () => {
    remend("Some text with `incomplete code");
  }).run();

  await bench("incomplete strikethrough (~~)", () => {
    remend("Some text with ~~incomplete strikethrough");
  }).run();

  await bench("incomplete bold-italic (***)", () => {
    remend("Some text with ***incomplete bold-italic");
  }).run();

  await bench("incomplete link", () => {
    remend("Some text with [incomplete link](");
  }).run();

  await bench("incomplete link text", () => {
    remend("Some text with [incomplete");
  }).run();

  await bench("incomplete block math ($$)", () => {
    remend("$$\nE = mc^2\n");
  }).run();
});

test("Code Blocks", async ({ bench }) => {
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

  await bench("incomplete code block", () => {
    remend(incompleteCodeBlock);
  }).run();

  await bench("complete code block", () => {
    remend(completeCodeBlock);
  }).run();

  await bench("multiple code blocks (one incomplete)", () => {
    remend(multipleCodeBlocks);
  }).run();
});

test("Streaming Simulation", async ({ bench }) => {
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

  await bench("streaming bold text (10 steps)", () => {
    for (const step of streamingSteps) {
      remend(step);
    }
  }).run();

  const codeStreamingSteps = ["`", "`c", "`co", "`cod", "`code", "`code`"];

  await bench("streaming inline code (6 steps)", () => {
    for (const step of codeStreamingSteps) {
      remend(step);
    }
  }).run();
});

test("Edge Cases", async ({ bench }) => {
  await bench("empty string", () => {
    remend("");
  }).run();

  await bench("plain text (no markdown)", () => {
    remend("This is plain text without any markdown formatting.");
  }).run();

  await bench("text with many asterisks", () => {
    remend("****************************");
  }).run();

  await bench("text with mixed emphasis markers", () => {
    remend("**_*~`**_*~`**_*~`");
  }).run();

  await bench("list with emphasis", () => {
    remend("- **bold\n- *italic\n- `code");
  }).run();

  await bench("text with underscores in math", () => {
    remend("$x_1 + x_2 = x_");
  }).run();
});

test("Large Documents", async ({ bench }) => {
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

  await bench("large document (realistic size)", () => {
    remend(largeDoc);
  }).run();

  await bench("very large document (2x realistic)", () => {
    remend(largeDoc + largeDoc);
  }).run();
});

test("Streamed Code Blocks", async ({ bench }) => {
  // An unclosed fence full of brackets is the pathological case for the
  // code-block scan: every "[" probes isInsideCodeBlock, which previously
  // rescanned the whole prefix per probe (quadratic overall).
  const bracketHeavyLine =
    "const x = arr[i]; if (map[key]) { list[j] = grid[a][b]; }\n";
  const streamingCodeBlock = `\`\`\`ts\n${bracketHeavyLine.repeat(1000)}`;

  await bench("unclosed bracket-heavy code block (58k chars)", () => {
    remend(streamingCodeBlock);
  }).run();
});

test("Long Streamed Documents", async ({ bench }) => {
  // Streamdown runs remend over the whole accumulated response on every
  // token, so the cost on a long response is paid per token. Emphasis
  // markers are the pathological case for the math-context check: every
  // "*" and "_" probed isWithinMathBlock, which previously rescanned the
  // whole prefix per probe (quadratic overall).
  const section = (i: number) =>
    `## Section ${i}

Some **bold** and *italic* text with \`code\` and a [link](https://example.com/${i}).
Prices like 20~25 and a > b in lists:

- item > 25
- another _emph_ item

\`\`\`js
const x = ${i};
\`\`\`

`;
  const longResponse = Array.from({ length: 400 }, (_, i) => section(i)).join(
    ""
  );
  const longResponseWithMath = `${longResponse}Inline $x_1$ and block:\n\n$$\nE = mc^2\n$$\n`;

  await bench("400-section response (80k chars)", () => {
    remend(longResponse);
  }).run();

  await bench("400-section response with math (80k chars)", () => {
    remend(longResponseWithMath);
  }).run();
});
