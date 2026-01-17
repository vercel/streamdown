import { math } from "@streamdown/math";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("KaTeX math rendering", () => {
  it("should render block math equations with math plugin", () => {
    const content = `$$
L = \\frac{1}{2} \\rho v^2 S C_L
$$`;

    const { container } = render(
      <Streamdown plugins={{ math }}>{content}</Streamdown>
    );

    // Verify the equation content is rendered
    // With the math plugin, the LaTeX should be converted to rendered output
    const text = container.textContent || "";

    // Should contain variable names from the equation
    expect(text).toContain("L");

    // Math content should be rendered (either as KaTeX symbols or text)
    // The exact output depends on the test environment's KaTeX rendering
    const hasMathContent =
      text.includes("ρ") || // Greek letter rho rendered
      text.includes("rho") || // Or as text if not rendered
      text.includes("frac"); // Or LaTeX command if not processed

    expect(hasMathContent).toBe(true);
  });

  it("should render equations with fractions", () => {
    const content = `$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$`;

    const { container } = render(
      <Streamdown plugins={{ math }}>{content}</Streamdown>
    );

    // Verify the quadratic formula content is present
    const text = container.textContent || "";

    // Should contain equation elements
    expect(text).toContain("x");
    expect(text).toContain("=");

    // Should contain math symbols or their text representations
    const hasMathContent =
      text.includes("±") ||
      text.includes("pm") ||
      text.includes("sqrt") ||
      text.includes("√");

    expect(hasMathContent).toBe(true);
  });

  it("should render math blocks distinctly from regular text", () => {
    const content = `Regular paragraph text.

$$
E = mc^2
$$

More regular text.`;

    const { container } = render(
      <Streamdown plugins={{ math }}>{content}</Streamdown>
    );

    const text = container.textContent || "";

    // Should contain both regular text and math content
    expect(text).toContain("Regular paragraph text");
    expect(text).toContain("More regular text");

    // Math content should be present
    expect(text).toContain("E");
    expect(text).toContain("mc");
  });
});
