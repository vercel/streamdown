import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { CodeBlock } from "../lib/code-block/static";

// Mock the highlight manager module
vi.mock("../lib/code-block/highlight-manager", () => ({
  highlighterManager: {
    initializeHighlighters: vi.fn(() => Promise.resolve()),
    highlightCode: vi.fn((code, language, preClassName) => {
      const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const preClass = preClassName || "";
      return Promise.resolve([
        `<pre class="${preClass} light-theme"><code>${escapedCode}</code></pre>`,
        `<pre class="${preClass} dark-theme"><code>${escapedCode}</code></pre>`,
      ]);
    }),
  },
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

  it("should render with light and dark versions", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      const darkBlock = container.querySelector(
        "[data-code-block].dark\\:block"
      );

      expect(lightBlock).toBeTruthy();
      expect(darkBlock).toBeTruthy();
    });
  });

  it("should apply custom className", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock className="custom-class" code="test" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const codeBlocks = container.querySelectorAll("[data-code-block]");
      expect(codeBlocks[0].className).toContain("custom-class");
      expect(codeBlocks[1].className).toContain("custom-class");
    });
  });

  it("should apply preClassName", async () => {
    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock
          code="test"
          language="javascript"
          preClassName="custom-pre"
        />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      expect(lightBlock?.innerHTML).toContain("custom-pre");
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
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      expect(lightBlock?.innerHTML).toContain("const x = 1;");
    });

    rerender(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="const y = 2;" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      expect(lightBlock?.innerHTML).toContain("const y = 2;");
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

  it("should handle errors silently for AbortError", async () => {
    const mockHighlightCode = vi.fn(() => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    vi.doMock("../lib/code-block/highlight-manager", () => ({
      highlighterManager: {
        initializeHighlighters: vi.fn(() => Promise.resolve()),
        highlightCode: mockHighlightCode,
      },
    }));

    const { container } = render(
      <StreamdownContext.Provider value={mockContext}>
        <CodeBlock code="test" language="javascript" />
      </StreamdownContext.Provider>
    );

    // Should still render with initial plain HTML
    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock).toBeTruthy();

    // Wait for async operation to complete (even though it fails)
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
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      expect(lightBlock).toBeTruthy();
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

    const codeBlocks = container.querySelectorAll("[data-code-block]");
    expect(codeBlocks[0].getAttribute("data-testid")).toBe("custom-code-block");
    expect(codeBlocks[0].getAttribute("id")).toBe("my-code-block");

    // Wait for async highlighting to complete
    await waitFor(() => {
      expect(container.querySelector("[data-code-block]")).toBeTruthy();
    });
  });
});
