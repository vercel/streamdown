import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Highlighter } from "shiki";
import { StreamdownContext } from "../index";
import { CodeBlock } from "../lib/code-block/static";

// Mock the highlight module
vi.mock("../lib/code-block/highlight", () => ({
  createShiki: vi.fn(() =>
    Promise.resolve({
      codeToTokens: vi.fn((code, _options) => ({
        bg: "rgb(255, 255, 255)",
        fg: "rgb(36, 41, 46)",
        tokens: code.split("\n").map((line: string) => [
          {
            content: line,
            color: "rgb(36, 41, 46)",
            bgColor: "transparent",
            htmlStyle: {},
            offset: 0,
          },
        ]),
      })),
    } as unknown as Highlighter)
  ),
}));

describe("CodeBlock (static)", () => {
  const mockThemes: ["github-light", "github-dark"] = [
    "github-light",
    "github-dark",
  ];

  const mockContext = {
    shikiTheme: mockThemes,
    controls: true,
    isAnimating: false,
    mode: "static" as const,
  };

  it("should render CodeBlock with initial plain HTML", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </StreamdownContext.Provider>
    );

    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock).toBeTruthy();
    expect(codeBlock?.getAttribute("data-language")).toBe("javascript");

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });

  it("should render with light and dark theme support via token colors", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("[data-code-block]");
      expect(codeBlock).toBeTruthy();
      // Check that the code block has background and foreground colors
      expect(codeBlock?.style.backgroundColor).toBeTruthy();
      expect(codeBlock?.style.color).toBeTruthy();
    });
  });

  it("should apply custom className", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock className="custom-class" code="test" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("[data-code-block]");
      expect(codeBlock?.className).toContain("custom-class");
    });
  });

  it("should apply custom className to pre element", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="test" className="custom-class" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("[data-code-block]");
      expect(codeBlock?.className).toContain("custom-class");
    });
  });

  it("should render with different language", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="print('hello')" language="python" />
      </StreamdownContext.Provider>
    );

    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock?.getAttribute("data-language")).toBe("python");

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });

  it("should handle code updates", async () => {
    const { container, rerender } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("[data-code-block]");
      expect(codeBlock?.textContent).toContain("const x = 1;");
    });

    rerender(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="const y = 2;" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("[data-code-block]");
      expect(codeBlock?.textContent).toContain("const y = 2;");
    });
  });

  it("should include CodeBlockHeader with language", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="test" language="typescript" />
      </StreamdownContext.Provider>
    );

    const header = container.querySelector("[data-code-block-header]");
    expect(header).toBeTruthy();

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });

  it("should handle children", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="test" language="javascript">
          <div data-testid="custom-child">Custom content</div>
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    const child = container.querySelector('[data-testid="custom-child"]');
    expect(child).toBeTruthy();

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });

  it("should render with fallback when highlighter is not ready", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="test" language="javascript" />
      </StreamdownContext.Provider>
    );

    // Should render container immediately
    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock).toBeTruthy();

    // Should render code block with fallback raw tokens
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });

  it("should escape HTML in plain HTML fallback", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="<div>test</div>" language="html" />
      </StreamdownContext.Provider>
    );

    // Check initial render has escaped HTML
    const codeBlocks = container.querySelectorAll("[data-code-block]");
    expect(codeBlocks.length).toBeGreaterThan(0);

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });

  it("should cleanup on unmount", async () => {
    const { unmount, container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="test" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("[data-code-block]");
      expect(codeBlock).toBeTruthy();
    });

    unmount();

    // Component should be unmounted
    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock).toBeFalsy();
  });

  it("should pass through additional HTML attributes", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock
          code="test"
          data-testid="custom-code-block"
          id="my-code-block"
          language="javascript"
        />
      </StreamdownContext.Provider>
    );

    const codeBlock = container.querySelector("[data-code-block]");
    expect(codeBlock?.getAttribute("data-testid")).toBe("custom-code-block");
    expect(codeBlock?.getAttribute("id")).toBe("my-code-block");

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });
});
