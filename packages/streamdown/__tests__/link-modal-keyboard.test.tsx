import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinkSafetyModal } from "../lib/link-modal";

describe("LinkSafetyModal keyboard and interaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call onClose when Escape key is pressed on backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    const backdrop = container.querySelector(
      '[data-streamdown="link-safety-modal"]'
    );
    expect(backdrop).toBeTruthy();

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.keyDown(backdrop!, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("should not call onClose for non-Escape keys on backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    const backdrop = container.querySelector(
      '[data-streamdown="link-safety-modal"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.keyDown(backdrop!, { key: "Enter" });
    // onClose should only have been called 0 times (not from keyDown)
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should stop propagation when clicking inner modal content", () => {
    const onClose = vi.fn();
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    // Click the inner content area (role=presentation)
    const innerContent = container.querySelector('[role="presentation"]');
    expect(innerContent).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(innerContent!);

    // onClose should NOT be called because click is stopped
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should stop key propagation on inner content", () => {
    const onClose = vi.fn();
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    const innerContent = container.querySelector('[role="presentation"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.keyDown(innerContent!, { key: "Escape" });

    // onClose should NOT be called because keydown is stopped
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should return null when not open", () => {
    const { container } = render(
      <LinkSafetyModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    expect(
      container.querySelector('[data-streamdown="link-safety-modal"]')
    ).toBeNull();
  });

  it("should lock body scroll when opened", () => {
    render(
      <LinkSafetyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should unlock body scroll when closed", () => {
    const { unmount } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("should call onConfirm and onClose when Open link is clicked", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        url="https://example.com"
      />
    );

    const buttons = container.querySelectorAll("button");
    const openButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("Open link")
    );
    expect(openButton).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openButton!);

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("should handle clipboard copy failure gracefully", async () => {
    // Mock clipboard to throw
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Copy failed")),
      },
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    const buttons = container.querySelectorAll("button");
    const copyButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("Copy link")
    );
    expect(copyButton).toBeTruthy();

    // Should not throw
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(copyButton!);

    // Wait for async operation
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://example.com"
      );
    });
  });

  it("should show long URL with scrollable container", () => {
    const longUrl = `https://example.com/${"a".repeat(150)}`;
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        url={longUrl}
      />
    );

    // URL display should have overflow class for long URLs
    const urlDisplay = container.querySelector(".break-all");
    expect(urlDisplay).toBeTruthy();
    expect(urlDisplay?.className).toContain("max-h-32");
    expect(urlDisplay?.className).toContain("overflow-y-auto");
  });

  it("should close via document Escape keydown listener", () => {
    const onClose = vi.fn();
    render(
      <LinkSafetyModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    // Fire on document level (the useEffect handler)
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
