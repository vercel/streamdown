import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { MermaidDownloadDropdown } from "../lib/mermaid/download-button";
import { PluginContext } from "../lib/plugin-context";
import type { DiagramPlugin, MermaidInstance } from "../lib/plugin-types";

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

vi.mock("../lib/mermaid/utils", () => ({
  svgToPngBlob: vi
    .fn()
    .mockResolvedValue(new Blob(["png"], { type: "image/png" })),
}));

describe("MermaidDownloadDropdown", () => {
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
    plugin: DiagramPlugin = createMockPlugin()
  ) => {
    return render(
      <PluginContext.Provider value={{ mermaid: plugin }}>
        <StreamdownContext.Provider value={defaultContext}>
          <MermaidDownloadDropdown {...props} />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should toggle dropdown on button click", () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);
    expect(container.querySelector(".absolute")).toBeTruthy();

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);
    expect(container.querySelector(".absolute")).toBeFalsy();
  });

  it("should download as MMD format", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();
    const { container } = renderWithContext({
      chart: "graph TD; A-->B",
      onDownload,
    });

    // Open dropdown
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);

    // Click MMD option
    const mmdButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "MMD"
    );
    expect(mmdButton).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(mmdButton!);

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "diagram.mmd",
        "graph TD; A-->B",
        "text/plain"
      );
      expect(onDownload).toHaveBeenCalledWith("mmd");
    });
  });

  it("should download as SVG format", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();
    const plugin = createMockPlugin();
    const { container } = renderWithContext(
      { chart: "graph TD; A-->B", onDownload },
      plugin
    );

    // Open dropdown
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);

    // Click SVG option
    const svgButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "SVG"
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(svgButton!);

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "diagram.svg",
        "<svg><text>Chart</text></svg>",
        "image/svg+xml"
      );
      expect(onDownload).toHaveBeenCalledWith("svg");
    });
  });

  it("should download as PNG format", async () => {
    const { save } = await import("../lib/utils");
    const { svgToPngBlob } = await import("../lib/mermaid/utils");
    const onDownload = vi.fn();
    const plugin = createMockPlugin();
    const { container } = renderWithContext(
      { chart: "graph TD; A-->B", onDownload },
      plugin
    );

    // Open dropdown
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);

    // Click PNG option
    const pngButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "PNG"
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(pngButton!);

    await waitFor(() => {
      expect(svgToPngBlob).toHaveBeenCalledWith(
        "<svg><text>Chart</text></svg>"
      );
      expect(save).toHaveBeenCalledWith(
        "diagram.png",
        expect.any(Blob),
        "image/png"
      );
      expect(onDownload).toHaveBeenCalledWith("png");
    });
  });

  it("should call onError when mermaid render returns empty SVG", async () => {
    const onError = vi.fn();
    const plugin = createMockPlugin({ svg: "" });
    const { container } = renderWithContext(
      { chart: "graph TD; A-->B", onError },
      plugin
    );

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);

    const svgButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "SVG"
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(svgButton!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("SVG not found"),
        })
      );
    });
  });

  it("should call onError when render throws", async () => {
    const onError = vi.fn();
    const mockInstance: MermaidInstance = {
      initialize: vi.fn(),
      render: vi.fn().mockRejectedValue(new Error("Render failed")),
    };
    const plugin: DiagramPlugin = {
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: vi.fn().mockReturnValue(mockInstance),
    };

    const { container } = renderWithContext(
      { chart: "invalid", onError },
      plugin
    );

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);

    const svgButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "SVG"
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(svgButton!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it("should call onError when no mermaid plugin available", async () => {
    const onError = vi.fn();
    const { container } = render(
      <PluginContext.Provider value={{}}>
        <StreamdownContext.Provider value={defaultContext}>
          <MermaidDownloadDropdown chart="graph TD; A-->B" onError={onError} />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);

    const svgButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "SVG"
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(svgButton!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Mermaid plugin not available",
        })
      );
    });
  });

  it("should close dropdown on outside click", async () => {
    const { container } = renderWithContext({ chart: "graph TD; A-->B" });

    // Open dropdown
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(container.querySelector("button")!);
    expect(container.querySelector(".absolute")).toBeTruthy();

    // Click outside
    act(() => {
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    await waitFor(() => {
      expect(container.querySelector(".absolute")).toBeFalsy();
    });
  });

  it("should be disabled when isAnimating", () => {
    const { container } = render(
      <PluginContext.Provider value={{ mermaid: createMockPlugin() }}>
        <StreamdownContext.Provider
          value={{ ...defaultContext, isAnimating: true }}
        >
          <MermaidDownloadDropdown chart="graph TD; A-->B" />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    const button = container.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });
});
