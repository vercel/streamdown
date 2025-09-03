import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

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

    const katexElements = container.querySelectorAll(".katex");
    // Block math should still work
    expect(katexElements.length).toBeGreaterThan(0);
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

    const katexElements = container.querySelectorAll(".katex");
    // Only the block math should render
    expect(katexElements.length).toBe(1);

    const text = container.textContent;
    expect(text).toContain("$99.99");
  });
});
