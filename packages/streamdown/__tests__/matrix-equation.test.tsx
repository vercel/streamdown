import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";
import { parseIncompleteMarkdown } from "../lib/parse-incomplete-markdown";

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
    console.log("Number of blocks:", blocks.length);
    blocks.forEach((block, i) => {
      console.log(`Block ${i}:`, JSON.stringify(block));
      const parsed = parseIncompleteMarkdown(block);
      console.log(`Block ${i} after parsing:`, JSON.stringify(parsed));
    });

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    // Check that the LaTeX is rendered correctly
    const katexElements = container.querySelectorAll(".katex");
    const katexErrors = container.querySelectorAll(".katex-error");

    console.log("HTML output:", container.innerHTML);
    console.log("KaTeX elements found:", katexElements.length);
    console.log("KaTeX errors found:", katexErrors.length);

    if (katexErrors.length > 0) {
      katexErrors.forEach((error) => {
        console.log("Error:", error.getAttribute("title"));
        console.log("Error content:", error.textContent);
      });
    }

    expect(katexElements.length).toBeGreaterThan(0);
    expect(katexErrors.length).toBe(0);
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

    const blocks = parseMarkdownIntoBlocks(content);
    console.log("Incomplete - Number of blocks:", blocks.length);

    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThan(0);
  });
});
