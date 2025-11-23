import fs from "node:fs";
import path from "node:path";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { CodeBlock } from "../lib/code-block";
import { CodeBlockCopyButton } from "../lib/code-block/copy-button";

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
    if (!button) {
      throw new Error("Button not found");
    }

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button);

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
    expect(button).toBeTruthy();
    if (!button) {
      throw new Error("Button not found");
    }

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button);

    await waitFor(() => {
      // Check icon should be visible after copying
      const svg = button.querySelector("svg");
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
    expect(button).toBeTruthy();
    if (!button) {
      throw new Error("Button not found");
    }

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    act(() => {
      fireEvent.click(button);
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
    expect(button).toBeTruthy();
    if (!button) {
      throw new Error("Button not found");
    }

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(button);

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
    expect(button).toBeTruthy();
    if (!button) {
      throw new Error("Button not found");
    }

    // Wait for button to be enabled (code highlighting to complete)
    await waitFor(() => {
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    vi.useFakeTimers();

    act(() => {
      fireEvent.click(button);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");

    // Fast-forward time and wait for state update
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Icon should be reset after timeout
    const svg = button.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});

describe("CodeBlock with multiple languages", () => {
  it("should render multiple code blocks with different languages simultaneously", async () => {
    const pythonCode = "print('hello world!')";
    const jsCode = "console.log('hello world!');";

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming" as const,
        }}
      >
        <div>
          <CodeBlock code={pythonCode} language="python" />
          <CodeBlock code={jsCode} language="javascript" />
        </div>
      </StreamdownContext.Provider>
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
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming" as const,
        }}
      >
        <div>
          <CodeBlock code={code1} language="javascript" />
          <CodeBlock code={code2} language="javascript" />
        </div>
      </StreamdownContext.Provider>
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
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming" as const,
        }}
      >
        <div>
          {languages.map((item) => (
            <CodeBlock
              code={item.code}
              key={`${item.lang}-${item.code.slice(0, 20)}`}
              language={item.lang}
            />
          ))}
        </div>
      </StreamdownContext.Provider>
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
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming" as const,
        }}
      >
        <CodeBlock code="const x = 1;" language="javascript" />
      </StreamdownContext.Provider>
    );

    await waitFor(
      () => {
        // Check container has data attributes
        const containerElement = container.querySelector(
          '[data-streamdown="code-block"]'
        );
        expect(containerElement).toBeTruthy();
        expect(containerElement?.getAttribute("data-language")).toBe(
          "javascript"
        );

        // Check header has data attributes
        const headerElement = container.querySelector(
          '[data-streamdown="code-block-header"]'
        );
        expect(headerElement).toBeTruthy();
        expect(headerElement?.getAttribute("data-language")).toBe("javascript");

        // Check code block has data attributes
        const codeBlockElements = container.querySelectorAll(
          '[data-streamdown="code-block"]'
        );
        expect(codeBlockElements.length).toBeGreaterThan(0);
        for (const element of codeBlockElements) {
          expect(element.getAttribute("data-language")).toBe("javascript");
        }
      },
      { timeout: 5000 }
    );
  });

  it("should handle heavy streaming appropriately", async () => {
    const fixturePath = path.join(
      __dirname,
      "__fixtures__",
      "code-block-big-html.html"
    );
    const largeContent = fs.readFileSync(fixturePath, "utf-8");

    // Create a component that will stream the content
    let setStreamedCodeExternal: ((code: string) => void) | null = null;

    const StreamingCodeBlock = () => {
      const [streamedCode, setStreamedCode] = React.useState("");

      React.useEffect(() => {
        setStreamedCodeExternal = setStreamedCode;
      }, []);

      return (
        <div>
          <CodeBlock code={streamedCode} language="html" />
        </div>
      );
    };

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming" as const,
        }}
      >
        <StreamingCodeBlock />
      </StreamdownContext.Provider>
    );

    // Simulate streaming by updating in chunks
    const chunkSize = 100;
    let currentIndex = 0;
    let currentContent = "";

    // Stream the content in chunks
    while (currentIndex < largeContent.length) {
      const nextChunk = largeContent.slice(
        currentIndex,
        currentIndex + chunkSize
      );
      currentIndex += chunkSize;
      currentContent += nextChunk;

      await act(async () => {
        setStreamedCodeExternal?.(currentContent);
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 1));
      });
    }

    // Wait for the final render to complete
    await waitFor(
      () => {
        const codeBlock = container.querySelector(
          '[data-streamdown="code-block"]'
        );
        expect(codeBlock).toBeTruthy();
        // Check that content has been rendered
        const innerHTML = codeBlock?.innerHTML || "";
        expect(innerHTML.length).toBeGreaterThan(0);
      },
      { timeout: 10_000 }
    );

    // Wait a bit more for highlighting to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    // Verify the code block rendered successfully with content from the fixture
    const codeBlock = container.querySelector(
      '[data-streamdown="code-block"]'
    );
    expect(codeBlock?.innerHTML).toContain("Napoleon");

    // Verify the component is showing HTML language
    const languageLabel = container.querySelector(".font-mono.lowercase");
    expect(languageLabel?.textContent).toBe("html");

    // Verify the final content length matches the fixture
    expect(largeContent.length).toBeGreaterThan(8000); // Sanity check on fixture size
    expect(currentContent).toBe(largeContent);
  }, 30_000); // Increase test timeout to 30 seconds
});
