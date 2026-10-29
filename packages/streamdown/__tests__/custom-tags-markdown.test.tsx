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

describe("Fenced code blocks inside custom tags", () => {
  it("should not render HTML comment placeholders inside code", () => {
    const Note = (props: CustomComponentProps) => (
      <div data-testid="note">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ note: [] }}
        components={{ note: Note }}
        mode="static"
      >
        {"<note>\n```js\nconst a = 1;\n\nconst b = 2;\n```\n</note>"}
      </Streamdown>
    );

    const note = container.querySelector('[data-testid="note"]');
    expect(note).toBeTruthy();
    const code = note?.querySelector("pre");
    expect(code).toBeTruthy();
    expect(code?.textContent).toContain("const a = 1;");
    expect(code?.textContent).toContain("const b = 2;");
    expect(code?.textContent).not.toContain("<!---->");
  });
});

describe("Custom tag position on the line", () => {
  it("should keep a loose list whole after a self-closing tag", () => {
    const { container } = render(
      <Streamdown allowedTags={{ cite: ["id"] }} mode="static">
        {'Intro <cite id="a" />\n\n- one\n\n- two\n\nLast'}
      </Streamdown>
    );

    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(1);
    expect(lists[0].querySelectorAll("li")).toHaveLength(2);
  });

  it("should keep a soft line break inside a tag that follows text", () => {
    const Verse = (props: CustomComponentProps) => (
      <span data-testid="verse">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ verse: [] }}
        components={{ verse: Verse }}
        mode="static"
      >
        {"He said: <verse>line one\nline two</verse> and left."}
      </Streamdown>
    );

    const verse = container.querySelector('[data-testid="verse"]');
    expect(verse?.textContent).toBe("line one\nline two");
    expect(verse?.closest("p")?.textContent).toBe(
      "He said: line one\nline two and left."
    );
  });

  it.each([
    ["a bullet item", "- <note>\n  **bold**\n  </note>"],
    ["an ordered item", "1. <note>\n   **bold**\n   </note>"],
    ["an indented line", "- a\n\n  <note>\n  **bold**\n  </note>"],
  ])("should still parse markdown in a tag that starts %s", (_name, md) => {
    const Note = (props: CustomComponentProps) => (
      <div data-testid="note">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ note: [] }}
        components={{ note: Note }}
        mode="static"
      >
        {md}
      </Streamdown>
    );

    const strong = container.querySelector(
      `[data-testid="note"] ${STRONG_SELECTOR}`
    );
    expect(strong?.textContent).toBe("bold");
  });

  it("should still parse markdown in a tag after a closing tag", () => {
    const Note = (props: CustomComponentProps) => (
      <div data-testid="note">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ note: [] }}
        components={{ note: Note }}
        mode="static"
      >
        {"<note>\na\n</note> <note>\n**b**\n</note>"}
      </Streamdown>
    );

    const strong = container.querySelector(
      `[data-testid="note"] ${STRONG_SELECTOR}`
    );
    expect(strong?.textContent).toBe("b");
  });
});
