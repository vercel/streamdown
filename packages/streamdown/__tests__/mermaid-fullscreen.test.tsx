import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { PluginContext } from "../lib/plugin-context";
import type { DiagramPlugin, MermaidInstance } from "../lib/plugin-types";

// Must mock the Mermaid component that fullscreen-button imports
vi.mock("../lib/mermaid", () => ({
  Mermaid: ({ chart, className }: any) => (
    <div className={className} data-testid="mermaid">
      {chart}
    </div>
  ),
}));

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

vi.mock("../lib/mermaid/utils", async () => {
  const actual = await vi.importActual("../lib/mermaid/utils");
  return {
    ...actual,
    svgToPngBlob: vi
      .fn()
      .mockResolvedValue(new Blob(["png"], { type: "image/png" })),
  };
});

import { MermaidFullscreenButton } from "../lib/mermaid/fullscreen-button";
// Import after mocks
import { save } from "../lib/utils";

describe("MermaidFullscreenButton", () => {
  const defaultContext = {
    shikiTheme: ["github-light", "github-dark"] as [string, string],
    controls: true,
    isAnimating: false,
    mode: "streaming" as const,
  };

  const createMockPlugin = (
    renderResult = { svg: "<svg><text>Chart</text></svg>" }
  ): DiagramPlugin => {
    const mockInstance: MermaidInstance = {
      initialize: vi.fn(),
      render: vi.fn().mockResolvedValue(renderResult),
    };
    return {
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: vi.fn().mockReturnValue(mockInstance),
    };
  };

  const renderWithContext = (
    props: any,
    contextOverrides = {},
    plugin: DiagramPlugin | undefined = undefined
  ) => {
    return render(
      <PluginContext.Provider value={plugin ? { mermaid: plugin } : {}}>
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

  it("should render a working download button inside the fullscreen portal", async () => {
    const plugin = createMockPlugin();
    const { container } = renderWithContext(
      { chart: "graph TD; A-->B" },
      {},
      plugin
    );

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    const downloadBtn = document.querySelector(
      'button[title="Download diagram"]'
    );
    expect(downloadBtn).toBeTruthy();

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(downloadBtn!);

    const pngOption = await waitFor(() =>
      document.querySelector('button[title="Download diagram as PNG"]')
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(pngOption!);

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "diagram.png",
        expect.any(Blob),
        "image/png"
      );
    });

    // Fullscreen should still be open — downloading must not close it.
    expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
  });

  it("should hide the fullscreen download button when the download control is disabled", async () => {
    const plugin = createMockPlugin();
    const { container } = renderWithContext(
      { chart: "graph TD; A-->B" },
      { controls: { mermaid: { download: false } } },
      plugin
    );

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).toBeTruthy();
    });

    expect(
      document.querySelector('button[title="Download diagram"]')
    ).toBeFalsy();
  });

  it("should portal fullscreen overlay to the configured portal target", async () => {
    const portalRoot = document.createElement("div");
    document.body.appendChild(portalRoot);

    const { container, unmount } = renderWithContext(
      { chart: "graph TD; A-->B" },
      { portal: () => portalRoot }
    );

    const openBtn = container.querySelector('button[title="View fullscreen"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(openBtn!);

    await waitFor(() => {
      expect(
        portalRoot.querySelector('[data-streamdown="mermaid-fullscreen"]')
      ).toBeTruthy();
    });

    unmount();
    portalRoot.remove();
  });
});
