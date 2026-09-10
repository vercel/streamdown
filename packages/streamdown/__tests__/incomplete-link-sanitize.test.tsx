import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins, Streamdown } from "../index";
import { Markdown } from "../lib/markdown";

const rehypePlugins = Object.values(defaultRehypePlugins);

describe("Incomplete streaming links (#551)", () => {
  it("should keep the remend sentinel href through the default sanitize schema", () => {
    const { container } = render(
      <Markdown
        children="[the docs](streamdown:incomplete-link)"
        rehypePlugins={rehypePlugins}
      />
    );
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("streamdown:incomplete-link");
    expect(link?.textContent).toBe("the docs");
    expect(container.textContent).not.toContain("[blocked]");
  });

  it("should render incomplete markdown links via MarkdownA instead of harden [blocked]", () => {
    const { container } = render(
      <Streamdown mode="streaming">{"see [the docs"}</Streamdown>
    );

    const blocked = container.querySelector('[title="Blocked URL: undefined"]');
    expect(blocked).toBeNull();
    expect(container.textContent).not.toContain("[blocked]");

    const link = container.querySelector('[data-streamdown="link"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute("data-incomplete")).toBe("true");
    expect(link?.textContent).toBe("the docs");
  });

  it("should render incomplete URL tails via MarkdownA instead of harden [blocked]", () => {
    const { container } = render(
      <Streamdown mode="streaming">{"see [the docs](https://exam"}</Streamdown>
    );

    expect(
      container.querySelector('[title="Blocked URL: undefined"]')
    ).toBeNull();
    expect(container.textContent).not.toContain("[blocked]");

    const link = container.querySelector('[data-streamdown="link"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute("data-incomplete")).toBe("true");
    expect(link?.textContent).toBe("the docs");
  });
});
