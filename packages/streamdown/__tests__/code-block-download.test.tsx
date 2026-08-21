import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { CodeBlock } from "../lib/code-block";
import { CodeBlockDownloadButton } from "../lib/code-block/download-button";

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

describe("CodeBlockDownloadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should download code with correct filename and language extension", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();

    const { container } = render(
      <CodeBlock code="console.log('hello');" language="javascript">
        <CodeBlockDownloadButton
          code="console.log('hello');"
          language="javascript"
          onDownload={onDownload}
        />
      </CodeBlock>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button).toBeTruthy();
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith(
      "file.js",
      "console.log('hello');",
      "text/plain"
    );
    expect(onDownload).toHaveBeenCalled();
  });

  it("should use .txt extension for unknown languages", async () => {
    const { save } = await import("../lib/utils");

    const { container } = render(
      <CodeBlock code="some code" language="unknownlang">
        <CodeBlockDownloadButton code="some code" language="unknownlang" />
      </CodeBlock>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith("file.txt", "some code", "text/plain");
  });

  it("should call onError when save throws", async () => {
    const { save } = await import("../lib/utils");
    (save as any).mockImplementation(() => {
      throw new Error("Save failed");
    });

    const onError = vi.fn();

    const { container } = render(
      <CodeBlock code="test" language="text">
        <CodeBlockDownloadButton
          code="test"
          language="text"
          onError={onError}
        />
      </CodeBlock>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should be disabled when isAnimating", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: true,
          mode: "streaming",
        }}
      >
        <CodeBlock code="test" language="text">
          <CodeBlockDownloadButton code="test" language="text" />
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("should use custom filename from controls", async () => {
    const { save } = await import("../lib/utils");

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: {
            code: { download: { filename: "myScript" } },
          },
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <CodeBlock code="console.log('test');" language="javascript">
          <CodeBlockDownloadButton
            code="console.log('test');"
            language="javascript"
          />
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith(
      "myScript.js",
      "console.log('test');",
      "text/plain"
    );
  });

  it("should use custom filename with unknown language", async () => {
    const { save } = await import("../lib/utils");

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: {
            code: { download: { filename: "output" } },
          },
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <CodeBlock code="some data" language="unknown">
          <CodeBlockDownloadButton code="some data" language="unknown" />
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith("output.txt", "some data", "text/plain");
  });

  it("should fall back to default filename when controls is true", async () => {
    const { save } = await import("../lib/utils");

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <CodeBlock code="python code" language="python">
          <CodeBlockDownloadButton code="python code" language="python" />
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith("file.py", "python code", "text/plain");
  });

  it("should fall back to default filename when download is enabled without a filename", async () => {
    const { save } = await import("../lib/utils");

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: { code: { download: true } },
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <CodeBlock code="rust code" language="rust">
          <CodeBlockDownloadButton code="rust code" language="rust" />
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith("file.rs", "rust code", "text/plain");
  });

  it("should handle special characters in custom filename", async () => {
    const { save } = await import("../lib/utils");

    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: {
            code: { download: { filename: "my-config.backup" } },
          },
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <CodeBlock code="config data" language="json">
          <CodeBlockDownloadButton code="config data" language="json" />
        </CodeBlock>
      </StreamdownContext.Provider>
    );

    await waitFor(() => {
      const button = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(button?.hasAttribute("disabled")).toBe(false);
    });

    const button = container.querySelector(
      '[data-streamdown="code-block-download-button"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(button!);

    expect(save).toHaveBeenCalledWith(
      "my-config.backup.json",
      "config data",
      "text/plain"
    );
  });
});
