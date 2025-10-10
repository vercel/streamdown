import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("Remark plugin options", () => {
  it("should allow custom remarkMathOptions", () => {
    const markdown = "$x = 5$";
    const { container } = render(
      <Streamdown remarkMathOptions={{ singleDollarTextMath: true }}>
        {markdown}
      </Streamdown>
    );

    // With singleDollarTextMath: true, $x = 5$ should be rendered as math
    const mathElement = container.querySelector(".katex");
    expect(mathElement).toBeTruthy();
  });

  it("should use default remarkMathOptions when not provided", () => {
    const markdown = "$x = 5$";
    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // With default singleDollarTextMath: false, $x = 5$ should NOT be rendered as math
    const mathElement = container.querySelector(".katex");
    expect(mathElement).toBeFalsy();
  });

  it("should allow custom remarkGfmOptions", () => {
    const markdown = "~~strikethrough~~";
    const { container } = render(
      <Streamdown remarkGfmOptions={{}}>{markdown}</Streamdown>
    );

    // GFM should render strikethrough with default options
    const delElement = container.querySelector("del");
    expect(delElement).toBeTruthy();
    expect(delElement?.textContent).toBe("strikethrough");
  });

  it("should render GFM tables with default options", () => {
    const markdown = `| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |`;

    render(<Streamdown>{markdown}</Streamdown>);

    // Should find table elements
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
