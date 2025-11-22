import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { bench, describe } from "vitest";
import { Markdown } from "../lib/markdown";

describe("Markdown - Basic Parsing", () => {
  const simpleMarkdown =
    "# Heading\n\nThis is a paragraph with **bold** and *italic* text.";
  const complexMarkdown = `
# Document

## Section 1

This has **bold**, *italic*, and \`code\`.

- List item 1
- List item 2
  - Nested item

> Blockquote

### Subsection

[Link](https://example.com)
`;

  bench("simple markdown", () => {
    Markdown({ children: simpleMarkdown });
  });

  bench("complex markdown", () => {
    Markdown({ children: complexMarkdown });
  });
});

describe("Markdown - Plugin Configurations", () => {
  const markdown = "# Test\n\n**Bold** and *italic* with `code`.";

  bench("no plugins", () => {
    Markdown({
      children: markdown,
      rehypePlugins: [],
      remarkPlugins: [],
    });
  });

  bench("with remark-gfm", () => {
    Markdown({
      children: markdown,
      remarkPlugins: [remarkGfm],
    });
  });

  bench("with all common plugins", () => {
    Markdown({
      children: markdown,
      rehypePlugins: [rehypeRaw, rehypeKatex],
      remarkPlugins: [remarkGfm, remarkMath],
    });
  });
});

describe("Markdown - GFM Features", () => {
  const table = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;

  const strikethrough = "This has ~~strikethrough~~ text.";

  const taskList = `
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
`;

  const autolink = "Check out https://example.com for more info.";

  bench("table parsing", () => {
    Markdown({
      children: table,
      remarkPlugins: [remarkGfm],
    });
  });

  bench("strikethrough parsing", () => {
    Markdown({
      children: strikethrough,
      remarkPlugins: [remarkGfm],
    });
  });

  bench("task list parsing", () => {
    Markdown({
      children: taskList,
      remarkPlugins: [remarkGfm],
    });
  });

  bench("autolink parsing", () => {
    Markdown({
      children: autolink,
      remarkPlugins: [remarkGfm],
    });
  });
});

describe("Markdown - Math Rendering", () => {
  const inlineMath = "The equation $E = mc^2$ is famous.";
  const blockMath = `
$$
\\int_0^\\infty x^2 dx = \\frac{1}{3}x^3
$$
`;

  const complexMath = `
$$
\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}
$$
`;

  bench("inline math", () => {
    Markdown({
      children: inlineMath,
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
  });

  bench("block math", () => {
    Markdown({
      children: blockMath,
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
  });

  bench("complex math", () => {
    Markdown({
      children: complexMath,
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
  });
});

describe("Markdown - Processor Caching", () => {
  const markdown = "# Test\n\nSome content with **bold** text.";
  const plugins = [remarkGfm, remarkMath];

  bench("first parse (cache miss)", () => {
    Markdown({
      children: markdown,
      remarkPlugins: plugins,
    });
  });

  // Warm up cache
  Markdown({ children: markdown, remarkPlugins: plugins });

  bench("subsequent parse (cache hit)", () => {
    Markdown({
      children: markdown,
      remarkPlugins: plugins,
    });
  });

  bench("different content, same plugins (cache hit)", () => {
    Markdown({
      children: "Different **content**",
      remarkPlugins: plugins,
    });
  });
});

describe("Markdown - Content Size", () => {
  const small = "# Small\n\nJust a paragraph.";
  const medium = `
# Medium Document

${"## Section\n\nParagraph with **bold** and *italic* text.\n\n".repeat(10)}
`;
  const large = `
# Large Document

${"## Section\n\nParagraph with **bold** and *italic* text.\n\n".repeat(100)}
`;

  bench("small content", () => {
    Markdown({ children: small });
  });

  bench("medium content", () => {
    Markdown({ children: medium });
  });

  bench("large content", () => {
    Markdown({ children: large });
  });
});

describe("Markdown - HTML Raw Content", () => {
  const simpleHTML = "<div>Simple HTML</div>";
  const complexHTML = `
<div class="container">
  <section>
    <h2>Title</h2>
    <p>Paragraph with <strong>bold</strong> text.</p>
  </section>
</div>
`;

  bench("simple HTML", () => {
    Markdown({
      children: simpleHTML,
      rehypePlugins: [rehypeRaw],
    });
  });

  bench("complex HTML", () => {
    Markdown({
      children: complexHTML,
      rehypePlugins: [rehypeRaw],
    });
  });
});

describe("Markdown - Lists", () => {
  const simpleList = `
- Item 1
- Item 2
- Item 3
`;

  const nestedList = `
- Level 1 Item 1
  - Level 2 Item 1
    - Level 3 Item 1
  - Level 2 Item 2
- Level 1 Item 2
`;

  const longList = Array.from(
    { length: 100 },
    (_, i) => `- Item ${i + 1}`
  ).join("\n");

  bench("simple list", () => {
    Markdown({ children: simpleList });
  });

  bench("nested list", () => {
    Markdown({ children: nestedList });
  });

  bench("long list (100 items)", () => {
    Markdown({ children: longList });
  });
});

describe("Markdown - Links and Images", () => {
  const links = `
[Link 1](https://example.com)
[Link 2](https://example.org)
[Link 3](https://example.net)
`;

  const images = `
![Alt 1](https://example.com/img1.png)
![Alt 2](https://example.com/img2.jpg)
`;

  const mixed = `
Here's a [link](https://example.com) and an image:

![Example](https://example.com/img.png)

And another [link](https://example.org).
`;

  bench("multiple links", () => {
    Markdown({ children: links });
  });

  bench("multiple images", () => {
    Markdown({ children: images });
  });

  bench("mixed links and images", () => {
    Markdown({ children: mixed });
  });
});
