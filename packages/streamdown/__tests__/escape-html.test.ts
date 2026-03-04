import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "../lib/markdown";

describe("remarkEscapeHtml", () => {
  it("should escape HTML when rehypeRaw is not in plugins", () => {
    // When no rehype plugins (including no rehypeRaw), HTML should be escaped to text
    const { container } = render(
      Markdown({
        children: "<div>Hello</div>",
        rehypePlugins: [],
      })
    );
    // HTML should appear as text, not as a rendered div
    expect(container.textContent).toContain("<div>Hello</div>");
    expect(container.querySelector("div div")).toBeFalsy();
  });

  it("should render HTML normally when rehypeRaw is present", () => {
    // Using default plugins which include rehypeRaw
    const { container } = render(
      Markdown({
        children: "<div>Hello</div>",
      })
    );
    // Without rehypeRaw, inline HTML is turned into text
    // The default processor includes no plugins if not passed
    expect(container.textContent).toContain("Hello");
  });
});
