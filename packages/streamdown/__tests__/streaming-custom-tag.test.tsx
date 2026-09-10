import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type CustomComponentProps = Record<string, unknown> & ExtraProps;

const AiThinking = (props: CustomComponentProps) => (
  <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
);

describe("streaming custom tags with nested markdown", () => {
  it("parses bold while the closing tag has not arrived yet", async () => {
    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating
        mode="streaming"
      >
        {"<ai-thinking>\n**bold**"}
      </Streamdown>
    );

    // Flush useTransition so displayBlocks catches up in streaming mode.
    await act(() => Promise.resolve());

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    expect(el?.querySelector('[data-streamdown="strong"]')?.textContent).toBe(
      "bold"
    );
    expect(el?.textContent).not.toContain("**");
  });

  it("parses bold across streaming chunks up to close", async () => {
    const { container, rerender } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating
        mode="streaming"
      >
        {"<ai-thinking>\n**bol"}
      </Streamdown>
    );

    await act(() => Promise.resolve());

    rerender(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating
        mode="streaming"
      >
        {"<ai-thinking>\n**bold**"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    expect(
      container.querySelector('[data-streamdown="strong"]')?.textContent
    ).toBe("bold");

    rerender(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating={false}
        mode="streaming"
      >
        {"<ai-thinking>\n**bold**\n</ai-thinking>"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    expect(
      container.querySelector('[data-streamdown="strong"]')?.textContent
    ).toBe("bold");
  });

  it("parses lists while still incomplete", async () => {
    const md = "<ai-thinking>\n\n**bold** and more\n\n- list\n- **item**";
    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating
        mode="streaming"
      >
        {md}
      </Streamdown>
    );

    await act(() => Promise.resolve());

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el?.querySelectorAll('[data-streamdown="strong"]').length).toBe(2);
    expect(el?.querySelector("ul")).toBeTruthy();
  });
});
