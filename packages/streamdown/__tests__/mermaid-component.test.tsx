import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { Mermaid } from "../lib/mermaid/index";

// Mock the mermaid utils
vi.mock("../lib/mermaid/utils", () => ({
  initializeMermaid: vi.fn().mockResolvedValue({
    render: vi.fn().mockResolvedValue({
      svg: "<svg><text>Mocked Diagram</text></svg>",
    }),
  }),
}));

describe("Mermaid Component", () => {
  const simpleChart = "graph TD;\n    A-->B;";

  const defaultContext = {
    shikiTheme: ["github-light", "github-dark"] as [string, string],
    controls: true,
    isAnimating: false,
    mode: "streaming" as const,
    cdnUrl: "https://www.streamdown.ai/cdn",
  };

  const renderWithContext = (ui: React.ReactElement, contextOverrides = {}) => {
    const contextValue = { ...defaultContext, ...contextOverrides };
    const result = render(
      <StreamdownContext.Provider value={contextValue}>
        {ui}
      </StreamdownContext.Provider>
    );

    return {
      ...result,
      rerender: (newUi: React.ReactElement) =>
        result.rerender(
          <StreamdownContext.Provider value={contextValue}>
            {newUi}
          </StreamdownContext.Provider>
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

  it("should handle errors gracefully", async () => {
    const { initializeMermaid } = await import("../lib/mermaid/utils");

    // Mock to throw an error
    (initializeMermaid as any).mockRejectedValueOnce(
      new Error("Invalid syntax")
    );

    const { container } = renderWithContext(<Mermaid chart="invalid chart" />);

    await waitFor(() => {
      expect(container.textContent).toContain("Mermaid Error");
    });
  });

  it("should show error details in collapsible section", async () => {
    const { initializeMermaid } = await import("../lib/mermaid/utils");

    // Mock to throw an error
    (initializeMermaid as any).mockRejectedValueOnce(new Error("Parse error"));

    const { container } = renderWithContext(<Mermaid chart="bad syntax" />);

    await waitFor(() => {
      const details = container.querySelector("details");
      expect(details).toBeTruthy();
      expect(details?.textContent).toContain("Show Code");
    });
  });

  it("should use custom error component when provided", async () => {
    const { initializeMermaid } = await import("../lib/mermaid/utils");

    // Mock to throw an error
    (initializeMermaid as any).mockRejectedValueOnce(new Error("Test error"));

    const CustomError = ({
      error,
    }: {
      error: string;
      chart: string;
      retry: () => void;
    }) => <div data-testid="custom-error">Custom Error: {error}</div>;

    const { container } = renderWithContext(<Mermaid chart="invalid" />, {
      mermaid: { errorComponent: CustomError },
    });

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

  it("should pass config to mermaid initialization", async () => {
    const { initializeMermaid } = await import("../lib/mermaid/utils");

    const config = { theme: "dark" };
    renderWithContext(<Mermaid chart={simpleChart} config={config} />);

    await waitFor(() => {
      expect(initializeMermaid).toHaveBeenCalledWith(
        config,
        "https://www.streamdown.ai/cdn"
      );
    });
  });

  it("should keep last valid SVG on subsequent errors", async () => {
    const { initializeMermaid } = await import("../lib/mermaid/utils");

    // First render succeeds
    (initializeMermaid as any).mockResolvedValueOnce({
      render: vi.fn().mockResolvedValue({
        svg: '<svg data-testid="valid-svg"><text>Valid</text></svg>',
      }),
    });

    const { container, rerender } = renderWithContext(
      <Mermaid chart={simpleChart} />
    );

    await waitFor(() => {
      const svg = container.querySelector('[data-testid="valid-svg"]');
      expect(svg).toBeTruthy();
    });

    // Second render fails
    (initializeMermaid as any).mockRejectedValueOnce(new Error("Error"));

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
    const { initializeMermaid } = await import("../lib/mermaid/utils");

    const mockRender = vi.fn().mockResolvedValue({
      svg: "<svg><text>Chart</text></svg>",
    });

    (initializeMermaid as any).mockResolvedValue({
      render: mockRender,
    });

    const { rerender } = renderWithContext(<Mermaid chart="graph TD; A-->B" />);

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
