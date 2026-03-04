import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlockBody } from "../lib/code-block/body";

describe("CodeBlockBody", () => {
  const baseResult = {
    tokens: [[{ content: "const x = 1;", color: "#000" }]],
    bg: "#fff",
    fg: "#000",
  };

  it("should render with basic result", () => {
    const { container } = render(
      <CodeBlockBody language="javascript" result={baseResult} />
    );

    const body = container.querySelector('[data-streamdown="code-block-body"]');
    expect(body).toBeTruthy();
    expect(body?.getAttribute("data-language")).toBe("javascript");
  });

  it("should set CSS custom properties for bg and fg", () => {
    const { container } = render(
      <CodeBlockBody
        language="javascript"
        result={{ ...baseResult, bg: "#1e1e1e", fg: "#d4d4d4" }}
      />
    );

    const pre = container.querySelector("pre");
    expect(pre?.style.getPropertyValue("--sdm-bg")).toBe("#1e1e1e");
    expect(pre?.style.getPropertyValue("--sdm-fg")).toBe("#d4d4d4");
  });

  it("should parse rootStyle CSS variables", () => {
    const { container } = render(
      <CodeBlockBody
        language="javascript"
        result={{
          ...baseResult,
          rootStyle: "--shiki-dark-bg:#222;--shiki-dark-fg:#eee",
        }}
      />
    );

    const pre = container.querySelector("pre");
    expect(pre?.style.getPropertyValue("--shiki-dark-bg")).toBe("#222");
    expect(pre?.style.getPropertyValue("--shiki-dark-fg")).toBe("#eee");
  });

  it("should handle rootStyle with spaces and empty declarations", () => {
    const { container } = render(
      <CodeBlockBody
        language="javascript"
        result={{
          ...baseResult,
          rootStyle: " --a : red ; ; --b: blue ",
        }}
      />
    );

    const pre = container.querySelector("pre");
    expect(pre?.style.getPropertyValue("--a")).toBe("red");
    expect(pre?.style.getPropertyValue("--b")).toBe("blue");
  });

  it("should handle no bg or fg in result", () => {
    const { container } = render(
      <CodeBlockBody
        language="text"
        result={{ tokens: [[{ content: "test" }]] }}
      />
    );

    const pre = container.querySelector("pre");
    expect(pre?.style.getPropertyValue("--sdm-bg")).toBe("");
    expect(pre?.style.getPropertyValue("--sdm-fg")).toBe("");
  });

  it("should handle token with htmlStyle color", () => {
    const result = {
      tokens: [
        [
          {
            content: "const",
            htmlStyle: { color: "#ff0000" },
          },
        ],
      ],
    };

    const { container } = render(
      <CodeBlockBody language="javascript" result={result} />
    );

    const tokenSpan = container.querySelector("code span span");
    expect(tokenSpan?.style.getPropertyValue("--sdm-c")).toBe("#ff0000");
  });

  it("should handle token with htmlStyle background-color", () => {
    const result = {
      tokens: [
        [
          {
            content: "highlight",
            htmlStyle: { "background-color": "#ffff00" },
          },
        ],
      ],
    };

    const { container } = render(
      <CodeBlockBody language="javascript" result={result} />
    );

    const tokenSpan = container.querySelector("code span span");
    expect(tokenSpan?.style.getPropertyValue("--sdm-tbg")).toBe("#ffff00");
    expect(tokenSpan?.className).toContain("bg-[var(--sdm-tbg)]");
  });

  it("should handle token with htmlStyle non-standard properties", () => {
    const result = {
      tokens: [
        [
          {
            content: "text",
            htmlStyle: { "font-style": "italic" },
          },
        ],
      ],
    };

    const { container } = render(
      <CodeBlockBody language="javascript" result={result} />
    );

    const tokenSpan = container.querySelector("code span span");
    expect(tokenSpan?.style.fontStyle).toBe("italic");
  });

  it("should handle token with bgColor property", () => {
    const result = {
      tokens: [
        [
          {
            content: "bg",
            bgColor: "#00ff00",
          },
        ],
      ],
    };

    const { container } = render(
      <CodeBlockBody language="javascript" result={result} />
    );

    const tokenSpan = container.querySelector("code span span");
    expect(tokenSpan?.style.getPropertyValue("--sdm-tbg")).toBe("#00ff00");
    expect(tokenSpan?.className).toContain("bg-[var(--sdm-tbg)]");
  });

  it("should render multiple rows with line numbers", () => {
    const result = {
      tokens: [
        [{ content: "line 1" }],
        [{ content: "line 2" }],
        [{ content: "line 3" }],
      ],
    };

    const { container } = render(
      <CodeBlockBody language="text" result={result} />
    );

    const lineSpans = container.querySelectorAll("code > span");
    expect(lineSpans.length).toBe(3);
  });

  it("should render newline for empty row (single empty-content token)", () => {
    const result = {
      tokens: [
        [{ content: "line 1" }],
        [{ content: "" }],
        [{ content: "line 3" }],
      ],
    };

    const { container } = render(
      <CodeBlockBody language="text" result={result} />
    );

    const lineSpans = container.querySelectorAll("code > span");
    expect(lineSpans.length).toBe(3);

    // Empty row should contain a newline, not a token span
    const emptyLine = lineSpans[1];
    expect(emptyLine?.querySelector("span")).toBeNull();
    expect(emptyLine?.textContent).toBe("\n");
  });

  it("should render newline for empty row (zero tokens)", () => {
    const result = {
      tokens: [[{ content: "line 1" }], [], [{ content: "line 3" }]],
    };

    const { container } = render(
      <CodeBlockBody language="text" result={result} />
    );

    const lineSpans = container.querySelectorAll("code > span");
    expect(lineSpans.length).toBe(3);

    const emptyLine = lineSpans[1];
    expect(emptyLine?.querySelector("span")).toBeNull();
    expect(emptyLine?.textContent).toBe("\n");
  });

  it("should handle token with color property", () => {
    const result = {
      tokens: [[{ content: "colored", color: "#abc123" }]],
    };

    const { container } = render(
      <CodeBlockBody language="text" result={result} />
    );

    const tokenSpan = container.querySelector("code span span");
    expect(tokenSpan?.style.getPropertyValue("--sdm-c")).toBe("#abc123");
  });
});
