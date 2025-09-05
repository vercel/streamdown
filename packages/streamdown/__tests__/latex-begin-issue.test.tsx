import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";
import { parseIncompleteMarkdown } from "../lib/parse-incomplete-markdown";

describe("LaTeX \\begin block issue #54", () => {
  it("should correctly process blocks when split by marked lexer", () => {
    const content = `$$
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
$$`;

    // Test how marked splits this content
    const blocks = parseMarkdownIntoBlocks(content);
    console.log("Blocks:", blocks);

    // Test parseIncompleteMarkdown on each block
    blocks.forEach((block, i) => {
      const parsed = parseIncompleteMarkdown(block);
      console.log(`Block ${i} original:`, JSON.stringify(block));
      console.log(`Block ${i} parsed:`, JSON.stringify(parsed));
    });
  });

  it("should handle incomplete LaTeX block with \\begin without adding extra $$", () => {
    const content = `$$
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
$$`;

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    // Check that the LaTeX is rendered correctly
    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThan(0);

    // Check the text content doesn't have extra $$ appended
    const htmlContent = container.innerHTML;
    console.log("HTML content:", htmlContent);

    // Should not contain $$$$ (four dollar signs in a row)
    expect(htmlContent).not.toContain("$$$$");
  });

  it("should handle complete LaTeX block with \\begin", () => {
    const content = `$$
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
= 
\\begin{pmatrix}
a \\\\
b
\\end{pmatrix}
$$`;

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    // Check that the LaTeX is rendered correctly
    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThan(0);
  });

  it("should handle incomplete LaTeX block ending with equals sign", () => {
    const content = `$$
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=`;

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    // Should close the incomplete block with $$
    const htmlContent = container.innerHTML;
    console.log("Incomplete block HTML:", htmlContent);

    // Check that the LaTeX is rendered
    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThan(0);
  });
});
