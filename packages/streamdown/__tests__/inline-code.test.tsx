import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("inlineCode virtual component", () => {
  it("should render custom inlineCode for inline code spans", async () => {
    const { container } = render(
      <Streamdown
        mode="static"
        components={{
          inlineCode: ({ children, ...props }) => (
            <span data-testid="custom-inline" {...props}>
              {children}
            </span>
          ),
        }}
      >
        {"Use `useState` for state"}
      </Streamdown>
    );

    await waitFor(() => {
      const customInline = container.querySelector(
        '[data-testid="custom-inline"]'
      );
      expect(customInline).toBeTruthy();
      expect(customInline?.textContent).toBe("useState");
    });
  });

  it("should not affect block code rendering", async () => {
    const { container } = render(
      <Streamdown
        mode="static"
        components={{
          inlineCode: ({ children, ...props }) => (
            <span data-testid="custom-inline" {...props}>
              {children}
            </span>
          ),
        }}
      >
        {"```js\nconst x = 1;\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).toBeTruthy();
    });

    // Block code should NOT use the custom inlineCode component
    const customInline = container.querySelector(
      '[data-testid="custom-inline"]'
    );
    expect(customInline).toBeNull();
  });

  it("should allow overriding both code and inlineCode independently", async () => {
    const { container } = render(
      <Streamdown
        mode="static"
        components={{
          code: ({ children, ...props }) => (
            <code data-testid="custom-block" {...props}>
              {children}
            </code>
          ),
          inlineCode: ({ children, ...props }) => (
            <span data-testid="custom-inline" {...props}>
              {children}
            </span>
          ),
        }}
      >
        {"Use `hook` here\n\n```js\nconst x = 1;\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      const customInline = container.querySelector(
        '[data-testid="custom-inline"]'
      );
      expect(customInline).toBeTruthy();
      expect(customInline?.textContent).toBe("hook");
    });

    // Block code should use the custom code component, not inlineCode
    const customBlock = container.querySelector('[data-testid="custom-block"]');
    expect(customBlock).toBeTruthy();

    // The custom block code should have data-block
    expect(customBlock?.getAttribute("data-block")).toBe("true");
  });
});
