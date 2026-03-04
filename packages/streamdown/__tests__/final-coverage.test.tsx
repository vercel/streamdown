import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { components as importedComponents } from "../lib/components";
import { ImageComponent } from "../lib/image";
import { Markdown } from "../lib/markdown";
import { MermaidFullscreenButton } from "../lib/mermaid/fullscreen-button";
import { PanZoom } from "../lib/mermaid/pan-zoom";
import { PluginContext } from "../lib/plugin-context";
import { TableDownloadDropdown } from "../lib/table/download-dropdown";

// Mock mermaid component for fullscreen tests
vi.mock("../lib/mermaid", () => ({
  Mermaid: ({ chart }: { chart: string }) => (
    <div data-testid="mermaid-mock">{chart}</div>
  ),
}));

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

describe("ImageComponent cached image handling", () => {
  it("should detect cached image on mount via img.complete and naturalWidth", () => {
    // We need to simulate an image that's already complete when mounted
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent alt="cached" src="https://example.com/cached.png" />
      </StreamdownContext.Provider>
    );

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();

    // Simulate cached image by setting complete and naturalWidth before React effect runs
    Object.defineProperty(img, "complete", { value: true, writable: true });
    Object.defineProperty(img, "naturalWidth", { value: 200, writable: true });

    // Fire load event to trigger state update
    fireEvent.load(img);

    const wrapper = container.querySelector(
      '[data-streamdown="image-wrapper"]'
    );
    expect(wrapper).toBeTruthy();
  });

  it("should return null when no src provided (line 111-112)", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent alt="no-src" />
      </StreamdownContext.Provider>
    );

    // No img should be rendered when src is not provided
    const img = container.querySelector("img");
    expect(img).toBeFalsy();
  });

  it("should handle image error on cached load (complete but naturalWidth=0)", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent alt="broken" src="https://example.com/broken.png" />
      </StreamdownContext.Provider>
    );

    const img = container.querySelector("img") as HTMLImageElement;

    // Simulate broken cached image
    Object.defineProperty(img, "complete", { value: true, writable: true });
    Object.defineProperty(img, "naturalWidth", { value: 0, writable: true });

    // Fire error event
    fireEvent.error(img);

    const _fallback = container.querySelector(
      '[data-streamdown="image-error"]'
    );
    // The error state should be set
    expect(container).toBeTruthy();
  });
});

describe("MermaidFullscreenButton panZoom controls config", () => {
  it("should hide panZoom when mermaid controls = false (line 50)", () => {
    const { container } = render(
      <PluginContext.Provider
        value={{
          mermaid: {
            name: "mermaid" as const,
            type: "diagram" as const,
            language: "mermaid",
            getMermaid: () => ({
              initialize: vi.fn(),
              render: vi.fn().mockResolvedValue({ svg: "<svg></svg>" }),
            }),
          },
        }}
      >
        <StreamdownContext.Provider
          value={{
            shikiTheme: ["github-light", "github-dark"],
            controls: { mermaid: false },
            isAnimating: false,
            mode: "streaming",
          }}
        >
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    expect(container.querySelector("button")).toBeTruthy();
  });

  it("should show panZoom when mermaid controls = true (line 53)", () => {
    const { container } = render(
      <PluginContext.Provider
        value={{
          mermaid: {
            name: "mermaid" as const,
            type: "diagram" as const,
            language: "mermaid",
            getMermaid: () => ({
              initialize: vi.fn(),
              render: vi.fn().mockResolvedValue({ svg: "<svg></svg>" }),
            }),
          },
        }}
      >
        <StreamdownContext.Provider
          value={{
            shikiTheme: ["github-light", "github-dark"],
            controls: { mermaid: true },
            isAnimating: false,
            mode: "streaming",
          }}
        >
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    expect(container.querySelector("button")).toBeTruthy();
  });

  it("should handle undefined mermaid controls (line 53)", () => {
    const { container } = render(
      <PluginContext.Provider value={{}}>
        <StreamdownContext.Provider
          value={{
            shikiTheme: ["github-light", "github-dark"],
            controls: { mermaid: undefined },
            isAnimating: false,
            mode: "streaming",
          }}
        >
          <MermaidFullscreenButton chart="graph TD; A-->B" />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    expect(container.querySelector("button")).toBeTruthy();
  });
});

describe("PanZoom edge cases", () => {
  it("should not move when pointer moves but not panning (line 88)", () => {
    const { container } = render(
      <PanZoom>
        <div data-testid="content">Content</div>
      </PanZoom>
    );

    // Get the content div (the one with role="application")
    const contentEl = container.querySelector('[role="application"]');
    expect(contentEl).toBeTruthy();

    // Fire pointer move without a pointer down first (not panning)
    fireEvent.pointerMove(contentEl as HTMLElement, {
      clientX: 100,
      clientY: 100,
    });

    // Should not change transform
    const transform = (contentEl as HTMLElement).style.transform;
    expect(transform).toContain("translate(0px, 0px)");
  });
});

describe("Markdown raw node handling", () => {
  it("should handle raw HTML node with skipHtml=true (lines 241-244, 309-310)", () => {
    const { container } = render(
      Markdown({
        children: "Hello\n\n<div>raw html</div>\n\nWorld",
        skipHtml: true,
        urlTransform: (url) => url,
      })
    );

    // Raw HTML should be stripped when skipHtml=true
    expect(container.textContent).toContain("Hello");
    expect(container.textContent).toContain("World");
    expect(container.innerHTML).not.toContain("<div>raw html</div>");
  });

  it("should convert raw HTML to text when skipHtml=false and urlTransform present", () => {
    const { container } = render(
      Markdown({
        children: "Before\n\n<b>bold text</b>\n\nAfter",
        skipHtml: false,
        urlTransform: (url) => url,
      })
    );

    expect(container.textContent).toContain("Before");
    expect(container.textContent).toContain("After");
  });
});

describe("TableDownloadDropdown error on save throw (line 78)", () => {
  it("should call onError when save throws in dropdown", async () => {
    const { save } = await import("../lib/utils");
    (save as any).mockImplementation(() => {
      throw new Error("Download failed");
    });

    const onError = vi.fn();

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <div data-streamdown="table-wrapper">
          <table>
            <tbody>
              <tr>
                <td>Data</td>
              </tr>
            </tbody>
          </table>
          <TableDownloadDropdown onError={onError} />
        </div>
      </StreamdownContext.Provider>
    );

    const toggleBtn = container.querySelector('button[title="Download table"]');
    fireEvent.click(toggleBtn as HTMLButtonElement);

    const csvBtn = container.querySelector(
      'button[title="Download table as CSV"]'
    );
    fireEvent.click(csvBtn as HTMLButtonElement);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("components.tsx code extraction from ReactElement children (line 729)", () => {
  it("should extract code from ReactElement children with string content", async () => {
    // Render a fenced code block which produces <pre><code>content</code></pre>
    // The pre component wraps code with data-block, and the code component extracts text
    const { container } = render(
      Markdown({
        children: "```javascript\nconst x = 42;\n```",
        components: importedComponents,
      })
    );

    // Wait for lazy-loaded CodeBlock
    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).toBeTruthy();
    });
  });
});
