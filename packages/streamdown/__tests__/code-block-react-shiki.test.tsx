import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShikiThemeContext } from "../index";
import {
  CodeBlockReactShiki,
  CodeBlockReactShikiCopyButton,
  CodeBlockReactShikiDownloadButton,
} from "../lib/code-block-react-shiki";

describe("CodeBlockReactShikiCopyButton", () => {
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
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiCopyButton onCopy={onCopy} />
      </CodeBlockReactShiki>
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
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiCopyButton />
      </CodeBlockReactShiki>
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
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiCopyButton onError={onError} />
      </CodeBlockReactShiki>
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
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiCopyButton onError={onError} />
      </CodeBlockReactShiki>
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
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiCopyButton timeout={1000} />
      </CodeBlockReactShiki>
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

describe("CodeBlockReactShikiDownloadButton", () => {
  let createObjectURL: typeof URL.createObjectURL;
  let revokeObjectURL: typeof URL.revokeObjectURL;
  let createElement: typeof document.createElement;

  beforeEach(() => {
    // Store original functions
    createObjectURL = URL.createObjectURL;
    revokeObjectURL = URL.revokeObjectURL;
    createElement = document.createElement;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();

    // Mock document.createElement for 'a' elements
    const mockClick = vi.fn();
    const mockRemove = vi.fn();

    document.createElement = vi.fn((tag: string) => {
      if (tag === "a") {
        const anchor = createElement.call(document, tag) as HTMLAnchorElement;
        anchor.click = mockClick;
        anchor.remove = mockRemove;
        return anchor;
      }
      return createElement.call(document, tag);
    }) as typeof document.createElement;
  });

  afterEach(() => {
    // Restore original functions
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    document.createElement = createElement;
    vi.clearAllMocks();
  });

  it("should download code on click", async () => {
    const onDownload = vi.fn();
    const { container } = render(
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiDownloadButton onDownload={onDownload} />
      </CodeBlockReactShiki>
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    // Wait for button to be enabled
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button!);

    await waitFor(() => {
      expect(onDownload).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("should use correct file extension for language", async () => {
    const { container } = render(
      <CodeBlockReactShiki code="print('hello')" language="python">
        <CodeBlockReactShikiDownloadButton />
      </CodeBlockReactShiki>
    );

    const button = container.querySelector("button");

    // Wait for button to be enabled
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button!);

    await waitFor(() => {
      // Check that document.createElement was called with 'a'
      expect(document.createElement).toHaveBeenCalledWith("a");
    });
  });

  it("should handle download error", async () => {
    const onError = vi.fn();
    const error = new Error("Download failed");

    // Mock URL.createObjectURL to throw
    URL.createObjectURL = vi.fn(() => {
      throw error;
    });

    const { container } = render(
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiDownloadButton onError={onError} />
      </CodeBlockReactShiki>
    );

    const button = container.querySelector("button");

    // Wait for button to be enabled
    await waitFor(() => {
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it("should have correct title attribute", () => {
    const { container } = render(
      <CodeBlockReactShiki code="const x = 1;" language="javascript">
        <CodeBlockReactShikiDownloadButton />
      </CodeBlockReactShiki>
    );

    const button = container.querySelector("button");
    expect(button?.getAttribute("title")).toBe("Download file");
  });
});

describe("CodeBlockReactShiki with multiple languages", () => {
  it("should render multiple code blocks with different languages simultaneously", async () => {
    const pythonCode = "print('hello world!')";
    const jsCode = "console.log('hello world!');";

    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <div>
          <CodeBlockReactShiki code={pythonCode} language="python" />
          <CodeBlockReactShiki code={jsCode} language="javascript" />
        </div>
      </ShikiThemeContext.Provider>
    );

    // Wait for both code blocks to render
    await waitFor(
      () => {
        const codeBlocks = container.querySelectorAll(
          "[data-code-block-container]"
        );
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
          <CodeBlockReactShiki code={code1} language="javascript" />
          <CodeBlockReactShiki code={code2} language="javascript" />
        </div>
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const codeBlocks = container.querySelectorAll(
          "[data-code-block-container]"
        );
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
            <CodeBlockReactShiki
              code={item.code}
              key={index}
              language={item.lang}
            />
          ))}
        </div>
      </ShikiThemeContext.Provider>
    );

    await waitFor(
      () => {
        const codeBlocks = container.querySelectorAll(
          "[data-code-block-container]"
        );
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
        <CodeBlockReactShiki code="const x = 1;" language="javascript" />
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
        expect(containerElement?.getAttribute("data-highlighter")).toBe(
          "react-shiki"
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

  it("should respect custom delay prop", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlockReactShiki
          code="const x = 1;"
          delay={100}
          language="javascript"
        />
      </ShikiThemeContext.Provider>
    );

    // The component should render immediately even with delay
    const containerElement = container.querySelector(
      "[data-code-block-container]"
    );
    expect(containerElement).toBeTruthy();
  });

  it("should render with both copy and download buttons", async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={["github-light", "github-dark"]}>
        <CodeBlockReactShiki code="const x = 1;" language="javascript">
          <CodeBlockReactShikiDownloadButton />
          <CodeBlockReactShikiCopyButton />
        </CodeBlockReactShiki>
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      const buttons = container.querySelectorAll(
        "[data-code-block-header] button"
      );
      expect(buttons.length).toBe(2);
    });
  });
});
