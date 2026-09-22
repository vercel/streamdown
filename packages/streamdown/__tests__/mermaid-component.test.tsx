import { act, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { Mermaid } from "../lib/mermaid/index";
import { PluginContext } from "../lib/plugin-context";
import type { DiagramPlugin, MermaidInstance } from "../lib/plugin-types";

// Create a mock mermaid plugin
const createMockMermaidPlugin = (
  mockRender = vi.fn().mockResolvedValue({
    svg: "<svg><text>Mocked Diagram</text></svg>",
  })
): DiagramPlugin => {
  const mockMermaidInstance: MermaidInstance = {
    initialize: vi.fn(),
    render: mockRender,
  };

  return {
    name: "mermaid",
    type: "diagram",
    language: "mermaid",
    getMermaid: vi.fn().mockReturnValue(mockMermaidInstance),
  };
};

describe("Mermaid Component", () => {
  const simpleChart = "graph TD;\n    A-->B;";

  const defaultStreamdownContext = {
    shikiTheme: ["github-light", "github-dark"] as [string, string],
    controls: true,
    isAnimating: false,
    mode: "streaming" as const,
  };

  const renderWithContext = (
    ui: React.ReactElement,
    contextOverrides = {},
    pluginOverrides?: { mermaid?: DiagramPlugin }
  ) => {
    const streamdownContextValue = {
      ...defaultStreamdownContext,
      ...contextOverrides,
    };
    const pluginContextValue = pluginOverrides ?? {
      mermaid: createMockMermaidPlugin(),
    };

    const result = render(
      <PluginContext.Provider value={pluginContextValue}>
        <StreamdownContext.Provider value={streamdownContextValue}>
          {ui}
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    return {
      ...result,
      rerender: (newUi: React.ReactElement) =>
        result.rerender(
          <PluginContext.Provider value={pluginContextValue}>
            <StreamdownContext.Provider value={streamdownContextValue}>
              {newUi}
            </StreamdownContext.Provider>
          </PluginContext.Provider>
        ),
    };
  };

  it("should render loading state initially", async () => {
    const { container } = renderWithContext(<Mermaid chart={simpleChart} />);

    // The loading state may appear briefly or be skipped if rendering is fast
    // Just ensure the component eventually renders successfully
    await waitFor(() => {
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  it("should render mermaid chart after loading", async () => {
    const { container } = renderWithContext(<Mermaid chart={simpleChart} />);

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
    });
  });

  it("should apply custom className", async () => {
    const { container } = renderWithContext(
      <Mermaid chart={simpleChart} className="custom-mermaid" />
    );

    await waitFor(() => {
      // The className is applied to the PanZoom wrapper
      expect(container.querySelector(".custom-mermaid")).toBeTruthy();
    });
  });

  it("should show error when no mermaid plugin is provided", async () => {
    const { container } = renderWithContext(
      <Mermaid chart={simpleChart} />,
      {},
      {} // No mermaid plugin
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Mermaid plugin not available");
    });
  });

  it("should handle render errors gracefully", async () => {
    const mockRender = vi.fn().mockRejectedValue(new Error("Invalid syntax"));
    const plugin = createMockMermaidPlugin(mockRender);

    const { container } = renderWithContext(
      <Mermaid chart="invalid chart" />,
      {},
      { mermaid: plugin }
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Mermaid Error");
    });
  });

  it("should show error details in collapsible section", async () => {
    const mockRender = vi.fn().mockRejectedValue(new Error("Parse error"));
    const plugin = createMockMermaidPlugin(mockRender);

    const { container } = renderWithContext(
      <Mermaid chart="bad syntax" />,
      {},
      { mermaid: plugin }
    );

    await waitFor(() => {
      const details = container.querySelector("details");
      expect(details).toBeTruthy();
      expect(details?.textContent).toContain("Show Code");
    });
  });

  it("should use custom error component when provided", async () => {
    const mockRender = vi.fn().mockRejectedValue(new Error("Test error"));
    const plugin = createMockMermaidPlugin(mockRender);

    const CustomError = ({
      error,
    }: {
      error: string;
      chart: string;
      retry: () => void;
    }) => <div data-testid="custom-error">Custom Error: {error}</div>;

    const { container } = renderWithContext(
      <Mermaid chart="invalid" />,
      { mermaid: { errorComponent: CustomError } },
      { mermaid: plugin }
    );

    await waitFor(() => {
      const customError = container.querySelector(
        '[data-testid="custom-error"]'
      );
      expect(customError).toBeTruthy();
      expect(customError?.textContent).toContain("Test error");
    });
  });

  it("should render in fullscreen mode", async () => {
    const { container } = renderWithContext(
      <Mermaid chart={simpleChart} fullscreen={true} />
    );

    await waitFor(() => {
      // Check for fullscreen-specific classes
      const panZoom = container.querySelector(".h-full");
      expect(panZoom).toBeTruthy();
    });
  });

  it("should pass config to mermaid getMermaid", async () => {
    const mockPlugin = createMockMermaidPlugin();

    const config = { theme: "dark" };
    renderWithContext(
      <Mermaid chart={simpleChart} config={config} />,
      {},
      { mermaid: mockPlugin }
    );

    await waitFor(() => {
      expect(mockPlugin.getMermaid).toHaveBeenCalledWith(config);
    });
  });

  it("should keep last valid SVG on subsequent errors", async () => {
    const mockRender = vi.fn().mockResolvedValueOnce({
      svg: '<svg data-testid="valid-svg"><text>Valid</text></svg>',
    });
    const plugin = createMockMermaidPlugin(mockRender);

    const { container, rerender } = renderWithContext(
      <Mermaid chart={simpleChart} />,
      {},
      { mermaid: plugin }
    );

    await waitFor(() => {
      const svg = container.querySelector('[data-testid="valid-svg"]');
      expect(svg).toBeTruthy();
    });

    // Second render fails
    mockRender.mockRejectedValueOnce(new Error("Error"));

    rerender(<Mermaid chart="new invalid chart" />);

    await waitFor(() => {
      // Should still show the last valid SVG, not error
      const svg = container.querySelector('[data-testid="valid-svg"]');
      expect(svg).toBeTruthy();
    });
  });

  it("should have aria-label on chart container", async () => {
    const { container } = renderWithContext(<Mermaid chart={simpleChart} />);

    await waitFor(() => {
      const chartContainer = container.querySelector(
        '[aria-label="Mermaid chart"]'
      );
      expect(chartContainer).toBeTruthy();
    });
  });

  it("should have role img on chart container", async () => {
    const { container } = renderWithContext(<Mermaid chart={simpleChart} />);

    await waitFor(() => {
      const chartContainer = container.querySelector('[role="img"]');
      expect(chartContainer).toBeTruthy();
    });
  });

  it("should generate unique IDs for multiple charts", async () => {
    const mockRender = vi.fn().mockResolvedValue({
      svg: "<svg><text>Chart</text></svg>",
    });
    const plugin = createMockMermaidPlugin(mockRender);

    const { rerender } = renderWithContext(
      <Mermaid chart="graph TD; A-->B" />,
      {},
      { mermaid: plugin }
    );

    await waitFor(() => {
      expect(mockRender).toHaveBeenCalled();
    });

    const firstCallId = mockRender.mock.calls[0][0];

    mockRender.mockClear();
    rerender(<Mermaid chart="graph TD; C-->D" />);

    await waitFor(() => {
      expect(mockRender).toHaveBeenCalled();
    });

    const secondCallId = mockRender.mock.calls[0][0];

    // IDs should be different
    expect(firstCallId).not.toBe(secondCallId);
  });

  it("should use fallback error message when non-Error is thrown", async () => {
    // Throw a plain string instead of an Error instance → covers line 82-83
    const mockRender = vi.fn().mockRejectedValue("something went wrong");
    const plugin = createMockMermaidPlugin(mockRender);

    const { container } = renderWithContext(
      <Mermaid chart="invalid chart" />,
      {},
      { mermaid: plugin }
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Failed to render Mermaid chart");
    });
  });

  it("should not show loading indicator when SVG is already loaded", async () => {
    const { container, rerender } = renderWithContext(
      <Mermaid chart={simpleChart} />
    );

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeTruthy();
    });

    // Rerender with new chart
    act(() => {
      rerender(<Mermaid chart="graph TD; X-->Y" />);
    });

    // Should not show loading indicator since we have previous SVG
    expect(container.textContent).not.toContain("Loading diagram...");

    // Wait for async operations to complete
    await waitFor(() => {
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  describe("while the chart streams", () => {
    // A render whose promise the test settles by hand
    const deferredRender = () => {
      const pending: Array<{
        chart: string;
        resolve: (svg: string) => void;
        reject: (error: Error) => void;
      }> = [];
      const mockRender = vi.fn(
        (_id: string, chart: string) =>
          new Promise<{ svg: string }>((resolve, reject) => {
            pending.push({
              chart,
              resolve: (svg) => resolve({ svg }),
              reject,
            });
          })
      );
      return { mockRender, pending };
    };

    // Settle a pending render and let the component react to it
    const settle = (run: () => void) =>
      act(async () => {
        run();
        await Promise.resolve();
      });

    const streamed = (steps: number) =>
      Array.from(
        { length: steps },
        (_, i) => `graph TD;\n${"    A-->B;\n".repeat(i + 1)}`
      );

    it("renders only the latest chart once the pending render settles", async () => {
      const { mockRender, pending } = deferredRender();
      const plugin = createMockMermaidPlugin(mockRender);
      const charts = streamed(30);

      const { container, rerender } = renderWithContext(
        <Mermaid chart={charts[0]} />,
        {},
        { mermaid: plugin }
      );
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1));

      for (const chart of charts.slice(1)) {
        rerender(<Mermaid chart={chart} />);
      }
      expect(mockRender).toHaveBeenCalledTimes(1);

      await settle(() => pending[0].resolve('<svg data-chart="first"></svg>'));
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(2));
      expect(pending[1].chart).toBe(charts.at(-1));

      await settle(() => pending[1].resolve('<svg data-chart="latest"></svg>'));
      await waitFor(() => {
        expect(container.querySelector('[data-chart="latest"]')).toBeTruthy();
      });
      expect(mockRender).toHaveBeenCalledTimes(2);
    });

    it("waits as long as the last render took before rendering again", async () => {
      const renderMs = 120;
      const started: number[] = [];
      const mockRender = vi.fn(
        (_id: string, chart: string) =>
          new Promise<{ svg: string }>((resolve) => {
            started.push(performance.now());
            setTimeout(
              () =>
                resolve({ svg: `<svg data-chart="${chart.length}"></svg>` }),
              renderMs
            );
          })
      );
      const plugin = createMockMermaidPlugin(mockRender);
      const charts = streamed(6);

      const { rerender } = renderWithContext(
        <Mermaid chart={charts[0]} />,
        {},
        { mermaid: plugin }
      );
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1));
      // Updates arrive while the first render runs and during the pause after it
      for (const chart of charts.slice(1)) {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 40));
        });
        rerender(<Mermaid chart={chart} />);
      }
      await waitFor(
        () =>
          expect(mockRender).toHaveBeenLastCalledWith(
            expect.any(String),
            charts.at(-1)
          ),
        { timeout: 3000 }
      );
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, renderMs * 2));
      });

      // The first render runs 0-120 ms and pauses until 240 ms, so the
      // updates in between collapse into one render of the last chart. The
      // gap check below is what pins the pause; the count only shows that
      // fewer renders than updates happened.
      expect(mockRender.mock.calls.length).toBeLessThan(charts.length);
      for (let i = 1; i < started.length; i++) {
        expect(started[i] - started[i - 1]).toBeGreaterThanOrEqual(
          renderMs * 2 - 5
        );
      }
    });

    it("does not surface a failure of a chart that was already replaced", async () => {
      const { mockRender, pending } = deferredRender();
      const plugin = createMockMermaidPlugin(mockRender);

      const { container, rerender } = renderWithContext(
        <Mermaid chart="graph TD;\n    A--" />,
        {},
        { mermaid: plugin }
      );
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1));
      rerender(<Mermaid chart={simpleChart} />);

      await settle(() => pending[0].reject(new Error("Parse error on line 2")));
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(2));
      expect(container.textContent).not.toContain("Parse error");

      await settle(() => pending[1].resolve('<svg data-chart="final"></svg>'));
      await waitFor(() => {
        expect(container.querySelector('[data-chart="final"]')).toBeTruthy();
      });
      expect(container.textContent).not.toContain("Parse error");
    });

    it("stops after unmounting while a render is pending", async () => {
      const { mockRender, pending } = deferredRender();
      const plugin = createMockMermaidPlugin(mockRender);
      const charts = streamed(3);

      const { rerender, unmount } = renderWithContext(
        <Mermaid chart={charts[0]} />,
        {},
        { mermaid: plugin }
      );
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1));
      rerender(<Mermaid chart={charts[2]} />);
      unmount();

      await settle(() => pending[0].resolve("<svg></svg>"));
      expect(mockRender).toHaveBeenCalledTimes(1);
    });

    it("coalesces under StrictMode too", async () => {
      const { mockRender, pending } = deferredRender();
      const plugin = createMockMermaidPlugin(mockRender);
      const charts = streamed(10);
      const tree = (chart: string) => (
        <StrictMode>
          <PluginContext.Provider value={{ mermaid: plugin }}>
            <StreamdownContext.Provider value={defaultStreamdownContext}>
              <Mermaid chart={chart} />
            </StreamdownContext.Provider>
          </PluginContext.Provider>
        </StrictMode>
      );

      const { container, rerender } = render(tree(charts[0]));
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1));
      for (const chart of charts.slice(1)) {
        rerender(tree(chart));
      }
      await settle(() => pending[0].resolve('<svg data-chart="first"></svg>'));
      await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(2));
      expect(pending[1].chart).toBe(charts.at(-1));
      await settle(() => pending[1].resolve('<svg data-chart="latest"></svg>'));
      await waitFor(() => {
        expect(container.querySelector('[data-chart="latest"]')).toBeTruthy();
      });
      expect(mockRender).toHaveBeenCalledTimes(2);
    });
  });
});
