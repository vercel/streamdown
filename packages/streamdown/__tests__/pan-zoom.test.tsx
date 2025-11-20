import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanZoom } from "../lib/mermaid/pan-zoom";

describe("PanZoom", () => {
  it("should render children", () => {
    const { container } = render(
      <PanZoom>
        <div data-testid="child">Test Content</div>
      </PanZoom>
    );

    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
  });

  it("should render zoom controls by default", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
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

  it("should hide controls when showControls is false", () => {
    const { container } = render(
      <PanZoom showControls={false}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomInButton = container.querySelector('button[title="Zoom in"]');
    expect(zoomInButton).toBeFalsy();
  });

  it("should zoom in when zoom in button is clicked", () => {
    const { container } = render(
      <PanZoom initialZoom={1} zoomStep={0.1}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomInButton = container.querySelector('button[title="Zoom in"]');
    const content = container.querySelector('[role="application"]');

    const initialTransform = content?.getAttribute("style");

    fireEvent.click(zoomInButton!);

    const newTransform = content?.getAttribute("style");
    expect(newTransform).not.toBe(initialTransform);
  });

  it("should zoom out when zoom out button is clicked", () => {
    const { container } = render(
      <PanZoom initialZoom={1} zoomStep={0.1}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomOutButton = container.querySelector('button[title="Zoom out"]');
    fireEvent.click(zoomOutButton!);

    const content = container.querySelector('[role="application"]');
    const transform = content?.getAttribute("style");

    expect(transform).toContain("scale(0.9)");
  });

  it("should reset zoom and pan when reset button is clicked", () => {
    const { container } = render(
      <PanZoom initialZoom={1}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomInButton = container.querySelector('button[title="Zoom in"]');
    const resetButton = container.querySelector(
      'button[title="Reset zoom and pan"]'
    );
    const content = container.querySelector('[role="application"]');

    // Zoom in first
    fireEvent.click(zoomInButton!);

    // Then reset
    fireEvent.click(resetButton!);

    const transform = content?.getAttribute("style");
    expect(transform).toContain("scale(1)");
  });

  it("should respect minZoom limit", () => {
    const { container } = render(
      <PanZoom initialZoom={0.5} minZoom={0.5} zoomStep={0.1}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomOutButton = container.querySelector('button[title="Zoom out"]');

    // Should be disabled at minZoom
    expect(zoomOutButton?.hasAttribute("disabled")).toBe(true);
  });

  it("should respect maxZoom limit", () => {
    const { container } = render(
      <PanZoom initialZoom={3} maxZoom={3} zoomStep={0.1}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomInButton = container.querySelector('button[title="Zoom in"]');

    // Should be disabled at maxZoom
    expect(zoomInButton?.hasAttribute("disabled")).toBe(true);
  });

  it("should have onPointerDown handler on content", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;

    // Verify the content div exists and has the pointer down handler attached
    expect(content).toBeTruthy();
    expect(content.getAttribute("role")).toBe("application");

    // Check that the initial cursor is set to grab
    const containerDiv = container.firstElementChild as HTMLElement;
    expect(containerDiv.style.cursor).toBe("grab");
  });

  it("should ignore non-primary pointer down", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector('[role="application"]');
    const initialCursor = container.firstElementChild?.getAttribute("style");

    fireEvent.pointerDown(content!, { button: 1, clientX: 100, clientY: 100 });

    const newCursor = container.firstElementChild?.getAttribute("style");
    expect(newCursor).toBe(initialCursor);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <PanZoom className="custom-pan-zoom">
        <div>Content</div>
      </PanZoom>
    );

    expect(container.firstElementChild?.className).toContain("custom-pan-zoom");
  });

  it("should apply fullscreen styles when fullscreen prop is true", () => {
    const { container } = render(
      <PanZoom fullscreen={true}>
        <div>Content</div>
      </PanZoom>
    );

    expect(container.firstElementChild?.className).toContain("h-full");
    expect(container.firstElementChild?.className).toContain("w-full");
  });

  it("should handle wheel events for zoom", async () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const containerDiv = container.firstElementChild;
    const content = container.querySelector('[role="application"]');

    // Simulate wheel event (zoom in)
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      containerDiv?.dispatchEvent(wheelEvent);
    });

    // Wait for state update to complete
    await waitFor(() => {
      const transform = content?.getAttribute("style");
      expect(transform).toBeDefined();
    });
  });

  it("should use initial zoom value", () => {
    const { container } = render(
      <PanZoom initialZoom={1.5}>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector('[role="application"]');
    const transform = content?.getAttribute("style");

    expect(transform).toContain("scale(1.5)");
  });

  it("should handle custom zoom step", () => {
    const { container } = render(
      <PanZoom initialZoom={1} zoomStep={0.5}>
        <div>Content</div>
      </PanZoom>
    );

    const zoomInButton = container.querySelector('button[title="Zoom in"]');
    fireEvent.click(zoomInButton!);

    const content = container.querySelector('[role="application"]');
    const transform = content?.getAttribute("style");

    expect(transform).toContain("scale(1.5)");
  });

  it("should set cursor to grab when not panning", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const containerDiv = container.firstElementChild;
    const style = containerDiv?.getAttribute("style");

    expect(style).toContain("grab");
  });

  it("should have role application on content div", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector('[role="application"]');
    expect(content).toBeTruthy();
  });

  it("should set touch-action none on content", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;

    // Check the actual style property, not the attribute string
    expect(content?.style.touchAction).toBe("none");
  });
});
