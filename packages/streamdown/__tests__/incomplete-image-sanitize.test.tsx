import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins, Streamdown } from "../index";
import { Markdown } from "../lib/markdown";

const rehypePlugins = Object.values(defaultRehypePlugins);

describe("Incomplete streaming images", () => {
  it("should keep the remend sentinel src through the default sanitize schema", () => {
    const { container } = render(
      <Markdown
        children="![logo](streamdown:incomplete-image)"
        rehypePlugins={rehypePlugins}
      />
    );

    // Default Markdown path has no custom img component — assert the src
    // itself survives sanitize + harden (mirrors incomplete-link-sanitize).
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("streamdown:incomplete-image");
    expect(img?.getAttribute("alt")).toBe("logo");
    expect(container.textContent).not.toContain("[Image blocked");
  });

  it("should render incomplete markdown images via ImageComponent instead of harden [blocked]", () => {
    const { container } = render(
      <Streamdown mode="streaming">{"see ![the diag"}</Streamdown>
    );

    expect(container.textContent).not.toContain("[Image blocked");
    expect(container.querySelector('[title^="Blocked URL"]')).toBeNull();

    const placeholder = container.querySelector(
      '[data-streamdown="image-placeholder"]'
    );
    expect(placeholder).toBeTruthy();

    const wrapper = container.querySelector(
      '[data-streamdown="image-wrapper"]'
    );
    expect(wrapper?.getAttribute("data-incomplete")).toBe("true");
  });

  it("should render incomplete image URL tails via ImageComponent instead of harden [blocked]", () => {
    const { container } = render(
      <Streamdown mode="streaming">{"see ![logo](https://exam"}</Streamdown>
    );

    expect(container.textContent).not.toContain("[Image blocked");
    expect(container.querySelector('[title^="Blocked URL"]')).toBeNull();

    const placeholder = container.querySelector(
      '[data-streamdown="image-placeholder"]'
    );
    expect(placeholder).toBeTruthy();
  });

  it("should not treat a normal https image as incomplete", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"![pixel](https://example.com/a.png)"}
      </Streamdown>
    );

    expect(
      container.querySelector('[data-streamdown="image-placeholder"]')
    ).toBeNull();
    expect(
      container.querySelector('img[data-streamdown="image"]')
    ).toBeTruthy();
  });
});
