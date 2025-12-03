import { render } from "@testing-library/react";
import { parseIncompleteMarkdown } from "remend";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";

describe("LaTeX \\begin block (#54)", () => {
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

    // Test parseIncompleteMarkdown on each block
    for (const block of blocks) {
      parseIncompleteMarkdown(block);
    }
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

    // Check that the LaTeX is rendered
    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThan(0);
  });
});
