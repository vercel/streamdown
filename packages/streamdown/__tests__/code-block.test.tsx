import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShikiThemeContext } from "../index";
import { CodeBlock, CodeBlockCopyButton } from "../lib/code-block";

describe("CodeBlockCopyButton", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it("should copy code to clipboard on click", async () => {
    const onCopy = vi.fn();
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton onCopy={onCopy} />
      </CodeBlock>
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "const x = 1;"
      );
      expect(onCopy).toHaveBeenCalled();
    });
  });

  it("should show check icon after copying", async () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton />
      </CodeBlock>
    );

    const button = container.querySelector("button");

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button!);

    await waitFor(() => {
      // Check icon should be visible after copying
      const svg = button?.querySelector("svg");
      expect(svg).toBeTruthy();
    });
  });

  it("should handle clipboard API not available", async () => {
    const onError = vi.fn();

    // Mock clipboard API not available
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: undefined,
      },
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton onError={onError} />
      </CodeBlock>
    );

    const button = container.querySelector("button");

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    await act(async () => {
      fireEvent.click(button!);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should handle clipboard write failure", async () => {
    const onError = vi.fn();
    const error = new Error("Clipboard write failed");

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(error),
      },
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton onError={onError} />
      </CodeBlock>
    );

    const button = container.querySelector("button");

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it("should reset icon after timeout", async () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton timeout={1000} />
      </CodeBlock>
    );

    const button = container.querySelector("button");

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    vi.useFakeTimers();

    await act(async () => {
      fireEvent.click(button!);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Icon should be reset after timeout
    const svg = button?.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});

