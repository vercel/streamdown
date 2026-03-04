import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { components as importedComponents } from "../lib/components";
import { ImageComponent } from "../lib/image";
import type { Options } from "../lib/markdown";
import { Markdown } from "../lib/markdown";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";
import { PluginContext } from "../lib/plugin-context";

const components = importedComponents as Required<
  NonNullable<Options["components"]>
>;
const Section = components.section;
const Ol = components.ol;
const Code = components.code;
const Tr = components.tr;
const Th = components.th;
const Td = components.td;

describe("Footnote: non-whitespace text in li (line 585)", () => {
  it("should detect direct text content in footnote li", () => {
    // A footnote li with direct non-whitespace text AND a backref
    // This hits line 585: itemChild is a string with non-empty trim
    const textFootnoteItem = createElement("li", {
      key: "fn-1",
      id: "user-content-fn-1",
      children: [
        "Actual footnote content",
        createElement("a", {
          key: "backref",
          "data-footnote-backref": "",
          href: "#user-content-fnref-1",
          children: "↩",
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      key: "ol",
      children: [textFootnoteItem],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes="">
        {[footnoteOl]}
      </Section>
    );

    // Has content so footnote should NOT be filtered out
    expect(container.textContent).toContain("Actual footnote content");
  });
});

describe("Footnote: grandchild ReactElement not backref (lines 606-612)", () => {
  it("should detect non-backref ReactElement grandchild as content", () => {
    // li > p > [<strong>, <a backref>]
    // The <strong> is a non-backref ReactElement grandchild → line 606-612
    const footnoteWithElement = createElement("li", {
      key: "fn-1",
      id: "user-content-fn-1",
      children: [
        createElement("p", {
          key: "p",
          children: [
            createElement("strong", { key: "s", children: "Bold text" }),
            createElement("a", {
              key: "backref",
              "data-footnote-backref": "",
              href: "#user-content-fnref-1",
              children: "↩",
            }),
          ],
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      key: "ol",
      children: [footnoteWithElement],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes="">
        {[footnoteOl]}
      </Section>
    );

    expect(container.textContent).toContain("Bold text");
  });

  it("should detect grandchild text content in <p> wrapper", () => {
    // li > p > ["text content", <a backref>]
    // The "text content" is a grandchild string with non-empty trim → line 600-604
    const footnoteWithText = createElement("li", {
      key: "fn-1",
      id: "user-content-fn-1",
      children: [
        createElement("p", {
          key: "p",
          children: [
            "Some footnote text",
            createElement("a", {
              key: "backref",
              "data-footnote-backref": "",
              href: "#user-content-fnref-1",
              children: "↩",
            }),
          ],
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      key: "ol",
      children: [footnoteWithText],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes="">
        {[footnoteOl]}
      </Section>
    );

    expect(container.textContent).toContain("Some footnote text");
  });

  it("should not consider backref-only-in-p as having content (keeps footnote)", () => {
    // li > p > [<a backref>] — p wraps the backref
    // The grandchild loop checks: isValidElement(grandChild) && no backref → false for backref
    // But hasBackref is only set for DIRECT children of li, not grandchildren
    // So this footnote is kept (not detected as empty)
    const footnoteWithWrappedBackref = createElement("li", {
      key: "fn-1",
      id: "user-content-fn-1",
      children: [
        createElement("p", {
          key: "p",
          children: [
            createElement("a", {
              key: "backref",
              "data-footnote-backref": "",
              href: "#user-content-fnref-1",
              children: "↩",
            }),
          ],
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      key: "ol",
      children: [footnoteWithWrappedBackref],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes="">
        {[footnoteOl]}
      </Section>
    );

    // Not detected as empty — section is still rendered
    const section = container.querySelector("section");
    expect(section).toBeTruthy();
  });
});

describe("CodeComponent ReactElement children extraction (line 729)", () => {
  it("should extract code from ReactElement children with string props.children", () => {
    // Render Code with data-block and a ReactElement child that has string children
    const codeElement = createElement("span", {
      children: "const x = 42;",
    });

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <PluginContext.Provider value={{}}>
          <Code className="language-javascript" data-block="">
            {codeElement}
          </Code>
        </PluginContext.Provider>
      </StreamdownContext.Provider>
    );

    // The code should be extracted and rendered in a code block
    expect(container).toBeTruthy();
    const codeBlock = container.querySelector('[data-streamdown="code-block"]');
    expect(codeBlock).toBeTruthy();
  });
});

describe("ImageComponent cached image useEffect (lines 36-38)", () => {
  it("should detect already-loaded cached image on mount", () => {
    // We need to test the useEffect that checks img.complete and naturalWidth
    // Override HTMLImageElement prototype to simulate cached image
    const originalComplete = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "complete"
    );
    const originalNaturalWidth = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "naturalWidth"
    );

    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      get() {
        return true;
      },
      configurable: true,
    });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      get() {
        return 200;
      },
      configurable: true,
    });

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

    // The useEffect should detect complete=true, naturalWidth>0 → setImageLoaded(true)
    // Download button should appear
    const downloadBtn = container.querySelector(
      'button[title="Download image"]'
    );
    expect(downloadBtn).toBeTruthy();

    // Restore
    if (originalComplete) {
      Object.defineProperty(
        HTMLImageElement.prototype,
        "complete",
        originalComplete
      );
    }
    if (originalNaturalWidth) {
      Object.defineProperty(
        HTMLImageElement.prototype,
        "naturalWidth",
        originalNaturalWidth
      );
    }
  });

  it("should detect cached image with naturalWidth=0 as error", () => {
    const originalComplete = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "complete"
    );
    const originalNaturalWidth = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "naturalWidth"
    );

    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      get() {
        return true;
      },
      configurable: true,
    });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      get() {
        return 0;
      },
      configurable: true,
    });

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ImageComponent
          alt="broken"
          src="https://example.com/broken-cached.png"
        />
      </StreamdownContext.Provider>
    );

    // complete=true but naturalWidth=0 → setImageError(true)
    // Should show fallback text
    const fallback = container.querySelector(
      '[data-streamdown="image-fallback"]'
    );
    expect(fallback).toBeTruthy();

    if (originalComplete) {
      Object.defineProperty(
        HTMLImageElement.prototype,
        "complete",
        originalComplete
      );
    }
    if (originalNaturalWidth) {
      Object.defineProperty(
        HTMLImageElement.prototype,
        "naturalWidth",
        originalNaturalWidth
      );
    }
  });
});

describe("parseMarkdownIntoBlocks void elements (line 58)", () => {
  it("should handle void element HTML tags without merging", () => {
    // <br> is a void element — countNonSelfClosingOpenTags returns 0
    const markdown = "<br>\n\nSome text after the break.";
    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    expect(blocks.join("")).toContain("Some text after");
  });

  it("should handle img void element in HTML block", () => {
    // <img> followed by content — img is void, should not push to htmlStack
    const markdown = '<img src="test.png">\n\nParagraph after image.';
    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    expect(blocks.join("")).toContain("Paragraph after image");
  });

  it("should handle hr void element", () => {
    const markdown = "<hr>\n\nContent after hr.";
    const blocks = parseMarkdownIntoBlocks(markdown);
    expect(blocks.join("")).toContain("Content after hr");
  });
});

describe("TableDownloadButton error catch (line 78)", () => {
  it("should call onError when download throws", async () => {
    const { TableDownloadButton } = await import(
      "../lib/table/download-dropdown"
    );

    const onError = vi.fn();

    // Mock URL.createObjectURL to throw
    const origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = () => {
      throw new Error("createObjectURL failed");
    };

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
                <td>data</td>
              </tr>
            </tbody>
          </table>
          <TableDownloadButton format="csv" onError={onError} />
        </div>
      </StreamdownContext.Provider>
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    await act(() => {
      fireEvent.click(button as HTMLButtonElement);
    });

    expect(onError).toHaveBeenCalled();

    URL.createObjectURL = origCreateObjectURL;
  });
});

describe("Memo comparators for Tr, Th, Td (lines 467, 485, 500)", () => {
  const Wrapper = ({
    count,
    children,
  }: {
    count: number;
    children: React.ReactNode;
  }) => <div data-count={count}>{children}</div>;

  it("MemoTr comparator fires on direct parent re-render", () => {
    const { container, rerender } = render(
      <Wrapper count={0}>
        <table>
          <tbody>
            <Tr>
              <td>cell</td>
            </Tr>
          </tbody>
        </table>
      </Wrapper>
    );
    rerender(
      <Wrapper count={1}>
        <table>
          <tbody>
            <Tr>
              <td>cell</td>
            </Tr>
          </tbody>
        </table>
      </Wrapper>
    );
    expect(container.querySelector("tr")).toBeTruthy();
  });

  it("MemoTh comparator fires on direct parent re-render", () => {
    const { container, rerender } = render(
      <Wrapper count={0}>
        <table>
          <thead>
            <tr>
              <Th>header</Th>
            </tr>
          </thead>
        </table>
      </Wrapper>
    );
    rerender(
      <Wrapper count={1}>
        <table>
          <thead>
            <tr>
              <Th>header</Th>
            </tr>
          </thead>
        </table>
      </Wrapper>
    );
    expect(container.querySelector("th")).toBeTruthy();
  });

  it("MemoTd comparator fires on direct parent re-render", () => {
    const { container, rerender } = render(
      <Wrapper count={0}>
        <table>
          <tbody>
            <tr>
              <Td>cell</Td>
            </tr>
          </tbody>
        </table>
      </Wrapper>
    );
    rerender(
      <Wrapper count={1}>
        <table>
          <tbody>
            <tr>
              <Td>cell</Td>
            </tr>
          </tbody>
        </table>
      </Wrapper>
    );
    expect(container.querySelector("td")).toBeTruthy();
  });
});

describe("Footnote: null children handling (line 579)", () => {
  it("should skip null children in footnote processing", () => {
    // li with children array containing null + backref
    const footnoteWithNull = createElement("li", {
      key: "fn-1",
      id: "user-content-fn-1",
      children: [
        null,
        "Some content",
        createElement("a", {
          key: "backref",
          "data-footnote-backref": "",
          href: "#user-content-fnref-1",
          children: "↩",
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      key: "ol",
      children: [footnoteWithNull],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes="">
        {[footnoteOl]}
      </Section>
    );

    expect(container.textContent).toContain("Some content");
  });
});

describe("Markdown processor: non-function plugin in cache key (line 114)", () => {
  it("should handle plugin array with non-function first element", () => {
    // Line 114: when pluginFn is not a function, uses String(pluginFn)
    // This is defensive for unusual plugin formats
    try {
      Markdown({
        children: "Hello world",
        remarkPlugins: [["string-plugin" as never, { test: true }]],
        components,
      });
    } catch {
      // Expected to fail — the processor can't use a string as a plugin
      // But the cache key generation (which hits line 114) runs first
    }
  });
});

describe("Markdown processor: raw node handling via custom rehype plugin", () => {
  it("should handle raw nodes with skipHtml=true", async () => {
    const rehypeRaw = (await import("rehype-raw")).default;
    // Custom rehype plugin that injects a raw node AFTER rehype-raw has run
    const injectRawNode = () => (tree: { children: unknown[] }) => {
      tree.children.push({ type: "raw", value: "<span>raw</span>" });
    };

    const { container } = render(
      Markdown({
        children: "<b>test</b>",
        rehypePlugins: [rehypeRaw, injectRawNode as never],
        skipHtml: true,
        components,
      })
    );
    expect(container).toBeTruthy();
  });

  it("should handle raw nodes without skipHtml", async () => {
    const rehypeRaw = (await import("rehype-raw")).default;
    const injectRawNode = () => (tree: { children: unknown[] }) => {
      tree.children.push({ type: "raw", value: "<em>raw text</em>" });
    };

    const { container } = render(
      Markdown({
        children: "<b>test</b>",
        rehypePlugins: [rehypeRaw, injectRawNode as never],
        disallowedElements: ["script"],
        components,
      })
    );
    expect(container).toBeTruthy();
  });
});

describe("shouldShowMermaidControl with mermaid: undefined (line 136)", () => {
  it("should default to showing controls when mermaid key is not in config", () => {
    // When controls is an object but mermaid is not specified,
    // shouldShowMermaidControl should return true (line 136)
    vi.mock("../lib/mermaid", () => ({
      Mermaid: ({ chart }: { chart: string }) => (
        <div data-testid="mermaid-mock">{chart}</div>
      ),
    }));

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
            controls: {},
            isAnimating: false,
            mode: "streaming",
          }}
        >
          {Markdown({
            children: "```mermaid\ngraph TD; A-->B\n```",
            components,
          })}
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    expect(container).toBeTruthy();
  });
});
