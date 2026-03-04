import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { PluginContext } from "../lib/plugin-context";

// Must mock the Mermaid component that fullscreen-button imports
vi.mock("../lib/mermaid", () => ({
  Mermaid: ({ chart, className }: any) => (
    <div className={className} data-testid="mermaid">
      {chart}
    </div>
  ),
}));

// Import after mock
import { MermaidFullscreenButton } from "../lib/mermaid/fullscreen-button";

describe("MermaidFullscreenButton", () => {
  const defaultContext = {
    shikiTheme: ["github-light", "github-dark"] as [string, string],
    controls: true,
    isAnimating: false,
    mode: "streaming" as const,
  };

  const renderWithContext = (props: any, contextOverrides = {}) => {
    return render(
      <PluginContext.Provider value={{}}>
        <StreamdownContext.Provider
          value={{ ...defaultContext, ...contextOverrides }}
        >
          <MermaidFullscreenButton {...props} />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );
  };

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("should render fullscreen button", () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });
    const button = container.querySelector('button[title="View fullscreen"]');
    expect(button).toBeTruthy();
  });

  it("should open fullscreen portal on click", async () => {
    const onFullscreen = vi.fn();
    const { container } = renderWithContext({
      chart: "graph TD; A-->B",
      onFullscreen,
    });

    const button = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    await waitFor(() => {
      // Portal creates elements on document.body
      const portal = document.querySelector(".fixed.inset-0");
      expect(portal).toBeTruthy();
    });

    expect(onFullscreen).toHaveBeenCalled();
  });

  it("should lock body scroll when fullscreen opens", () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const button = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should close fullscreen on Escape key (document listener)", async () => {
    const onExit = vi.fn();
    const { container } = renderWithContext({
      chart: "graph TD; A-->B",
      onExit,
    });

    const button = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    // Press Escape via document listener
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeFalsy();
    });

    expect(onExit).toHaveBeenCalled();
  });

  it("should close fullscreen on backdrop click", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    // Click the backdrop
    const backdrop = document.querySelector(".fixed.inset-0");
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(backdrop!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeFalsy();
    });
  });

  it("should close fullscreen on X button click", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      const exitButton = document.querySelector(
        'button[title="Exit fullscreen"]'
      );
      expect(exitButton).toBeTruthy();
    });

    const exitButton = document.querySelector(
      'button[title="Exit fullscreen"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(exitButton!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeFalsy();
    });
  });

  it("should handle Escape key on backdrop element", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    // Press Escape on the backdrop div directly
    const backdrop = document.querySelector(".fixed.inset-0");
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.keyDown(backdrop!, { key: "Escape" });

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeFalsy();
    });
  });

  it("should stop event propagation on content area click", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    // Click on content (role=presentation) - should not close
    const contentArea = document.querySelector('[role="presentation"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(contentArea!);

    // Should still be open
    expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
  });

  it("should stop keydown propagation on content area", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    // Press Escape on content area - should not close
    const contentArea = document.querySelector('[role="presentation"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.keyDown(contentArea!, { key: "Escape" });

    // Should still be open
    expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
  });

  it("should unlock body scroll when fullscreen closes", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("should be disabled when isAnimating", () => {
    const { container } = renderWithContext(
      { chart: "graph TD; A-->B" },
      { isAnimating: true }
    );

    const button = container.querySelector('button[title="View fullscreen"]');
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("should render Mermaid component in fullscreen portal", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      const mermaid = document.querySelector('[data-testid="mermaid"]');
      expect(mermaid).toBeTruthy();
      expect(mermaid?.textContent).toContain("graph TD; A-->B");
    });
  });
});
