import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { PanZoom } from "../lib/pan-zoom";

describe("PanZoom", () => {
  beforeEach(() => {
    // Reset body styles before each test
    document.body.style.userSelect = "";
    document.body.style.overflow = "";
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
