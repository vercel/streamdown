import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("pending inline markers", () => {
  it("hides pending bold markers while streaming and flushes literal markers on completion", () => {
    const { container, rerender } = render(
      <Streamdown isAnimating remend={{ pendingInlineMarkers: true }}>
        {"my name is **"}
      </Streamdown>
    );
    expect(container.textContent).toBe("my name is");
    rerender(
      <Streamdown isAnimating remend={{ pendingInlineMarkers: true }}>
        {"my name is **Ada"}
      </Streamdown>
    );
    expect(
      container.querySelector('[data-streamdown="strong"]')?.textContent
    ).toBe("Ada");
    rerender(
      <Streamdown isAnimating={false} remend={{ pendingInlineMarkers: true }}>
        {"my name is **"}
      </Streamdown>
    );
    expect(container.textContent).toBe("my name is **");
  });

  it("does not reinterpret an empty nested list marker as literal text", () => {
    const { container } = render(<Streamdown>{"- item\n - "}</Streamdown>);
    expect(container.textContent).not.toContain("-");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });
});
