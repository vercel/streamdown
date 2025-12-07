import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("KaTeX classes preservation", () => {
  it("should preserve KaTeX classes in block math equations", () => {
    const content = `$$
L = \\frac{1}{2} \\rho v^2 S C_L
$$`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Check that KaTeX classes are present
    const katexElements = container.querySelectorAll(".katex");
    expect(katexElements.length).toBeGreaterThan(0);

    // Check for katex-display wrapper
    const katexDisplay = container.querySelector(".katex-display");
    expect(katexDisplay).toBeTruthy();

    // Check for katex-html content
    const katexHtml = container.querySelector(".katex-html");
    expect(katexHtml).toBeTruthy();

    // Check for katex-mathml content
    const katexMathml = container.querySelector(".katex-mathml");
    expect(katexMathml).toBeTruthy();

    // Verify the equation contains the expected content
    const text = container.textContent || "";
    expect(text).toContain("L");
    expect(text).toContain("ρ");
  });

  it("should preserve KaTeX structure with fractions", () => {
    const content = `$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Check for fraction-specific classes
    const mfrac = container.querySelector(".mfrac");
    expect(mfrac).toBeTruthy();

    // Check for vlist (used in fractions)
    const vlist = container.querySelector('[class*="vlist"]');
    expect(vlist).toBeTruthy();
  });

  it("should preserve inline styles for KaTeX elements", () => {
    const content = `$$
L = \\frac{1}{2} \\rho v^2 S C_L
$$`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Check that inline styles are preserved (KaTeX uses inline styles for positioning)
    const strut = container.querySelector(".strut");
    expect(strut).toBeTruthy();

    if (strut) {
      const style = strut.getAttribute("style");
      expect(style).toBeTruthy();
      expect(style).toContain("height");
    }
  });
});
