import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext, type StreamdownContextType } from "../index";
import { Table } from "../lib/table";

const defaultContext: StreamdownContextType = {
  codeBlockMaxHeight: 400,
  controls: false,
  isAnimating: false,
  linkSafety: { enabled: true },
  mermaid: undefined,
  mode: "streaming",
  shikiTheme: ["github-light", "github-dark"],
  tableMaxHeight: 300,
};

function renderWithContext(
  ui: ReactNode,
  ctx: Partial<StreamdownContextType> = {}
) {
  return render(
    <StreamdownContext.Provider value={{ ...defaultContext, ...ctx }}>
      {ui}
    </StreamdownContext.Provider>
  );
}

describe("Table scroll", () => {
  it("renders inner scroll div with maxHeight style when maxHeight provided", () => {
    const { container } = renderWithContext(
      <Table maxHeight={300}>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv).toBeTruthy();
    expect(scrollDiv?.getAttribute("style")).toContain("max-height");
  });

  it("accepts string maxHeight value", () => {
    const { container } = renderWithContext(
      <Table maxHeight="50vh">
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv?.getAttribute("style")).toContain("50vh");
  });

  it("does not set maxHeight style when maxHeight is undefined", () => {
    const { container } = renderWithContext(
      <Table>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv?.getAttribute("style") ?? "").not.toContain("max-height");
  });

  it("calls scrollTo on children update when isAnimating and pinned", () => {
    const scrollToSpy = vi.fn();

    const { container, rerender } = renderWithContext(
      <Table maxHeight={300}>
        <tbody>
          <tr>
            <td>row1</td>
          </tr>
        </tbody>
      </Table>,
      { isAnimating: true }
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    ) as HTMLElement;

    Object.defineProperty(scrollDiv, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(scrollDiv, "clientHeight", {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(scrollDiv, "scrollTop", {
      value: 700,
      configurable: true,
      writable: true,
    });
    scrollDiv.scrollTo = scrollToSpy;

    rerender(
      <StreamdownContext.Provider
        value={{ ...defaultContext, isAnimating: true }}
      >
        <Table maxHeight={300}>
          <tbody>
            <tr>
              <td>row1</td>
            </tr>
            <tr>
              <td>row2</td>
            </tr>
          </tbody>
        </Table>
      </StreamdownContext.Provider>
    );

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "instant",
    });
  });

  it("does not call scrollTo when isAnimating is false", () => {
    const scrollToSpy = vi.fn();

    const { container, rerender } = renderWithContext(
      <Table maxHeight={300}>
        <tbody>
          <tr>
            <td>row1</td>
          </tr>
        </tbody>
      </Table>,
      { isAnimating: false }
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    ) as HTMLElement;

    Object.defineProperty(scrollDiv, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    scrollDiv.scrollTo = scrollToSpy;

    rerender(
      <StreamdownContext.Provider
        value={{ ...defaultContext, isAnimating: false }}
      >
        <Table maxHeight={300}>
          <tbody>
            <tr>
              <td>row1</td>
            </tr>
            <tr>
              <td>row2</td>
            </tr>
          </tbody>
        </Table>
      </StreamdownContext.Provider>
    );

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
