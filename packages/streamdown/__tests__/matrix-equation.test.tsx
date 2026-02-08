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
    // Check for math rendering - either as KaTeX symbols or LaTeX source
    const text = container.textContent || "";

    // Should contain matrix numbers
    const hasMatrixNumbers = text.includes("1") && text.includes("9");

    // Should contain variables
    const hasVariables = text.includes("x") && text.includes("a");

    // Should contain either rendered symbols or LaTeX commands
    const hasMatrixIndicator =
      text.includes("[") || // Matrix brackets
      text.includes("bmatrix") || // LaTeX command
      text.includes("begin"); // LaTeX environment start

    const hasMathContent =
      hasMatrixNumbers && hasVariables && hasMatrixIndicator;

    // The math content should be rendered (even if not as full KaTeX in test environment)
    expect(hasMathContent).toBe(true);
  });

  it("should keep math block intact when preceded by text (#194)", () => {
    const content = `For example:
$$
A \\vec{v} =
\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}
\\begin{pmatrix} 5 \\\\ 6 \\end{pmatrix}
=
\\begin{pmatrix} 1 \\times 5 + 2 \\times 6 \\\\ 3 \\times 5 + 4 \\times 6 \\end{pmatrix}
=
\\begin{pmatrix} 17 \\\\ 39 \\end{pmatrix}
$$`;

    // The = on its own line causes marked to split this into multiple tokens.
    // The merge logic should reassemble them into a single block.
    const blocks = parseMarkdownIntoBlocks(content);

    // Should be a single block (text + math together)
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("$$");
    expect(blocks[0]).toContain("pmatrix");
  });

  it("should keep multiple math blocks intact when preceded by text (#194)", () => {
    const content = `### 3. **Matrix-Vector Multiplication**

For example:
$$
A \\vec{v} =
\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}
\\begin{pmatrix} 5 \\\\ 6 \\end{pmatrix}
=
\\begin{pmatrix} 1 \\times 5 + 2 \\times 6 \\\\ 3 \\times 5 + 4 \\times 6 \\end{pmatrix}
=
\\begin{pmatrix} 17 \\\\ 39 \\end{pmatrix}
$$

---

### 4. **System of Linear Equations**

Example:
$$
\\begin{cases}
2x + y = 5 \\\\
x + 3y = 7
\\end{cases}
$$

In matrix form:
$$
\\begin{pmatrix}
2 & 1 \\\\
1 & 3
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
5 \\\\
7
\\end{pmatrix}
$$

---`;

    const blocks = parseMarkdownIntoBlocks(content);

    // Each math block should contain both opening and closing $$
    const mathBlocks = blocks.filter((b) => b.includes("$$"));
    for (const block of mathBlocks) {
      const dollarCount = (block.match(/\$\$/g) || []).length;
      expect(dollarCount % 2).toBe(0);
    }
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