describe("CodeBlock with multiple languages", () => {
  it("should render multiple code blocks with different languages simultaneously", async () => {
    const pythonCode = "print('hello world!')";
    const jsCode = "console.log('hello world!');";

    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <div>
          <CodeBlock code={pythonCode} language="python" />
          <CodeBlock code={jsCode} language="javascript" />
        </div>
      </ShikiThemeContext.Provider>
    );

    // Wait for both code blocks to render
    await waitFor(
      () => {
        const codeBlocks = container.querySelectorAll(".my-4");
        expect(codeBlocks.length).toBe(2);

        // Check that both language labels are present
        const languageLabels = container.querySelectorAll(
          ".font-mono.lowercase"
        );
        expect(languageLabels.length).toBe(2);
        expect(languageLabels[0].textContent).toBe("python");
        expect(languageLabels[1].textContent).toBe("javascript");

        // Check that both code blocks have rendered content
        const preElements = container.querySelectorAll("pre");
        expect(preElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it("should handle multiple instances of the same language", async () => {
    const code1 = "const x = 1;";
    const code2 = "const y = 2;";

    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <div>
          <CodeBlock code={code1} language="javascript" />
          <CodeBlock code={code2} language="javascript" />
        </div>
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const codeBlocks = container.querySelectorAll(".my-4");
        expect(codeBlocks.length).toBe(2);

        // Both should be JavaScript
        const languageLabels = container.querySelectorAll(
          ".font-mono.lowercase"
        );
        expect(languageLabels.length).toBe(2);
        expect(languageLabels[0].textContent).toBe("javascript");
        expect(languageLabels[1].textContent).toBe("javascript");
      },
      { timeout: 5000 }
    );
  });

  it("should handle rapid sequential rendering of different languages", async () => {
    const languages: Array<{
      code: string;
      lang: "python" | "javascript" | "typescript";
    }> = [
      { code: "print('Python')", lang: "python" },
      { code: "console.log('JS')", lang: "javascript" },
      { code: "const x: string = 'TS'", lang: "typescript" },
    ];

    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <div>
          {languages.map((item, index) => (
            <CodeBlock code={item.code} key={index} language={item.lang} />
          ))}
        </div>
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const codeBlocks = container.querySelectorAll(".my-4");
        expect(codeBlocks.length).toBe(3);

        const languageLabels = container.querySelectorAll(
          ".font-mono.lowercase"
        );
        expect(languageLabels.length).toBe(3);
        expect(languageLabels[0].textContent).toBe("python");
        expect(languageLabels[1].textContent).toBe("javascript");
        expect(languageLabels[2].textContent).toBe("typescript");
      },
      { timeout: 5000 }
    );
  });

  it("should have data attributes on container, header, and code block elements", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        // Check container has data attributes
        const containerElement = container.querySelector(
          "[data-code-block-container]"
        );
        expect(containerElement).toBeTruthy();
        expect(containerElement?.getAttribute("data-language")).toBe(
          "javascript"
        );

        // Check header has data attributes
        const headerElement = container.querySelector(
          "[data-code-block-header]"
        );
        expect(headerElement).toBeTruthy();
        expect(headerElement?.getAttribute("data-language")).toBe("javascript");

        // Check code block has data attributes
        const codeBlockElements =
          container.querySelectorAll("[data-code-block]");
        expect(codeBlockElements.length).toBeGreaterThan(0);
        codeBlockElements.forEach((element) => {
          expect(element.getAttribute("data-language")).toBe("javascript");
        });
      },
      { timeout: 5000 }
    );
  });

  it("should actually highlight code with syntax colors", async () => {
    const jsCode = "const x = 1;";
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock code={jsCode} language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        // Check for shiki-themed pre element with CSS variables
        const pre = container.querySelector("pre.shiki");
        expect(pre).toBeTruthy();
        expect(pre).toHaveClass("shiki-themes");

        // Verify CSS variables for multi-theme support
        const style = pre?.getAttribute("style");
        expect(style).toBeTruthy();
        expect(style).toContain("--shiki-light");
        expect(style).toContain("--shiki-dark");

        // Verify actual syntax highlighting tokens exist
        // Code should be wrapped in span elements (tokens)
        const tokens = container.querySelectorAll("pre.shiki span.line span");
        expect(tokens.length).toBeGreaterThan(0);

        // At least one token should have style attribute with color
        const tokensWithStyle = Array.from(tokens).filter(
          (token) => token.getAttribute("style")
        );
        expect(tokensWithStyle.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it("should remove background styles from pre element", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const pre = container.querySelector("pre.shiki");
        expect(pre).toBeTruthy();

        const style = pre?.getAttribute("style");
        expect(style).toBeTruthy();

        // Should NOT contain ANY background properties
        expect(style).not.toMatch(/background[^;]*;?/);
        expect(style).not.toMatch(/background-color/);
        expect(style).not.toMatch(/background-image/);
        expect(style).not.toMatch(/background:/);

        // Should still have CSS variables for theming (proves we didn't remove all styles)
        expect(style).toContain("--shiki-light");
        expect(style).toContain("--shiki-dark");

        // Verify it actually has syntax highlighting tokens
        const tokens = pre.querySelectorAll("span.line span");
        expect(tokens.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it("should apply preClassName to pre element", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock
          code="const x = 1;"
          language="javascript"
          preClassName="custom-pre-class"
        />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const pre = container.querySelector("pre.shiki");
        expect(pre).toBeTruthy();

        // Verify the actual class attribute contains our custom class
        const classAttr = pre?.getAttribute("class");
        expect(classAttr).toContain("custom-pre-class");
        expect(classAttr).toContain("shiki");

        // Also use toHaveClass for convenience
        expect(pre).toHaveClass("custom-pre-class");
        expect(pre).toHaveClass("shiki");
        expect(pre).toHaveClass("shiki-themes");

        // Verify highlighting actually happened (not just an empty pre)
        const code = pre?.querySelector("code");
        expect(code).toBeTruthy();
        expect(code?.textContent).toContain("const x = 1");
      },
      { timeout: 5000 }
    );
  });

  it("should handle preClassName with multiple existing classes", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock
          code="const x = 1;"
          language="javascript"
          preClassName="my-custom-class another-class"
        />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const pre = container.querySelector("pre.shiki");
        expect(pre).toBeTruthy();

        // Should merge all classes
        expect(pre?.className).toContain("shiki");
        expect(pre?.className).toContain("my-custom-class another-class");
      },
      { timeout: 5000 }
    );
  });

  it("should work without preClassName (transformer handles undefined)", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock
          code="const x = 1;"
          language="javascript"
          // NO preClassName prop
        />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const pre = container.querySelector("pre.shiki");
        expect(pre).toBeTruthy();

        // Should only have Shiki's classes
        const classAttr = pre?.getAttribute("class");
        expect(classAttr).toContain("shiki");
        expect(classAttr).not.toContain("undefined");
        expect(classAttr).not.toContain("null");

        // Highlighting should still work
        const tokens = pre?.querySelectorAll("span.line span");
        expect(tokens.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it("should produce valid HTML with transformers applied (integration test)", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlock
          code="function hello() { return 'world'; }"
          language="javascript"
          preClassName="test-class"
        />
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const pre = container.querySelector("pre");
        expect(pre).toBeTruthy();

        // Get actual rendered HTML
        const preHTML = pre?.outerHTML;
        expect(preHTML).toBeTruthy();

        // Verify structure: pre > code > span.line > span (tokens)
        expect(preHTML).toContain("<pre");
        expect(preHTML).toContain("<code");
        expect(preHTML).toContain('class="line"');

        // Verify transformers worked
        expect(preHTML).toContain("test-class"); // preClassName transformer
        expect(preHTML).not.toContain("background:"); // background removal transformer
        expect(preHTML).not.toContain("background-color:"); // background removal transformer

        // Verify CSS variables are present (not removed by background transformer)
        expect(preHTML).toContain("--shiki-light");
        expect(preHTML).toContain("--shiki-dark");

        // Verify actual syntax highlighting happened
        expect(preHTML).toContain("function");
        expect(preHTML).toContain("hello");
        expect(preHTML).toContain("return");
        expect(preHTML).toContain("world");

        // Log for manual verification (can be removed in production)
        console.log("\n=== INTEGRATION TEST: Rendered HTML ===");
        console.log("Pre classes:", pre?.getAttribute("class"));
        console.log("Pre style (first 200 chars):", pre?.getAttribute("style")?.substring(0, 200));
        console.log("Token count:", pre?.querySelectorAll("span.line span").length);
      },
      { timeout: 5000 }
    );
  });
});
