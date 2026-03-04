import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanZoom } from "../lib/mermaid/pan-zoom";

describe("PanZoom pointer interactions", () => {
  afterEach(() => {
    document.body.style.userSelect = "";
  });

  it("should start panning on primary pointer down", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;

    // Mock setPointerCapture
    content.setPointerCapture = vi.fn();

    fireEvent.pointerDown(content, {
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Cursor should change to grabbing
    const parentStyle = container.firstElementChild?.getAttribute("style");
    expect(parentStyle).toContain("grabbing");
    expect(content.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it("should not pan on non-primary pointer (isPrimary=false)", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;
    content.setPointerCapture = vi.fn();

    fireEvent.pointerDown(content, {
      button: 0,
      isPrimary: false,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Should still be grab, not grabbing
    const parentStyle = container.firstElementChild?.getAttribute("style");
    expect(parentStyle).toContain("grab");
    expect(parentStyle).not.toContain("grabbing");
  });

  it("should update pan on pointer move while panning", async () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;
    content.setPointerCapture = vi.fn();
    content.releasePointerCapture = vi.fn();

    // Start panning
    fireEvent.pointerDown(content, {
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Move pointer - dispatch native event on content element
    act(() => {
      const moveEvent = new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 120,
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(moveEvent);
    });

    await waitFor(() => {
      const transform = content.getAttribute("style");
      expect(transform).toContain("translate(50px, 20px)");
    });
  });

  it("should stop panning on pointer up", async () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;
    content.setPointerCapture = vi.fn();
    content.releasePointerCapture = vi.fn();

    // Start panning
    fireEvent.pointerDown(content, {
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Pointer up
    act(() => {
      const upEvent = new PointerEvent("pointerup", {
        clientX: 150,
        clientY: 120,
        bubbles: true,
        pointerId: 1,
      });
      content.dispatchEvent(upEvent);
    });

    await waitFor(() => {
      const parentStyle = container.firstElementChild?.getAttribute("style");
      expect(parentStyle).toContain("grab");
    });
  });

  it("should handle pointer cancel", async () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;
    content.setPointerCapture = vi.fn();
    content.releasePointerCapture = vi.fn();

    // Start panning
    fireEvent.pointerDown(content, {
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    // Cancel
    act(() => {
      const cancelEvent = new PointerEvent("pointercancel", {
        bubbles: true,
        pointerId: 1,
      });
      content.dispatchEvent(cancelEvent);
    });

    await waitFor(() => {
      const parentStyle = container.firstElementChild?.getAttribute("style");
      expect(parentStyle).toContain("grab");
    });
  });

  it("should prevent text selection while panning", () => {
    const { container } = render(
      <PanZoom>
        <div>Content</div>
      </PanZoom>
    );

    const content = container.querySelector(
      '[role="application"]'
    ) as HTMLElement;
    content.setPointerCapture = vi.fn();

    fireEvent.pointerDown(content, {
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });

    expect(document.body.style.userSelect).toBe("none");
  });

  it("should handle wheel zoom down (zoom out)", async () => {
    const { container } = render(
      <PanZoom initialZoom={1} zoomStep={0.1}>
        <div>Content</div>
      </PanZoom>
    );

    const containerDiv = container.firstElementChild;
    const content = container.querySelector('[role="application"]');

    // Wheel down = zoom out
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      containerDiv?.dispatchEvent(wheelEvent);
    });

    await waitFor(() => {
      const transform = content?.getAttribute("style");
      expect(transform).toContain("scale(0.9)");
    });
  });

  it("should position controls based on fullscreen prop", () => {
    const { container } = render(
      <PanZoom fullscreen={true}>
        <div>Content</div>
      </PanZoom>
    );

    // Fullscreen controls should use bottom-4 left-4
    const controls = container.querySelector(".absolute.z-10");
    expect(controls?.className).toContain("bottom-4");
    expect(controls?.className).toContain("left-4");
  });

  it("should position controls at bottom-2 left-2 when not fullscreen", () => {
    const { container } = render(
      <PanZoom fullscreen={false}>
        <div>Content</div>
      </PanZoom>
    );

    const controls = container.querySelector(".absolute.z-10");
    expect(controls?.className).toContain("bottom-2");
    expect(controls?.className).toContain("left-2");
  });
});
