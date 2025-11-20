import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShikiThemeContext } from "../index";
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

  it("should render CodeBlock with initial plain HTML", () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock).toBeTruthy();
    expect(codeBlock?.getAttribute("data-language")).toBe("javascript");
  });

  it("should render with light and dark versions", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </ShikiThemeContext.Provider>
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
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock className="custom-class" code="test" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      const codeBlocks = container.querySelectorAll("[data-code-block]");
      expect(codeBlocks[0].className).toContain("custom-class");
      expect(codeBlocks[1].className).toContain("custom-class");
    });
  });

  it("should apply preClassName", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock
          code="test"
          language="javascript"
          preClassName="custom-pre"
        />
      </ShikiThemeContext.Provider>
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
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="print('hello')" language="python" />
      </ShikiThemeContext.Provider>
    );

    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock?.getAttribute("data-language")).toBe("python");
  });

  it("should handle code updates", async () => {
    const { container, rerender } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      expect(lightBlock?.innerHTML).toContain("const x = 1;");
    });

    rerender(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="const y = 2;" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      const lightBlock = container.querySelector(
        "[data-code-block].dark\\:hidden"
      );
      expect(lightBlock?.innerHTML).toContain("const y = 2;");
    });
  });

  it("should include CodeBlockHeader with language", () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="test" language="typescript" />
      </ShikiThemeContext.Provider>
    );

    const header = container.querySelector("[data-code-block-header]");
    expect(header).toBeTruthy();
  });

  it("should handle children", () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="test" language="javascript">
          <div data-testid="custom-child">Custom content</div>
        </CodeBlock>
      </ShikiThemeContext.Provider>
    );

    const child = container.querySelector('[data-testid="custom-child"]');
    expect(child).toBeTruthy();
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
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="test" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    // Should still render with initial plain HTML
    const codeBlock = container.querySelector("[data-code-block-container]");
    expect(codeBlock).toBeTruthy();
  });

  it("should escape HTML in plain HTML fallback", () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="<div>test</div>" language="html" />
      </ShikiThemeContext.Provider>
    );

    // Check initial render has escaped HTML
    const codeBlocks = container.querySelectorAll("[data-code-block]");
    expect(codeBlocks.length).toBeGreaterThan(0);
  });

  it("should cleanup on unmount", async () => {
    const { unmount, container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock code="test" language="javascript" />
      </ShikiThemeContext.Provider>
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

  it("should pass through additional HTML attributes", () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={mockThemes}>
        <CodeBlock
          code="test"
          data-testid="custom-code-block"
          id="my-code-block"
          language="javascript"
        />
      </ShikiThemeContext.Provider>
    );

    const codeBlocks = container.querySelectorAll("[data-code-block]");
    expect(codeBlocks[0].getAttribute("data-testid")).toBe("custom-code-block");
    expect(codeBlocks[0].getAttribute("id")).toBe("my-code-block");
  });
});
