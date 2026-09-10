import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type CustomComponentProps = Record<string, unknown> & ExtraProps;

// Regex for matching literal asterisks (possibly backslash-escaped) in plain text output
const LITERAL_BOLD_RE = /\*{2}bold\*{2}|\\?\*{1,2}bold\\?\*{1,2}/;

// Streamdown renders <strong> as <span data-streamdown="strong"> via its default components.
// Use this selector in all assertions.
const STRONG_SELECTOR = '[data-streamdown="strong"]';

describe("Issue #478 - Markdown inside custom tags (multiline content)", () => {
  it("should render bold markdown inside custom tag with newline prefix", () => {
    const AiThinking = (props: CustomComponentProps) => (
      <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {"<ai-thinking>\n**bold**</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();

    // Should contain a bold element for **bold**
    const strong = el?.querySelector(STRONG_SELECTOR);
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe("bold");
  });

  it("single-line content should still work", () => {
    const AiThinking = (props: CustomComponentProps) => (
      <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {"<ai-thinking>**bold**</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    const strong = el?.querySelector(STRONG_SELECTOR);
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe("bold");
  });

  it("should render inline code inside custom tag with multiline content", () => {
    const AiThinking = (props: CustomComponentProps) => (
      <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {"<ai-thinking>\n`code`</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    const code = el?.querySelector("code");
    expect(code).toBeTruthy();
    expect(code?.textContent).toBe("code");
  });

  it("should not affect literalTagContent tags", () => {
    const AiThinking = (props: CustomComponentProps) => (
      <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        literalTagContent={["ai-thinking"]}
        mode="static"
      >
        {"<ai-thinking>\n**bold**</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    // literalTagContent should suppress markdown parsing — no bold element
    expect(el?.querySelector(STRONG_SELECTOR)).toBeNull();
    // The text content should contain the literal asterisks (possibly backslash-escaped)
    const text = el?.textContent ?? "";
    expect(text).toMatch(LITERAL_BOLD_RE);
  });
});
