import { render } from "@testing-library/react";
import remend from "remend";
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
      remend(block);
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

    // Check that the LaTeX is processed
    const text = container.textContent || "";
    const hasMathContent = text.includes("x") && text.includes("y");
    expect(hasMathContent).toBe(true);

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

    // Check that the LaTeX is processed
    const text = container.textContent || "";
    const hasMathContent =
      (text.includes("x") && text.includes("y")) ||
      (text.includes("a") && text.includes("b"));
    expect(hasMathContent).toBe(true);
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

    // Check that the LaTeX is processed
    const text = container.textContent || "";
    const hasMathContent = text.includes("x") && text.includes("y");
    expect(hasMathContent).toBe(true);
  });
});
