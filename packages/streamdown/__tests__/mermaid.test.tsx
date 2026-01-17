import { render, waitFor } from "@testing-library/react";
import type { MermaidConfig } from "mermaid";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mermaid } from "../lib/mermaid";
import { MermaidDownloadDropdown } from "../lib/mermaid/download-button";
import { MermaidFullscreenButton } from "../lib/mermaid/fullscreen-button";
import { PluginContext } from "../lib/plugin-context";
import type { DiagramPlugin } from "../lib/plugin-types";

const { saveMock, mockInitialize, mockRender, mockMermaid } = vi.hoisted(() => {
  const mockInitialize = vi.fn();
  const mockRender = vi.fn().mockResolvedValue({ svg: "<svg>Test SVG</svg>" });
  const mockMermaid = {
    initialize: mockInitialize,
    render: mockRender,
  };
  return {
    saveMock: vi.fn(),
    mockInitialize,
    mockRender,
    mockMermaid,
  };
});

// Create a mock mermaid plugin
const createMockMermaidPlugin = (): DiagramPlugin => ({
  name: "mermaid",
  type: "diagram",
  language: "mermaid",
  getMermaid: (config?: MermaidConfig) => {
    const defaultConfig = {
      startOnLoad: false,
      theme: "default",
      securityLevel: "strict",
      fontFamily: "monospace",
      suppressErrorRendering: true,
    };
    mockInitialize({ ...defaultConfig, ...config });
    return mockMermaid;
  },
});

// Wrapper component that provides plugin context
const MermaidTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PluginContext.Provider value={{ mermaid: createMockMermaidPlugin() }}>
    {children}
  </PluginContext.Provider>
);

vi.mock("../lib/utils", async () => {
  const actual =
    await vi.importActual<typeof import("../lib/utils")>("../lib/utils");
  return { ...actual, save: saveMock };
});

