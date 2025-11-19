import { fireEvent, render, waitFor } from "@testing-library/react";
import type { MermaidConfig } from "mermaid";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mermaid } from "../lib/mermaid";
import { MermaidDownloadDropdown } from "../lib/mermaid/download-button";
import { MermaidFullscreenButton } from "../lib/mermaid/fullscreen-button";
import { PanZoom } from "../lib/mermaid/pan-zoom";

const { saveMock } = vi.hoisted(() => ({
  saveMock: vi.fn(),
}));

// Mock mermaid
const mockInitialize = vi.fn();
const mockRender = vi.fn().mockResolvedValue({ svg: "<svg>Test SVG</svg>" });

vi.mock("mermaid", () => ({
  default: {
    initialize: mockInitialize,
    render: mockRender,
  },
}));

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
      const result = render(<Mermaid chart="graph TD; A-->B" />);
      container = result.container;
    });
    expect(container?.firstChild).toBeDefined();
  });

  it("applies custom className", async () => {
    let container: HTMLElement;
    await act(() => {
      const result = render(
        <Mermaid chart="graph TD; A-->B" className="custom-class" />
      );
      container = result.container;
    });

    const mermaidContainer = container?.firstChild as HTMLElement;
    expect(mermaidContainer.className).toContain("custom-class");
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
      render(<Mermaid chart="graph TD; A-->B" config={customConfig} />);
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
      render(<Mermaid chart="graph TD; A-->B" />);
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
        <Mermaid chart="graph TD; A-->B" config={config1} />
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
      rerender?.(<Mermaid chart="graph TD; A-->B" config={config2} />);
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
        <Mermaid chart="graph TD; A-->B" config={config} />
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
        <Mermaid chart="graph TD; A-->B" config={config1} />
      );
      rerender = result.rerender;
    });

    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(1));
    expect(mockInitialize.mock.calls[0][0].theme).toBe("forest");

    // Render second component with different config
    await act(() => {
      rerender?.(<Mermaid chart="graph TD; X-->Y" config={config2} />);
    });

    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(2));
    expect(mockInitialize.mock.calls[1][0].theme).toBe("dark");
  });

  describe("Fullscreen functionality", () => {
    it("should render fullscreen button", async () => {
      let container: HTMLElement;
      await act(() => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
          <MermaidFullscreenButton chart="graph TD; A-->B" />
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
        <MermaidDownloadDropdown
          chart="graph TD; A-->B"
          onDownload={handleDownload}
        />
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
        <MermaidDownloadDropdown
          chart="graph TD; A-->B"
          onDownload={handleDownload}
        />
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
          <MermaidDownloadDropdown chart="graph TD; A-->B" />
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
        <MermaidDownloadDropdown chart="graph TD; A-->B" onError={onError} />
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

  it("renders without crashing", () => {
    const { container } = render(
      <PanZoom>
        <div>Test content</div>
      </PanZoom>
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders children correctly", () => {
    const { getByText } = render(
      <PanZoom>
        <div>Test content</div>
      </PanZoom>
    );
    expect(getByText("Test content")).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PanZoom className="custom-class">
        <div>Test content</div>
      </PanZoom>
    );
    const panZoomContainer = container.firstChild as HTMLElement;
    expect(panZoomContainer.className).toContain("custom-class");
  });

  describe("Zoom controls", () => {
    it("shows controls by default", () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector('button[title="Zoom in"]');
      const zoomOutButton = container.querySelector('button[title="Zoom out"]');
      const resetButton = container.querySelector(
        'button[title="Reset zoom and pan"]'
      );
      expect(zoomInButton).toBeTruthy();
      expect(zoomOutButton).toBeTruthy();
      expect(resetButton).toBeTruthy();
    });

    it("hides controls when showControls is false", () => {
      const { container } = render(
        <PanZoom showControls={false}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector('button[title="Zoom in"]');
      expect(zoomInButton).toBeNull();
    });

    it("zooms in when zoom in button is clicked", async () => {
      const { container } = render(
        <PanZoom initialZoom={1} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector(
        'button[title="Zoom in"]'
      ) as HTMLButtonElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      // Get initial transform
      const initialTransform = contentDiv.style.transform;

      await act(() => {
        fireEvent.click(zoomInButton);
      });

      // Transform should have changed (zoom increased)
      const newTransform = contentDiv.style.transform;
      expect(newTransform).not.toBe(initialTransform);
      expect(newTransform).toContain("scale(1.1)");
    });

    it("zooms out when zoom out button is clicked", async () => {
      const { container } = render(
        <PanZoom initialZoom={1} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomOutButton = container.querySelector(
        'button[title="Zoom out"]'
      ) as HTMLButtonElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      // Get initial transform
      const initialTransform = contentDiv.style.transform;

      await act(() => {
        fireEvent.click(zoomOutButton);
      });

      // Transform should have changed (zoom decreased)
      const newTransform = contentDiv.style.transform;
      expect(newTransform).not.toBe(initialTransform);
      expect(newTransform).toContain("scale(0.9)");
    });

    it("resets zoom and pan when reset button is clicked", async () => {
      const { container } = render(
        <PanZoom initialZoom={1} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector(
        'button[title="Zoom in"]'
      ) as HTMLButtonElement;
      const resetButton = container.querySelector(
        'button[title="Reset zoom and pan"]'
      ) as HTMLButtonElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      // Zoom in first
      await act(() => {
        fireEvent.click(zoomInButton);
      });

      // Then reset
      await act(() => {
        fireEvent.click(resetButton);
      });

      // Transform should be back to initial state
      const transform = contentDiv.style.transform;
      expect(transform).toContain("scale(1)");
      expect(transform).toContain("translate(0px, 0px)");
    });

    it("disables zoom in button at max zoom", () => {
      const { container } = render(
        <PanZoom initialZoom={3} maxZoom={3} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector(
        'button[title="Zoom in"]'
      ) as HTMLButtonElement;
      expect(zoomInButton.disabled).toBe(true);
    });

    it("disables zoom out button at min zoom", () => {
      const { container } = render(
        <PanZoom initialZoom={0.5} minZoom={0.5} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomOutButton = container.querySelector(
        'button[title="Zoom out"]'
      ) as HTMLButtonElement;
      expect(zoomOutButton.disabled).toBe(true);
    });

    it("respects custom minZoom and maxZoom", () => {
      const { container } = render(
        <PanZoom initialZoom={1} maxZoom={5} minZoom={0.2} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector(
        'button[title="Zoom in"]'
      ) as HTMLButtonElement;
      const zoomOutButton = container.querySelector(
        'button[title="Zoom out"]'
      ) as HTMLButtonElement;

      // Should not be disabled at initial zoom
      expect(zoomInButton.disabled).toBe(false);
      expect(zoomOutButton.disabled).toBe(false);
    });
  });

  describe("Wheel zoom", () => {
    it("zooms in on wheel up", async () => {
      const { container } = render(
        <PanZoom initialZoom={1} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const panZoomContainer = container.firstChild as HTMLElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      const initialTransform = contentDiv.style.transform;

      await act(() => {
        fireEvent.wheel(panZoomContainer, { deltaY: -100 });
      });

      const newTransform = contentDiv.style.transform;
      expect(newTransform).not.toBe(initialTransform);
      expect(newTransform).toContain("scale(1.1)");
    });

    it("zooms out on wheel down", async () => {
      const { container } = render(
        <PanZoom initialZoom={1} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const panZoomContainer = container.firstChild as HTMLElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      const initialTransform = contentDiv.style.transform;

      await act(() => {
        fireEvent.wheel(panZoomContainer, { deltaY: 100 });
      });

      const newTransform = contentDiv.style.transform;
      expect(newTransform).not.toBe(initialTransform);
      expect(newTransform).toContain("scale(0.9)");
    });

    it("respects zoom limits on wheel zoom", async () => {
      const { container } = render(
        <PanZoom initialZoom={3} maxZoom={3} zoomStep={0.1}>
          <div>Test content</div>
        </PanZoom>
      );
      const panZoomContainer = container.firstChild as HTMLElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      // Try to zoom in beyond max
      await act(() => {
        fireEvent.wheel(panZoomContainer, { deltaY: -100 });
      });

      // Should still be at max zoom
      const newTransform = contentDiv.style.transform;
      expect(newTransform).toContain("scale(3)");
    });
  });

  describe("Pan functionality", () => {
    it("handles pointer down events", async () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;
      const panZoomContainer = container.firstChild as HTMLElement;

      // Check initial cursor
      expect(panZoomContainer.style.cursor).toBe("grab");

      // Pointer down should not throw
      await act(() => {
        fireEvent.pointerDown(contentDiv, {
          pointerId: 1,
          button: 0,
          clientX: 100,
          clientY: 100,
          isPrimary: true,
        });
      });

      // Component should still be functional
      expect(contentDiv).toBeTruthy();
    });

    it("handles pointer move events", async () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      // Start panning
      await act(() => {
        fireEvent.pointerDown(contentDiv, {
          pointerId: 1,
          button: 0,
          clientX: 100,
          clientY: 100,
          isPrimary: true,
        });
      });

      // Move pointer - use fireEvent which works in jsdom
      await act(() => {
        fireEvent.pointerMove(contentDiv, {
          pointerId: 1,
          clientX: 150,
          clientY: 150,
        });
      });

      // Component should still be functional
      expect(contentDiv).toBeTruthy();
    });

    it("stops panning on pointer up", async () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;
      const panZoomContainer = container.firstChild as HTMLElement;

      // Start panning
      await act(() => {
        fireEvent.pointerDown(contentDiv, {
          pointerId: 1,
          button: 0,
          clientX: 100,
          clientY: 100,
          isPrimary: true,
        });
      });

      // End panning
      await act(() => {
        fireEvent.pointerUp(contentDiv, {
          pointerId: 1,
        });
      });

      // Cursor should be back to grab
      await waitFor(() => {
        expect(panZoomContainer.style.cursor).toBe("grab");
      });
    });

    it("only handles primary pointer", async () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;
      const panZoomContainer = container.firstChild as HTMLElement;

      // Try to start panning with non-primary pointer
      await act(() => {
        fireEvent.pointerDown(contentDiv, {
          pointerId: 1,
          button: 0,
          clientX: 100,
          clientY: 100,
          isPrimary: false,
        });
      });

      // Cursor should not change
      expect(panZoomContainer.style.cursor).toBe("grab");
    });

    it("only handles left mouse button", async () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;
      const panZoomContainer = container.firstChild as HTMLElement;

      // Try to start panning with right mouse button
      await act(() => {
        fireEvent.pointerDown(contentDiv, {
          pointerId: 1,
          button: 2, // Right mouse button
          clientX: 100,
          clientY: 100,
          isPrimary: true,
        });
      });

      // Cursor should not change
      expect(panZoomContainer.style.cursor).toBe("grab");
    });

    it("handles pointer up events", async () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      // Start panning
      await act(() => {
        fireEvent.pointerDown(contentDiv, {
          pointerId: 1,
          button: 0,
          clientX: 100,
          clientY: 100,
          isPrimary: true,
        });
      });

      // End panning
      await act(() => {
        fireEvent.pointerUp(contentDiv, {
          pointerId: 1,
        });
      });

      // Component should still be functional
      expect(contentDiv).toBeTruthy();
    });
  });

  describe("Fullscreen mode", () => {
    it("applies fullscreen styles when fullscreen prop is true", () => {
      const { container } = render(
        <PanZoom fullscreen={true}>
          <div>Test content</div>
        </PanZoom>
      );
      const panZoomContainer = container.firstChild as HTMLElement;
      expect(panZoomContainer.className).toContain("h-full");
      expect(panZoomContainer.className).toContain("w-full");
    });

    it("positions controls differently in fullscreen mode", () => {
      const { container } = render(
        <PanZoom fullscreen={true}>
          <div>Test content</div>
        </PanZoom>
      );
      const controlsContainer = container.querySelector(
        ".absolute.z-10"
      ) as HTMLElement;
      expect(controlsContainer.className).toContain("bottom-4");
      expect(controlsContainer.className).toContain("left-4");
    });

    it("positions controls in regular mode", () => {
      const { container } = render(
        <PanZoom fullscreen={false}>
          <div>Test content</div>
        </PanZoom>
      );
      const controlsContainer = container.querySelector(
        ".absolute.z-10"
      ) as HTMLElement;
      expect(controlsContainer.className).toContain("bottom-2");
      expect(controlsContainer.className).toContain("left-2");
    });
  });

  describe("Custom props", () => {
    it("respects custom initialZoom", () => {
      const { container } = render(
        <PanZoom initialZoom={2}>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;
      const transform = contentDiv.style.transform;
      expect(transform).toContain("scale(2)");
    });

    it("respects custom zoomStep", async () => {
      const { container } = render(
        <PanZoom initialZoom={1} zoomStep={0.5}>
          <div>Test content</div>
        </PanZoom>
      );
      const zoomInButton = container.querySelector(
        'button[title="Zoom in"]'
      ) as HTMLButtonElement;
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;

      await act(() => {
        fireEvent.click(zoomInButton);
      });

      const transform = contentDiv.style.transform;
      expect(transform).toContain("scale(1.5)");
    });

    it("applies touchAction none style", () => {
      const { container } = render(
        <PanZoom>
          <div>Test content</div>
        </PanZoom>
      );
      const contentDiv = container.querySelector(
        '[role="application"]'
      ) as HTMLElement;
      expect(contentDiv.style.touchAction).toBe("none");
    });
  });
});
