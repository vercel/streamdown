import { bench, describe } from "vitest";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";

describe("parseMarkdownIntoBlocks - Basic Parsing", () => {
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

  bench(
    "single block",
    () => {
      parseMarkdownIntoBlocks(singleBlock);
    },
    { iterations: 1000 }
  );

  bench(
    "multiple blocks (10)",
    () => {
      parseMarkdownIntoBlocks(multipleBlocks);
    },
    { iterations: 1000 }
  );

  bench(
    "many blocks (100)",
    () => {
      parseMarkdownIntoBlocks(manyBlocks);
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - Code Blocks", () => {
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

  bench(
    "single code block",
    () => {
      parseMarkdownIntoBlocks(singleCodeBlock);
    },
    { iterations: 1000 }
  );

  bench(
    "multiple code blocks",
    () => {
      parseMarkdownIntoBlocks(multipleCodeBlocks);
    },
    { iterations: 1000 }
  );

  bench(
    "large code block (1000 lines)",
    () => {
      parseMarkdownIntoBlocks(largeCodeBlock);
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - Math Blocks", () => {
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

  bench(
    "simple math block",
    () => {
      parseMarkdownIntoBlocks(simpleMath);
    },
    { iterations: 1000 }
  );

  bench(
    "complex math blocks",
    () => {
      parseMarkdownIntoBlocks(complexMath);
    },
    { iterations: 1000 }
  );

  bench(
    "math with split delimiters",
    () => {
      parseMarkdownIntoBlocks(mathWithSplitDelimiters);
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - HTML Blocks", () => {
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

  bench(
    "simple HTML block",
    () => {
      parseMarkdownIntoBlocks(simpleHTML);
    },
    { iterations: 1000 }
  );

  bench(
    "nested HTML block",
    () => {
      parseMarkdownIntoBlocks(nestedHTML);
    },
    { iterations: 1000 }
  );

  bench(
    "multiple HTML blocks",
    () => {
      parseMarkdownIntoBlocks(multipleHTMLBlocks);
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - Footnotes", () => {
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

  bench(
    "document with footnotes",
    () => {
      parseMarkdownIntoBlocks(withFootnotes);
    },
    { iterations: 1000 }
  );

  bench(
    "document with many footnotes",
    () => {
      parseMarkdownIntoBlocks(manyFootnotes);
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - Tables", () => {
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

  bench(
    "simple table",
    () => {
      parseMarkdownIntoBlocks(simpleTable);
    },
    { iterations: 1000 }
  );

  bench(
    "large table (100 rows)",
    () => {
      parseMarkdownIntoBlocks(largeTable);
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - Streaming Simulation", () => {
  const baseText = "# Heading\n\n";
  const streamingSteps = Array.from(
    { length: 50 },
    (_, i) => baseText + "This is streaming text. ".repeat(i)
  );

  bench(
    "streaming text (50 incremental steps)",
    () => {
      for (const step of streamingSteps) {
        parseMarkdownIntoBlocks(step);
      }
    },
    { iterations: 1000 }
  );

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

  bench(
    "streaming code block (9 steps)",
    () => {
      for (const step of codeStreamingSteps) {
        parseMarkdownIntoBlocks(step);
      }
    },
    { iterations: 1000 }
  );
});

describe("parseMarkdownIntoBlocks - Mixed Content", () => {
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

  bench(
    "realistic AI response",
    () => {
      parseMarkdownIntoBlocks(realistic);
    },
    { iterations: 1000 }
  );

  bench(
    "realistic AI response (10x)",
    () => {
      for (let i = 0; i < 10; i++) {
        parseMarkdownIntoBlocks(realistic);
      }
    },
    { iterations: 1000 }
  );
});
