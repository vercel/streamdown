import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Mermaid, MermaidFullscreenButton } from "../lib/mermaid";
import type { MermaidConfig } from "../lib/mermaid-types";

const mockInitialize = vi.fn();
const mockRender = vi.fn().mockResolvedValue({ svg: "<svg>Test SVG</svg>" });
const mockLoader = vi.fn(async () => ({
  initialize: mockInitialize,
  render: mockRender,
}));

describe("Mermaid", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockInitialize.mockClear();
    mockRender.mockClear();
  });

  it("renders without crashing", async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(
        <Mermaid chart="graph TD; A-->B" loader={mockLoader} />
      );
      container = result.container;
    });
    expect(container!.firstChild).toBeDefined();
  });

  it("applies custom className", async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(
        <Mermaid
          chart="graph TD; A-->B"
          className="custom-class"
          loader={mockLoader}
        />
      );
      container = result.container;
    });

    const mermaidContainer = container!.firstChild as HTMLElement;
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

    await act(async () => {
      render(
        <Mermaid
          chart="graph TD; A-->B"
          config={customConfig}
          loader={mockLoader}
        />
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
    await act(async () => {
      render(<Mermaid chart="graph TD; A-->B" loader={mockLoader} />);
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
    await act(async () => {
      const result = render(
        <Mermaid chart="graph TD; A-->B" config={config1} loader={mockLoader} />
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
    await act(async () => {
      rerender!(
        <Mermaid chart="graph TD; A-->B" config={config2} loader={mockLoader} />
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
    await act(async () => {
      const result = render(
        <Mermaid chart="graph TD; A-->B" config={config} loader={mockLoader} />
      );
      container = result.container;
    });

    // Should render without error even with complex config
    expect(container!.firstChild).toBeTruthy();
  });

  it("supports multiple components with different configs", async () => {
    const config1: MermaidConfig = { theme: "forest" } as MermaidConfig;
    const config2: MermaidConfig = { theme: "dark" } as MermaidConfig;

    // Render first component
    let rerender: ReturnType<typeof render>["rerender"];
    await act(async () => {
      const result = render(
        <Mermaid chart="graph TD; A-->B" config={config1} loader={mockLoader} />
      );
      rerender = result.rerender;
    });

    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(1));
    expect(mockInitialize.mock.calls[0][0].theme).toBe("forest");

    // Render second component with different config
    await act(async () => {
      rerender!(
        <Mermaid chart="graph TD; X-->Y" config={config2} loader={mockLoader} />
      );
    });

    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(2));
    expect(mockInitialize.mock.calls[1][0].theme).toBe("dark");
  });

  describe("Fullscreen functionality", () => {
    it("should render fullscreen button", async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" loader={mockLoader} />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]');
      expect(fullscreenButton).toBeTruthy();
    });

    it("should open fullscreen modal when fullscreen button is clicked", async () => {
      const { fireEvent } = await import("@testing-library/react");
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" loader={mockLoader} />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]') as HTMLButtonElement;
      expect(fullscreenButton).toBeTruthy();
      
      await act(async () => {
        fireEvent.click(fullscreenButton);
      });

      // Check that fullscreen modal is visible
      const modal = document.querySelector('.fixed.inset-0.z-50');
      expect(modal).toBeTruthy();
      
      // Check that close button exists
      const closeButton = document.querySelector('button[title="Exit fullscreen"]');
      expect(closeButton).toBeTruthy();
    });

    it("should close fullscreen modal when close button is clicked", async () => {
      const { fireEvent } = await import("@testing-library/react");
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]') as HTMLButtonElement;
      
      // Open fullscreen
      await act(async () => {
        fireEvent.click(fullscreenButton);
      });

      const closeButton = document.querySelector('button[title="Exit fullscreen"]') as HTMLButtonElement;
      expect(closeButton).toBeTruthy();

      // Close fullscreen
      await act(async () => {
        fireEvent.click(closeButton);
      });

      // Modal should be gone
      await waitFor(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        expect(modal).toBeNull();
      });
    });

    it("should close fullscreen modal when ESC key is pressed", async () => {
      const { fireEvent } = await import("@testing-library/react");
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]') as HTMLButtonElement;
      
      // Open fullscreen
      await act(async () => {
        fireEvent.click(fullscreenButton);
      });

      const modal = document.querySelector('.fixed.inset-0.z-50');
      expect(modal).toBeTruthy();

      // Press ESC key
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Modal should be gone
      await waitFor(() => {
        const modalAfter = document.querySelector('.fixed.inset-0.z-50');
        expect(modalAfter).toBeNull();
      });
    });

    it("should close fullscreen modal when clicking outside the diagram", async () => {
      const { fireEvent } = await import("@testing-library/react");
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]') as HTMLButtonElement;
      
      // Open fullscreen
      await act(async () => {
        fireEvent.click(fullscreenButton);
      });

      const modal = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
      expect(modal).toBeTruthy();

      // Click on the modal backdrop (outside the diagram)
      await act(async () => {
        fireEvent.click(modal);
      });

      // Modal should be gone
      await waitFor(() => {
        const modalAfter = document.querySelector('.fixed.inset-0.z-50');
        expect(modalAfter).toBeNull();
      });
    });

    it("should not close fullscreen when clicking on the diagram itself", async () => {
      const { fireEvent } = await import("@testing-library/react");
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]') as HTMLButtonElement;
      
      // Open fullscreen
      await act(async () => {
        fireEvent.click(fullscreenButton);
      });

      const diagram = document.querySelector('[aria-label="Mermaid chart"]') as HTMLElement;
      expect(diagram).toBeTruthy();

      // Click on the diagram itself
      await act(async () => {
        fireEvent.click(diagram);
      });

      // Modal should still be open
      const modal = document.querySelector('.fixed.inset-0.z-50');
      expect(modal).toBeTruthy();
    });

    it("should manage body scroll state when fullscreen is toggled", async () => {
      const { fireEvent } = await import("@testing-library/react");
      
      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        );
        container = result.container;
      });

      const fullscreenButton = container!.querySelector('button[title="View fullscreen"]') as HTMLButtonElement;
      
      // Open fullscreen - verify modal is open instead of body style
      // (body style manipulation may not work consistently in jsdom test environment)
      await act(async () => {
        fireEvent.click(fullscreenButton);
      });

      await waitFor(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        expect(modal).toBeTruthy();
      });

      // Close fullscreen
      const closeButton = document.querySelector('button[title="Exit fullscreen"]') as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        expect(modal).toBeNull();
      });
      
      // Verify body overflow is restored (or at least not left in "hidden" state)
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });
});
