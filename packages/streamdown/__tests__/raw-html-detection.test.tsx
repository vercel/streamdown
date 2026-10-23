import { render } from "@testing-library/react";
import rehypeRaw from "rehype-raw";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { Markdown } from "../lib/markdown";
import { isRehypeRaw } from "../lib/raw-registry";

const html = "Text with <em>HTML</em> here";

describe("raw HTML detection", () => {
  it("renders raw HTML by default", () => {
    const { container } = render(<Streamdown>{html}</Streamdown>);
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("escapes HTML when custom rehypePlugins do not include rehype-raw", () => {
    const { container } = render(
      <Markdown rehypePlugins={[() => undefined]}>{html}</Markdown>
    );
    expect(container.querySelector("em")).toBeNull();
    expect(container.innerHTML).toContain("&lt;em&gt;");
  });

  it("detects a user-supplied rehypeRaw", () => {
    const { container } = render(
      <Markdown rehypePlugins={[rehypeRaw]}>{html}</Markdown>
    );
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("detects rehypeRaw passed with options", () => {
    const { container } = render(
      <Markdown rehypePlugins={[[rehypeRaw, {}]]}>{html}</Markdown>
    );
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("isRehypeRaw ignores unrelated values", () => {
    expect(isRehypeRaw(rehypeRaw)).toBe(true);
    expect(isRehypeRaw(() => undefined)).toBe(false);
    expect(isRehypeRaw("rehype-raw")).toBe(false);
  });
});