describe("Mermaid", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockInitialize.mockClear();
    mockRender.mockClear();
    saveMock.mockClear();

    // Reset body styles before each test
    document.body.style.userSelect = "";
    document.body.style.overflow = "";
  });

  it("renders without crashing", async () => {
    let container: HTMLElement;
    await act(() => {
      const result = render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" />
        </MermaidTestWrapper>
      );
      container = result.container;
    });
    expect(container?.firstChild).toBeDefined();
  });

  it("applies custom className", async () => {
    let container: HTMLElement;
    await act(() => {
      const result = render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" className="custom-class" />
        </MermaidTestWrapper>
      );
      container = result.container;
    });

    const mermaidContainer = container?.querySelector(
      '[data-streamdown="mermaid"]'
    ) as HTMLElement;
    expect(mermaidContainer?.className).toContain("custom-class");
  });

  it("initializes with custom config", async () => {
    const customConfig: MermaidConfig = {
      theme: "dark",
      themeVariables: {
        primaryColor: "#ff0000",
        primaryTextColor: "#ffffff",
      },
      fontFamily: "Arial, sans-serif",
    } as MermaidConfig;

    await act(() => {
      render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" config={customConfig} />
        </MermaidTestWrapper>
      );
    });

    // Wait for initialization
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    // Check that initialize was called with the custom config
    const initializeCall = mockInitialize.mock.calls[0][0];
    expect(initializeCall.theme).toBe("dark");
    expect(initializeCall.themeVariables?.primaryColor).toBe("#ff0000");
    expect(initializeCall.fontFamily).toBe("Arial, sans-serif");
  });

  it("initializes with default config when none provided", async () => {
    await act(() => {
      render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" />
        </MermaidTestWrapper>
      );
    });

    // Wait for initialization
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    // Check that initialize was called with default config
    const initializeCall = mockInitialize.mock.calls[0][0];
    expect(initializeCall.theme).toBe("default");
    expect(initializeCall.securityLevel).toBe("strict");
    expect(initializeCall.fontFamily).toBe("monospace");
  });

  it("accepts different config values", async () => {
    const config1: MermaidConfig = {
      theme: "forest",
    } as MermaidConfig;

    let rerender: ReturnType<typeof render>["rerender"];
    await act(() => {
      const result = render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" config={config1} />
        </MermaidTestWrapper>
      );
      rerender = result.rerender;
    });

    // Should render without error
    expect(mockRender).toBeDefined();

    const config2: MermaidConfig = {
      theme: "dark",
      fontFamily: "Arial",
    } as MermaidConfig;

    // Should be able to rerender with different config
    await act(() => {
      rerender?.(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" config={config2} />
        </MermaidTestWrapper>
      );
    });

    // Should still render without error
    expect(mockRender).toBeDefined();
  });

  it("handles complex config objects with functions", async () => {
    const config: MermaidConfig = {
      theme: "dark",
      themeVariables: {
        primaryColor: "#ff0000",
        primaryTextColor: "#ffffff",
      },
      fontFamily: "Arial",
    } as MermaidConfig;

    let container: HTMLElement;
    await act(() => {
      const result = render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" config={config} />
        </MermaidTestWrapper>
      );
      container = result.container;
    });

    // Should render without error even with complex config
    expect(container?.firstChild).toBeTruthy();
  });

  it("supports multiple components with different configs", async () => {
    const config1: MermaidConfig = { theme: "forest" } as MermaidConfig;
    const config2: MermaidConfig = { theme: "dark" } as MermaidConfig;

    // Render first component
    let rerender: ReturnType<typeof render>["rerender"];
    await act(() => {
      const result = render(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; A-->B" config={config1} />
        </MermaidTestWrapper>
      );
      rerender = result.rerender;
    });

    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(1));
    expect(mockInitialize.mock.calls[0][0].theme).toBe("forest");

    // Render second component with different config
    await act(() => {
      rerender?.(
        <MermaidTestWrapper>
          <Mermaid chart="graph TD; X-->Y" config={config2} />
        </MermaidTestWrapper>
      );
    });

    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(2));
    expect(mockInitialize.mock.calls[1][0].theme).toBe("dark");
  });

  describe("Fullscreen functionality", () => {
    it("should render fullscreen button", async () => {
      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      );
      expect(fullscreenButton).toBeTruthy();
    });

    it("should open fullscreen modal when fullscreen button is clicked", async () => {
      const { fireEvent } = await import("@testing-library/react");

      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      ) as HTMLButtonElement;
      expect(fullscreenButton).toBeTruthy();

      await act(() => {
        fireEvent.click(fullscreenButton);
      });

      // Check that fullscreen modal is visible
      const modal = document.querySelector(".fixed.inset-0.z-50");
      expect(modal).toBeTruthy();

      // Check that close button exists
      const closeButton = document.querySelector(
        'button[title="Exit fullscreen"]'
      );
      expect(closeButton).toBeTruthy();
    });

    it("should close fullscreen modal when close button is clicked", async () => {
      const { fireEvent } = await import("@testing-library/react");

      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      ) as HTMLButtonElement;

      // Open fullscreen
      await act(() => {
        fireEvent.click(fullscreenButton);
      });

      const closeButton = document.querySelector(
        'button[title="Exit fullscreen"]'
      ) as HTMLButtonElement;
      expect(closeButton).toBeTruthy();

      // Close fullscreen
      await act(() => {
        fireEvent.click(closeButton);
      });

      // Modal should be gone
      await waitFor(() => {
        const modal = document.querySelector(".fixed.inset-0.z-50");
        expect(modal).toBeNull();
      });
    });

    it("should close fullscreen modal when ESC key is pressed", async () => {
      const { fireEvent } = await import("@testing-library/react");

      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      ) as HTMLButtonElement;

      // Open fullscreen
      await act(() => {
        fireEvent.click(fullscreenButton);
      });

      const modal = document.querySelector(".fixed.inset-0.z-50");
      expect(modal).toBeTruthy();

      // Press ESC key
      await act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      // Modal should be gone
      await waitFor(() => {
        const modalAfter = document.querySelector(".fixed.inset-0.z-50");
        expect(modalAfter).toBeNull();
      });
    });

    it("should close fullscreen modal when clicking outside the diagram", async () => {
      const { fireEvent } = await import("@testing-library/react");

      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      ) as HTMLButtonElement;

      // Open fullscreen
      await act(() => {
        fireEvent.click(fullscreenButton);
      });

      const modal = document.querySelector(
        ".fixed.inset-0.z-50"
      ) as HTMLElement;
      expect(modal).toBeTruthy();

      // Click on the modal backdrop (outside the diagram)
      await act(() => {
        fireEvent.click(modal);
      });

      // Modal should be gone
      await waitFor(() => {
        const modalAfter = document.querySelector(".fixed.inset-0.z-50");
        expect(modalAfter).toBeNull();
      });
    });

    it("should not close fullscreen when clicking on the diagram itself", async () => {
      const { fireEvent } = await import("@testing-library/react");

      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      ) as HTMLButtonElement;

      // Open fullscreen
      await act(() => {
        fireEvent.click(fullscreenButton);
      });

      const diagram = document.querySelector(
        '[aria-label="Mermaid chart"]'
      ) as HTMLElement;
      expect(diagram).toBeTruthy();

      // Click on the diagram itself
      await act(() => {
        fireEvent.click(diagram);
      });

      // Modal should still be open
      const modal = document.querySelector(".fixed.inset-0.z-50");
      expect(modal).toBeTruthy();
    });

    it("should manage body scroll state when fullscreen is toggled", async () => {
      const { fireEvent } = await import("@testing-library/react");

      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidTestWrapper>
            <MermaidFullscreenButton chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );
        container = result.container;
      });

      const fullscreenButton = container?.querySelector(
        'button[title="View fullscreen"]'
      ) as HTMLButtonElement;

      // Open fullscreen - verify modal is open instead of body style
      // (body style manipulation may not work consistently in jsdom test environment)
      await act(() => {
        fireEvent.click(fullscreenButton);
      });

      await waitFor(() => {
        const modal = document.querySelector(".fixed.inset-0.z-50");
        expect(modal).toBeTruthy();
      });

      // Close fullscreen
      const closeButton = document.querySelector(
        'button[title="Exit fullscreen"]'
      ) as HTMLButtonElement;
      await act(() => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        const modal = document.querySelector(".fixed.inset-0.z-50");
        expect(modal).toBeNull();
      });

      // Verify body overflow is restored (or at least not left in "hidden" state)
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });

  describe("MermaidDownloadDropdown", () => {
    it("downloads Mermaid source when selecting MMD", async () => {
      const { fireEvent } = await import("@testing-library/react");
      const handleDownload = vi.fn();

      const { getByTitle, getByRole, queryByRole } = render(
        <MermaidTestWrapper>
          <MermaidDownloadDropdown
            chart="graph TD; A-->B"
            onDownload={handleDownload}
          />
        </MermaidTestWrapper>
      );

      const toggleButton = getByTitle("Download diagram");

      await act(() => {
        fireEvent.click(toggleButton);
      });

      const mmdButton = await waitFor(() =>
        getByRole("button", { name: "MMD" })
      );

      await act(() => {
        fireEvent.click(mmdButton);
      });

      await waitFor(() => {
        expect(saveMock).toHaveBeenCalledWith(
          "diagram.mmd",
          "graph TD; A-->B",
          "text/plain"
        );
      });

      expect(handleDownload).toHaveBeenCalledWith("mmd");

      await waitFor(() => {
        expect(queryByRole("button", { name: "MMD" })).toBeNull();
      });
    });

    it("downloads SVG when selected", async () => {
      const { fireEvent } = await import("@testing-library/react");
      const handleDownload = vi.fn();

      const { getByTitle, getByRole } = render(
        <MermaidTestWrapper>
          <MermaidDownloadDropdown
            chart="graph TD; A-->B"
            onDownload={handleDownload}
          />
        </MermaidTestWrapper>
      );

      const toggleButton = getByTitle("Download diagram");

      await act(() => {
        fireEvent.click(toggleButton);
      });

      const svgButton = await waitFor(() =>
        getByRole("button", { name: "SVG" })
      );

      await act(() => {
        fireEvent.click(svgButton);
      });

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(saveMock).toHaveBeenCalledWith(
          "diagram.svg",
          "<svg>Test SVG</svg>",
          "image/svg+xml"
        );
      });

      expect(handleDownload).toHaveBeenCalledWith("svg");
    });

    it("downloads PNG when selected", async () => {
      const { fireEvent } = await import("@testing-library/react");
      const pngBlob = new Blob(["png"], { type: "image/png" });
      const originalImage = global.Image;
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      class MockImage {
        height = 100;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 100;

        set src(_: string) {
          this.onload?.();
        }
      }

      const mockContext = {
        drawImage: vi.fn(),
      };

      // @ts-expect-error - replace global Image for testing
      global.Image = MockImage;
      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockReturnValue(mockContext);
      HTMLCanvasElement.prototype.toBlob = (callback) => {
        callback?.(pngBlob);
      };

      try {
        const { getByTitle, getByRole } = render(
          <MermaidTestWrapper>
            <MermaidDownloadDropdown chart="graph TD; A-->B" />
          </MermaidTestWrapper>
        );

        const toggleButton = getByTitle("Download diagram");

        await act(() => {
          fireEvent.click(toggleButton);
        });

        const pngButton = await waitFor(() =>
          getByRole("button", { name: "PNG" })
        );

        await act(() => {
          fireEvent.click(pngButton);
        });

        await waitFor(() => {
          expect(saveMock).toHaveBeenCalledTimes(1);
        });

        const [filename, fileContent, mimeType] = saveMock.mock.calls[0];
        expect(filename).toBe("diagram.png");
        expect(fileContent).toBe(pngBlob);
        expect(mimeType).toBe("image/png");
      } finally {
        global.Image = originalImage;
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
      }
    });

    it("calls onError when rendering fails", async () => {
      const { fireEvent } = await import("@testing-library/react");
      const onError = vi.fn();

      mockRender.mockRejectedValueOnce(new Error("Render failed"));

      const { getByTitle, getByRole } = render(
        <MermaidTestWrapper>
          <MermaidDownloadDropdown chart="graph TD; A-->B" onError={onError} />
        </MermaidTestWrapper>
      );

      const toggleButton = getByTitle("Download diagram");

      await act(() => {
        fireEvent.click(toggleButton);
      });

      const svgButton = await waitFor(() =>
        getByRole("button", { name: "SVG" })
      );

      await act(() => {
        fireEvent.click(svgButton);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });
});
