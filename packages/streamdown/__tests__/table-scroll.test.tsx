import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext, type StreamdownContextType } from "../index";
import { CodeBlockBody } from "../lib/code-block/body";
import { Table } from "../lib/table";
import { resolveMaxHeight } from "../lib/use-pinned-scroll";

const defaultContext: StreamdownContextType = {
  codeBlockMaxHeight: 400,
  controls: false,
  isAnimating: false,
  lineNumbers: true,
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

const mockScrollMetrics = (
  el: HTMLElement,
  metrics: {
    scrollHeight: number;
    clientHeight: number;
    scrollTop?: number;
  }
) => {
  Object.defineProperty(el, "scrollHeight", {
    value: metrics.scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, "clientHeight", {
    value: metrics.clientHeight,
    configurable: true,
  });
  Object.defineProperty(el, "scrollTop", {
    value: metrics.scrollTop ?? 0,
    configurable: true,
    writable: true,
  });
};

describe("resolveMaxHeight", () => {
  it("converts numbers to px and passes strings through", () => {
    expect(resolveMaxHeight(400)).toBe("400px");
    expect(resolveMaxHeight("50vh")).toBe("50vh");
  });

  it("disables for 0, Infinity, and none", () => {
    expect(resolveMaxHeight(0)).toBeUndefined();
    expect(resolveMaxHeight(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(resolveMaxHeight("0")).toBeUndefined();
    expect(resolveMaxHeight("none")).toBeUndefined();
    expect(resolveMaxHeight(undefined)).toBeUndefined();
  });
});

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

  it("does not set maxHeight style when maxHeight is 0", () => {
    const { container } = renderWithContext(
      <Table maxHeight={0}>
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

    mockScrollMetrics(scrollDiv, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 700,
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

    mockScrollMetrics(scrollDiv, {
      scrollHeight: 1000,
      clientHeight: 300,
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

  it("does not auto-scroll after the user scrolls up", () => {
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

    mockScrollMetrics(scrollDiv, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });
    scrollDiv.scrollTo = scrollToSpy;

    // User scrolled up — leave bottom, clearing the pin
    scrollDiv.dispatchEvent(new Event("scroll"));

    scrollToSpy.mockClear();

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

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});

describe("CodeBlockBody scroll", () => {
  const baseResult = {
    tokens: [[{ content: "const x = 1;", color: "#000" }]],
    bg: "#fff",
    fg: "#000",
  };

  it("applies maxHeight and keeps horizontal overflow", () => {
    const { container } = renderWithContext(
      <CodeBlockBody language="js" maxHeight={400} result={baseResult} />
    );

    const body = container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    expect(body.style.maxHeight).toBe("400px");
    expect(body.className).toContain("overflow-y-auto");
    expect(body.className).toContain("overflow-x-auto");
  });

  it("does not constrain height when maxHeight is Infinity", () => {
    const { container } = renderWithContext(
      <CodeBlockBody
        language="js"
        maxHeight={Number.POSITIVE_INFINITY}
        result={baseResult}
      />
    );

    const body = container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    expect(body.style.maxHeight).toBe("");
    expect(body.className).toContain("overflow-x-auto");
    expect(body.className).not.toContain("overflow-y-auto");
  });

  it("auto-scrolls when result updates during animation", () => {
    const scrollToSpy = vi.fn();
    const { container, rerender } = renderWithContext(
      <CodeBlockBody language="js" maxHeight={200} result={baseResult} />,
      { isAnimating: true }
    );

    const body = container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    mockScrollMetrics(body, {
      scrollHeight: 800,
      clientHeight: 200,
      scrollTop: 600,
    });
    body.scrollTo = scrollToSpy;

    const nextResult = {
      ...baseResult,
      tokens: [
        [{ content: "const x = 1;", color: "#000" }],
        [{ content: "const y = 2;", color: "#000" }],
      ],
    };

    rerender(
      <StreamdownContext.Provider
        value={{ ...defaultContext, isAnimating: true }}
      >
        <CodeBlockBody language="js" maxHeight={200} result={nextResult} />
      </StreamdownContext.Provider>
    );

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "instant",
    });
  });
});
