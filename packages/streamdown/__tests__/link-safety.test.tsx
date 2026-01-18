import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext, type StreamdownContextType } from "../index";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";

type RequiredComponents = Required<NonNullable<Options["components"]>>;
const components = importedComponents as RequiredComponents;

describe("Link Safety Modal", () => {
  const createContextValue = (
    linkSafety?: StreamdownContextType["linkSafety"]
  ): StreamdownContextType => ({
    shikiTheme: ["github-light", "github-dark"],
    controls: true,
    isAnimating: false,
    mode: "streaming",
    mermaid: undefined,
    linkSafety,
  });

  it("should render link normally when linkSafety is not enabled", () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }
    const { container } = render(
      <StreamdownContext.Provider value={createContextValue()}>
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("https://example.com");
    // Modal should not exist
    expect(
      container.querySelector('[data-streamdown="link-safety-modal"]')
    ).toBeNull();
  });

  it("should intercept click and show modal when linkSafety is enabled", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true })}
      >
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    expect(link).toBeTruthy();

    // Click the link
    fireEvent.click(link!);

    // Modal should appear
    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });

    // Modal should display the URL
    const modal = document.querySelector(
      '[data-streamdown="link-safety-modal"]'
    );
    expect(modal?.textContent).toContain("https://example.com");
  });

  it("should call onLinkCheck and skip modal when it returns true", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const onLinkCheck = vi.fn().mockReturnValue(true);
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true, onLinkCheck })}
      >
        <A href="https://trusted.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      expect(onLinkCheck).toHaveBeenCalledWith("https://trusted.com");
    });

    // Should open the link directly
    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://trusted.com",
      "_blank",
      "noreferrer"
    );

    // Modal should NOT appear
    const modal = document.querySelector(
      '[data-streamdown="link-safety-modal"]'
    );
    expect(modal).toBeNull();

    windowOpenSpy.mockRestore();
  });

  it("should show modal when onLinkCheck returns false", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const onLinkCheck = vi.fn().mockReturnValue(false);

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true, onLinkCheck })}
      >
        <A href="https://untrusted.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      expect(onLinkCheck).toHaveBeenCalledWith("https://untrusted.com");
    });

    // Modal should appear
    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });
  });

  it("should open link when clicking Open link button in modal", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true })}
      >
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });

    // Find and click the "Open link" button
    const buttons = document.querySelectorAll(
      '[data-streamdown="link-safety-modal"] button'
    );
    const openButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("Open link")
    );
    expect(openButton).toBeTruthy();
    fireEvent.click(openButton!);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noreferrer"
    );

    windowOpenSpy.mockRestore();
  });

  it("should copy link to clipboard when clicking Copy link button", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true })}
      >
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });

    // Find and click the "Copy link" button (first button after close)
    const buttons = document.querySelectorAll(
      '[data-streamdown="link-safety-modal"] button'
    );
    // First button is close, then copy, then open
    const copyButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("Copy link")
    );
    expect(copyButton).toBeTruthy();
    fireEvent.click(copyButton!);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("https://example.com");
    });
  });

  it("should close modal when clicking backdrop", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true })}
      >
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });

    // Click the backdrop (the outer div)
    const backdrop = document.querySelector(
      '[data-streamdown="link-safety-modal"]'
    );
    fireEvent.click(backdrop!);

    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeNull();
    });
  });

  it("should close modal when pressing Escape key", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true })}
      >
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeNull();
    });
  });

  it("should not show modal for incomplete links", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true })}
      >
        <A href="streamdown:incomplete-link" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    // Modal should NOT appear for incomplete links
    const modal = document.querySelector(
      '[data-streamdown="link-safety-modal"]'
    );
    expect(modal).toBeNull();
  });

  it("should work with async onLinkCheck callback", async () => {
    const A = components.a;
    if (!A) {
      throw new Error("A component not found");
    }

    const onLinkCheck = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(false), 10);
        })
    );

    const { container } = render(
      <StreamdownContext.Provider
        value={createContextValue({ enabled: true, onLinkCheck })}
      >
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      </StreamdownContext.Provider>
    );

    const link = container.querySelector("a");
    fireEvent.click(link!);

    await waitFor(() => {
      expect(onLinkCheck).toHaveBeenCalled();
    });

    // Modal should appear after async check
    await waitFor(() => {
      const modal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(modal).toBeTruthy();
    });
  });

  describe("Custom Modal", () => {
    it("should use custom renderModal when provided", async () => {
      const A = components.a;
      if (!A) {
        throw new Error("A component not found");
      }

      const CustomModal = vi.fn(({ url, isOpen, onClose, onConfirm }) => {
        if (!isOpen) return null;
        return (
          <div data-testid="custom-modal">
            <span data-testid="custom-url">{url}</span>
            <button data-testid="custom-close" onClick={onClose} type="button">
              Close
            </button>
            <button
              data-testid="custom-confirm"
              onClick={onConfirm}
              type="button"
            >
              Confirm
            </button>
          </div>
        );
      });

      const { container } = render(
        <StreamdownContext.Provider
          value={createContextValue({
            enabled: true,
            renderModal: CustomModal,
          })}
        >
          <A href="https://example.com" node={null as any}>
            Link text
          </A>
        </StreamdownContext.Provider>
      );

      const link = container.querySelector("a");
      fireEvent.click(link!);

      // Custom modal should appear
      await waitFor(() => {
        const customModal = document.querySelector(
          '[data-testid="custom-modal"]'
        );
        expect(customModal).toBeTruthy();
      });

      // Default modal should NOT appear
      const defaultModal = document.querySelector(
        '[data-streamdown="link-safety-modal"]'
      );
      expect(defaultModal).toBeNull();

      // Custom modal should receive correct props
      expect(CustomModal).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com",
          isOpen: true,
          onClose: expect.any(Function),
          onConfirm: expect.any(Function),
        })
      );

      // URL should be displayed
      const urlElement = document.querySelector('[data-testid="custom-url"]');
      expect(urlElement?.textContent).toBe("https://example.com");
    });

    it("should call onConfirm from custom modal", async () => {
      const A = components.a;
      if (!A) {
        throw new Error("A component not found");
      }

      const windowOpenSpy = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);

      const CustomModal = ({ url, isOpen, onConfirm }: any) => {
        if (!isOpen) return null;
        return (
          <button
            data-testid="custom-confirm"
            onClick={onConfirm}
            type="button"
          >
            Open {url}
          </button>
        );
      };

      const { container } = render(
        <StreamdownContext.Provider
          value={createContextValue({
            enabled: true,
            renderModal: CustomModal,
          })}
        >
          <A href="https://example.com" node={null as any}>
            Link text
          </A>
        </StreamdownContext.Provider>
      );

      const link = container.querySelector("a");
      fireEvent.click(link!);

      await waitFor(() => {
        const confirmButton = document.querySelector(
          '[data-testid="custom-confirm"]'
        );
        expect(confirmButton).toBeTruthy();
      });

      const confirmButton = document.querySelector(
        '[data-testid="custom-confirm"]'
      );
      fireEvent.click(confirmButton!);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        "https://example.com",
        "_blank",
        "noreferrer"
      );

      windowOpenSpy.mockRestore();
    });

    it("should call onClose from custom modal", async () => {
      const A = components.a;
      if (!A) {
        throw new Error("A component not found");
      }

      const CustomModal = ({ isOpen, onClose }: any) => {
        if (!isOpen) return null;
        return (
          <button data-testid="custom-close" onClick={onClose} type="button">
            Close
          </button>
        );
      };

      const { container } = render(
        <StreamdownContext.Provider
          value={createContextValue({
            enabled: true,
            renderModal: CustomModal,
          })}
        >
          <A href="https://example.com" node={null as any}>
            Link text
          </A>
        </StreamdownContext.Provider>
      );

      const link = container.querySelector("a");
      fireEvent.click(link!);

      await waitFor(() => {
        const closeButton = document.querySelector(
          '[data-testid="custom-close"]'
        );
        expect(closeButton).toBeTruthy();
      });

      const closeButton = document.querySelector(
        '[data-testid="custom-close"]'
      );
      fireEvent.click(closeButton!);

      // Modal should close (custom modal returns null when not open)
      await waitFor(() => {
        const modal = document.querySelector('[data-testid="custom-close"]');
        expect(modal).toBeNull();
      });
    });
  });
});
