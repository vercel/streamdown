import { math } from "@streamdown/math";
import { render } from "@testing-library/react";
import remend from "remend";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";

describe("Matrix equation rendering", () => {
  it("should render complete matrix equation properly", () => {
    const content = `$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9
\\end{bmatrix}
\\cdot
\\begin{bmatrix}
x \\\\
y \\\\
z
\\end{bmatrix}
=
\\begin{bmatrix}
a \\\\
b \\\\
c
\\end{bmatrix}
$$`;

    // Check how the content is split into blocks
    const blocks = parseMarkdownIntoBlocks(content);
    for (const block of blocks) {
      remend(block);
    }

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true} plugins={{ math }}>
        {content}
      </Streamdown>
    );

    // Check that the LaTeX is rendered correctly
    // Check for math rendering - either as KaTeX or as text content
    const text = container.textContent || "";
    const hasMatrixBrackets = text.includes("[") && text.includes("]");
    const hasMultiplicationSymbol = text.includes("⋅") || text.includes("cdot");
    const hasMathContent = hasMatrixBrackets && hasMultiplicationSymbol;

    // The math content should be rendered (even if not as full KaTeX in test environment)
    expect(hasMathContent).toBe(true);
  });

  it("should handle matrix equation without closing $$", () => {
    const content = `$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9
\\end{bmatrix}
\\cdot
\\begin{bmatrix}
x \\\\
y \\\\
z
\\end{bmatrix}
=
\\begin{bmatrix}
a \\\\
b \\\\
c
\\end{bmatrix}`;

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true} plugins={{ math }}>
        {content}
      </Streamdown>
    );

    // Check for math rendering - either as KaTeX or as text content
    const text = container.textContent || "";
    const hasMatrixBrackets = text.includes("[") && text.includes("]");
    const hasMathContent = hasMatrixBrackets || text.includes("bmatrix");

    // The math content should be rendered (even if not as full KaTeX in test environment)
    expect(hasMathContent).toBe(true);
  });
});
