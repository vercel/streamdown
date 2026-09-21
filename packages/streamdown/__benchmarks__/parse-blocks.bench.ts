import { test } from "vitest";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";

test("parseMarkdownIntoBlocks - Basic Parsing", async ({ bench }) => {
  const singleBlock = "# Heading\n\nThis is a paragraph.";
  const multipleBlocks = `
# Heading 1

This is paragraph 1.

## Heading 2

This is paragraph 2.

- List item 1
- List item 2

> Blockquote text
`;

  const manyBlocks = Array.from(
    { length: 100 },
    (_, i) => `## Section ${i}\n\nParagraph ${i}`
  ).join("\n\n");

  await bench("single block", () => {
    parseMarkdownIntoBlocks(singleBlock);
  }).run();

  await bench("multiple blocks (10)", () => {
    parseMarkdownIntoBlocks(multipleBlocks);
  }).run();

  await bench("many blocks (100)", () => {
    parseMarkdownIntoBlocks(manyBlocks);
  }).run();
});

test("parseMarkdownIntoBlocks - Code Blocks", async ({ bench }) => {
  const singleCodeBlock = `
Some text

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

More text
`;

  const multipleCodeBlocks = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
y = 2
\`\`\`

\`\`\`rust
let z = 3;
\`\`\`
`;

  const largeCodeBlock = `\`\`\`javascript\n${"const x = 1;\n".repeat(1000)}\`\`\``;

  await bench("single code block", () => {
    parseMarkdownIntoBlocks(singleCodeBlock);
  }).run();

  await bench("multiple code blocks", () => {
    parseMarkdownIntoBlocks(multipleCodeBlocks);
  }).run();

  await bench("large code block (1000 lines)", () => {
    parseMarkdownIntoBlocks(largeCodeBlock);
  }).run();
});

test("parseMarkdownIntoBlocks - Math Blocks", async ({ bench }) => {
  const simpleMath = `
Some text

$$
E = mc^2
$$

More text
`;

  const complexMath = `
$$
\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}
$$

Text

$$
\\int_0^\\infty x^2 dx
$$
`;

  const mathWithSplitDelimiters = `
Some text

$$

x^2 + y^2 = z^2

$$

More text
`;

  await bench("simple math block", () => {
    parseMarkdownIntoBlocks(simpleMath);
  }).run();

  await bench("complex math blocks", () => {
    parseMarkdownIntoBlocks(complexMath);
  }).run();

  await bench("math with split delimiters", () => {
    parseMarkdownIntoBlocks(mathWithSplitDelimiters);
  }).run();
});

test("parseMarkdownIntoBlocks - HTML Blocks", async ({ bench }) => {
  const simpleHTML = `
<div>
  <p>HTML content</p>
</div>
`;

  const nestedHTML = `
<div>
  <div>
    <div>
      <p>Nested content</p>
    </div>
  </div>
</div>
`;

  const multipleHTMLBlocks = `
<div>First block</div>

Some markdown

<section>
  <p>Second block</p>
</section>

More markdown
`;

  await bench("simple HTML block", () => {
    parseMarkdownIntoBlocks(simpleHTML);
  }).run();

  await bench("nested HTML block", () => {
    parseMarkdownIntoBlocks(nestedHTML);
  }).run();

  await bench("multiple HTML blocks", () => {
    parseMarkdownIntoBlocks(multipleHTMLBlocks);
  }).run();
});

test("parseMarkdownIntoBlocks - Footnotes", async ({ bench }) => {
  const withFootnotes = `
This is text with a footnote[^1].

Here's another footnote[^note].

[^1]: This is the first footnote.
[^note]: This is a named footnote.
`;

  const manyFootnotes = `
Text[^1] with[^2] many[^3] footnotes[^4].

${Array.from({ length: 10 }, (_, i) => `[^${i + 1}]: Footnote ${i + 1}`).join("\n")}
`;

  await bench("document with footnotes", () => {
    parseMarkdownIntoBlocks(withFootnotes);
  }).run();

  await bench("document with many footnotes", () => {
    parseMarkdownIntoBlocks(manyFootnotes);
  }).run();
});

test("parseMarkdownIntoBlocks - Tables", async ({ bench }) => {
  const simpleTable = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

  const largeTable = `
| H1 | H2 | H3 | H4 | H5 |
|----|----|----|----|-------|
${Array.from({ length: 100 }, (_, i) => `| C${i}1 | C${i}2 | C${i}3 | C${i}4 | C${i}5 |`).join("\n")}
`;

  await bench("simple table", () => {
    parseMarkdownIntoBlocks(simpleTable);
  }).run();

  await bench("large table (100 rows)", () => {
    parseMarkdownIntoBlocks(largeTable);
  }).run();
});

test("parseMarkdownIntoBlocks - Streaming Simulation", async ({ bench }) => {
  const baseText = "# Heading\n\n";
  const streamingSteps = Array.from(
    { length: 50 },
    (_, i) => baseText + "This is streaming text. ".repeat(i)
  );

  await bench("streaming text (50 incremental steps)", () => {
    for (const step of streamingSteps) {
      parseMarkdownIntoBlocks(step);
    }
  }).run();

  // A long document that keeps growing at the end, which is what a streamed
  // response looks like once it is a few hundred lines in.
  const longDocument = Array.from(
    { length: 100 },
    (_, i) => `## Section ${i}\n\nParagraph ${i} with some text.`
  ).join("\n\n");
  const longStreamingSteps = Array.from(
    { length: 30 },
    (_, i) => `${longDocument}\n\n${"More streamed text. ".repeat(i + 1)}`
  );

  await bench(
    "streaming text after a long document (30 incremental steps)",
    () => {
      for (const step of longStreamingSteps) {
        parseMarkdownIntoBlocks(step);
      }
    }
  ).run();

  const codeStreamingSteps = [
    "```javascript",
    "```javascript\n",
    "```javascript\nconst",
    "```javascript\nconst x",
    "```javascript\nconst x =",
    "```javascript\nconst x = 1",
    "```javascript\nconst x = 1;",
    "```javascript\nconst x = 1;\n",
    "```javascript\nconst x = 1;\n```",
  ];

  await bench("streaming code block (9 steps)", () => {
    for (const step of codeStreamingSteps) {
      parseMarkdownIntoBlocks(step);
    }
  }).run();
});

test("parseMarkdownIntoBlocks - Mixed Content", async ({ bench }) => {
  const realistic = `
# AI Response Example

Here's a comprehensive example of markdown content:

## Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  return { id, name: "John", email: "john@example.com" };
}
\`\`\`

## Math Formula

The quadratic formula is:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Lists and Tables

| Feature | Status |
|---------|--------|
| Bold    | ✓      |
| Italic  | ✓      |
| Code    | ✓      |

### Checklist

- [x] Implement parser
- [ ] Add tests
- [ ] Write docs

> **Note**: This is a blockquote with **bold** text.

For more info, see [documentation](https://example.com).
`;

  await bench("realistic AI response", () => {
    parseMarkdownIntoBlocks(realistic);
  }).run();

  await bench("realistic AI response (10x)", () => {
    for (let i = 0; i < 10; i++) {
      parseMarkdownIntoBlocks(realistic);
    }
  }).run();
});
