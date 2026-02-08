import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseMarkdownIntoBlocks, Streamdown } from "../index";

describe("Dollar sign handling", () => {
  it("should not render dollar amounts as math", () => {
    const content = "$20 is a sum that isn't larger than a few dollars";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Check if content is incorrectly wrapped in math elements
    const katexElements = container.querySelectorAll(".katex");

    // The text should be rendered as plain text, not math
    expect(katexElements.length).toBe(0);

    // Check that the dollar signs are preserved in the text
    const text = container.textContent;
    expect(text).toContain("$20");
    expect(text).toContain("dollars");
  });

  it("should handle multiple dollar signs in text", () => {
    const content = "The price is $50 and the discount is $10 off";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBe(0);

    // Check that both dollar amounts are preserved
    const text = container.textContent;
    expect(text).toContain("$50");
    expect(text).toContain("$10");
  });

  it("should handle single dollar sign at end of text", () => {
    const content = "The cost is $";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBe(0);

    // Check that the single dollar sign is preserved without adding a trailing one
    const text = container.textContent;
    expect(text).toBe("The cost is $");
  });

  it("should handle text with dollar sign followed by non-numeric characters", () => {
    const content = "Use $variable in the code";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBe(0);

    const text = container.textContent;
    expect(text).toContain("$variable");
  });

  it("should still render block math with double dollar signs", () => {
    const content = "Display math: $$E = mc^2$$";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Block math should be processed - check for the formula content
    const text = container.textContent || "";
    expect(text).toContain("E");
    expect(text).toContain("mc");
  });

  it("should not render inline math with single dollar signs", () => {
    const content = "This $x = y$ should not be rendered as math";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    const katexElements = container.querySelectorAll(".katex");
    // With singleDollarTextMath: false, this should not render as math
    expect(katexElements.length).toBe(0);

    const text = container.textContent;
    expect(text).toContain("$x = y$");
  });

  it("should handle mixed content with both currency and block math", () => {
    const content =
      "The price is $99.99 and the formula is $$x^2 + y^2 = z^2$$";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    const text = container.textContent || "";
    // Currency should be preserved
    expect(text).toContain("$99.99");
    // Math formula content should be present
    expect(
      text.includes("x2") || text.includes("x^2") || text.includes("x²")
    ).toBe(true);
  });
});

describe("Dollar sign in code blocks (parseMarkdownIntoBlocks)", () => {
  it("should not treat $$ inside code blocks as math delimiters", () => {
    const markdown = `\`\`\`bash
# Process tree
pstree -p $$
echo $$
\`\`\`

Some text after.`;

    const blocks = parseMarkdownIntoBlocks(markdown);

    // Should have multiple blocks (code block, space, paragraph)
    expect(blocks.length).toBeGreaterThan(1);

    // Code block should contain $$ intact
    const codeBlock = blocks.find((b) => b.includes("```"));
    expect(codeBlock).toBeTruthy();
    expect(codeBlock).toContain("pstree -p $$");
    expect(codeBlock).toContain("echo $$");

    // There should NOT be a standalone $$ block
    const dollarBlock = blocks.find((b) => b.trim() === "$$");
    expect(dollarBlock).toBeUndefined();
  });

  it("should still merge math blocks correctly", () => {
    const markdown = `Some text.

$$
x = y + z
$$

More text.`;

    const blocks = parseMarkdownIntoBlocks(markdown);

    // The math block should be merged into one
    const mathBlock = blocks.find(
      (b) => b.includes("$$") && b.includes("x = y")
    );
    expect(mathBlock).toBeTruthy();
    // Should contain both opening and closing $$
    expect((mathBlock?.match(/\$\$/g) || []).length).toBe(2);
  });

  it("should handle code block followed by math block", () => {
    const markdown = `\`\`\`bash
echo $$
\`\`\`

$$
math here
$$`;

    const blocks = parseMarkdownIntoBlocks(markdown);

    // Code block should be separate
    const codeBlock = blocks.find(
      (b) => b.includes("```") && b.includes("echo $$")
    );
    expect(codeBlock).toBeTruthy();

    // Math block should be merged correctly
    const mathBlock = blocks.find(
      (b) => b.trim().startsWith("$$") && b.includes("math here")
    );
    expect(mathBlock).toBeTruthy();
  });
});
