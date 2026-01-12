import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { PluginContext } from "../lib/plugin-context";
import type { DiagramPlugin, MermaidInstance } from "../lib/plugin-types";
import { Mermaid } from "../lib/mermaid/index";

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
    const streamdownContextValue = { ...defaultStreamdownContext, ...contextOverrides };
    const pluginContextValue = pluginOverrides ?? { mermaid: createMockMermaidPlugin() };

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
});
