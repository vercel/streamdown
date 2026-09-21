import { math } from "@streamdown/math";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { test } from "vitest";
import { Markdown } from "../lib/markdown";

test("Markdown - Basic Parsing", async ({ bench }) => {
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

  await bench("simple markdown", () => {
    Markdown({ children: simpleMarkdown });
  }).run();

  await bench("complex markdown", () => {
    Markdown({ children: complexMarkdown });
  }).run();
});

test("Markdown - Plugin Configurations", async ({ bench }) => {
  const markdown = "# Test\n\n**Bold** and *italic* with `code`.";

  await bench("no plugins", () => {
    Markdown({
      children: markdown,
      rehypePlugins: [],
      remarkPlugins: [],
    });
  }).run();

  await bench("with remark-gfm", () => {
    Markdown({
      children: markdown,
      remarkPlugins: [remarkGfm],
    });
  }).run();

  await bench("with all common plugins", () => {
    Markdown({
      children: markdown,
      rehypePlugins: [rehypeRaw, math.rehypePlugin],
      remarkPlugins: [remarkGfm, math.remarkPlugin],
    });
  }).run();
});

test("Markdown - GFM Features", async ({ bench }) => {
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

  await bench("table parsing", () => {
    Markdown({
      children: table,
      remarkPlugins: [remarkGfm],
    });
  }).run();

  await bench("strikethrough parsing", () => {
    Markdown({
      children: strikethrough,
      remarkPlugins: [remarkGfm],
    });
  }).run();

  await bench("task list parsing", () => {
    Markdown({
      children: taskList,
      remarkPlugins: [remarkGfm],
    });
  }).run();

  await bench("autolink parsing", () => {
    Markdown({
      children: autolink,
      remarkPlugins: [remarkGfm],
    });
  }).run();
});

test("Markdown - Math Rendering", async ({ bench }) => {
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

  await bench("inline math", () => {
    Markdown({
      children: inlineMath,
      remarkPlugins: [math.remarkPlugin],
      rehypePlugins: [math.rehypePlugin],
    });
  }).run();

  await bench("block math", () => {
    Markdown({
      children: blockMath,
      remarkPlugins: [math.remarkPlugin],
      rehypePlugins: [math.rehypePlugin],
    });
  }).run();

  await bench("complex math", () => {
    Markdown({
      children: complexMath,
      remarkPlugins: [math.remarkPlugin],
      rehypePlugins: [math.rehypePlugin],
    });
  }).run();
});

test("Markdown - Processor Caching", async ({ bench }) => {
  const markdown = "# Test\n\nSome content with **bold** text.";
  const plugins = [remarkGfm, math.remarkPlugin];

  await bench("first parse (cache miss)", () => {
    Markdown({
      children: markdown,
      remarkPlugins: plugins,
    });
  }).run();

  // Warm up cache
  Markdown({ children: markdown, remarkPlugins: plugins });

  await bench("subsequent parse (cache hit)", () => {
    Markdown({
      children: markdown,
      remarkPlugins: plugins,
    });
  }).run();

  await bench("different content, same plugins (cache hit)", () => {
    Markdown({
      children: "Different **content**",
      remarkPlugins: plugins,
    });
  }).run();
});

test("Markdown - Content Size", async ({ bench }) => {
  const small = "# Small\n\nJust a paragraph.";
  const medium = `
# Medium Document

${"## Section\n\nParagraph with **bold** and *italic* text.\n\n".repeat(10)}
`;
  const large = `
# Large Document

${"## Section\n\nParagraph with **bold** and *italic* text.\n\n".repeat(100)}
`;

  await bench("small content", () => {
    Markdown({ children: small });
  }).run();

  await bench("medium content", () => {
    Markdown({ children: medium });
  }).run();

  await bench("large content", () => {
    Markdown({ children: large });
  }).run();
});

test("Markdown - HTML Raw Content", async ({ bench }) => {
  const simpleHTML = "<div>Simple HTML</div>";
  const complexHTML = `
<div class="container">
  <section>
    <h2>Title</h2>
    <p>Paragraph with <strong>bold</strong> text.</p>
  </section>
</div>
`;

  await bench("simple HTML", () => {
    Markdown({
      children: simpleHTML,
      rehypePlugins: [rehypeRaw],
    });
  }).run();

  await bench("complex HTML", () => {
    Markdown({
      children: complexHTML,
      rehypePlugins: [rehypeRaw],
    });
  }).run();
});

test("Markdown - Lists", async ({ bench }) => {
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

  await bench("simple list", () => {
    Markdown({ children: simpleList });
  }).run();

  await bench("nested list", () => {
    Markdown({ children: nestedList });
  }).run();

  await bench("long list (100 items)", () => {
    Markdown({ children: longList });
  }).run();
});

test("Markdown - Links and Images", async ({ bench }) => {
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

  await bench("multiple links", () => {
    Markdown({ children: links });
  }).run();

  await bench("multiple images", () => {
    Markdown({ children: images });
  }).run();

  await bench("mixed links and images", () => {
    Markdown({ children: mixed });
  }).run();
});
