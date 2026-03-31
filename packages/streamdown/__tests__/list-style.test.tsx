import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreamdownContext, type StreamdownContextType } from "../index";
import { components as customComponents } from "../lib/components";
import { Markdown } from "../lib/markdown";

const createContextValue = (
  overrides?: Partial<StreamdownContextType>
): StreamdownContextType => ({
  shikiTheme: ["github-light", "github-dark"],
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  listStyle: "hierarchical",
  mode: "streaming",
  mermaid: undefined,
  linkSafety: undefined,
  ...overrides,
});

const renderWithComponents = (
  content: string,
  contextOverrides?: Partial<StreamdownContextType>
) =>
  render(
    <StreamdownContext.Provider value={createContextValue(contextOverrides)}>
      <Markdown components={customComponents}>{content}</Markdown>
    </StreamdownContext.Provider>
  );

describe("List Style and Depth", () => {
  it("should add data-depth attributes to nested unordered lists", () => {
    const content = `- Item 1
  - Nested 1
    - Deep 1
  - Nested 2
- Item 2`;
    const { container } = renderWithComponents(content);
    const uls = container.querySelectorAll(
      '[data-streamdown="unordered-list"]'
    );
    expect(uls.length).toBeGreaterThanOrEqual(2);
    expect(uls[0]?.getAttribute("data-depth")).toBe("0");
    if (uls[1]) {
      expect(uls[1].getAttribute("data-depth")).toBe("1");
    }
  });

  it("should add data-depth attributes to nested ordered lists", () => {
    const content = `1. First
   1. Sub first
   2. Sub second
2. Second`;
    const { container } = renderWithComponents(content);
    const ols = container.querySelectorAll(
      '[data-streamdown="ordered-list"]'
    );
    expect(ols.length).toBeGreaterThanOrEqual(1);
    expect(ols[0]?.getAttribute("data-depth")).toBe("0");
  });

  it("should add data-depth attributes to list items", () => {
    const content = `- A
  - B
    - C`;
    const { container } = renderWithComponents(content);
    const lis = container.querySelectorAll(
      '[data-streamdown="list-item"]'
    );
    expect(lis.length).toBeGreaterThanOrEqual(3);
    expect(lis[0]?.getAttribute("data-depth")).toBe("0");
    expect(lis[1]?.getAttribute("data-depth")).toBe("1");
    expect(lis[2]?.getAttribute("data-depth")).toBe("2");
  });

  it("should apply list-disc to all li in flat mode", () => {
    const content = `- Item 1
  - Nested 1`;
    const { container } = renderWithComponents(content, {
      listStyle: "flat",
    });
    const lis = container.querySelectorAll(
      '[data-streamdown="list-item"]'
    );
    for (const li of lis) {
      expect(li.className).toContain("list-disc");
    }
  });

  it("should cycle bullet styles in hierarchical mode (default)", () => {
    const content = `- Level 0
  - Level 1
    - Level 2`;
    const { container } = renderWithComponents(content);
    const lis = container.querySelectorAll(
      '[data-streamdown="list-item"]'
    );
    expect(lis.length).toBeGreaterThanOrEqual(3);
    expect(lis[0]?.className).toContain("list-disc");
    expect(lis[1]?.className).toContain("list-[circle]");
    expect(lis[2]?.className).toContain("list-[square]");
  });

  it("should not apply bullet styles to li inside ordered lists", () => {
    const content = `1. First
2. Second`;
    const { container } = renderWithComponents(content);
    const lis = container.querySelectorAll(
      '[data-streamdown="list-item"]'
    );
    for (const li of lis) {
      expect(li.className).not.toContain("list-disc");
      expect(li.className).not.toContain("list-[circle]");
      expect(li.className).not.toContain("list-[square]");
    }
  });

  it("should not have bullet class on ul (bullet style is on li)", () => {
    const content = `- Item 1
- Item 2`;
    const { container } = renderWithComponents(content);
    const ul = container.querySelector(
      '[data-streamdown="unordered-list"]'
    );
    expect(ul).toBeTruthy();
    expect(ul?.className).toContain("list-inside");
    expect(ul?.className).not.toContain("list-disc");
  });

  it("sibling lists should both start at depth 0", () => {
    const content = `- List A1
- List A2

Some text

- List B1
- List B2`;
    const { container } = renderWithComponents(content);
    const uls = container.querySelectorAll(
      '[data-streamdown="unordered-list"]'
    );
    for (const ul of uls) {
      expect(ul.getAttribute("data-depth")).toBe("0");
    }
  });

  it("should track ul depth separately from ol depth for bullet styles", () => {
    const content = `- Unordered
  1. Ordered inside
     - Deep unordered`;
    const { container } = renderWithComponents(content, {
      listStyle: "hierarchical",
    });
    const lis = container.querySelectorAll(
      '[data-streamdown="list-item"]'
    );
    // The top ul li should be disc
    expect(lis[0]?.className).toContain("list-disc");
    // The ol > li should NOT have bullet styles
    if (lis[1]) {
      expect(lis[1].className).not.toContain("list-disc");
      expect(lis[1].className).not.toContain("list-[circle]");
    }
    // The nested ul > li inside ol should be circle (ulDepth=1)
    if (lis[2]) {
      expect(lis[2].className).toContain("list-[circle]");
    }
  });
});
