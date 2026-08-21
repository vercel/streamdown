/**
 * React-level coverage for animating non-text elements (list markers,
 * task-list checkboxes, images, horizontal rules).
 *
 * The animate plugin emits these as HAST properties with a *string* style.
 * These tests confirm react-markdown converts that string into real DOM
 * attributes / CSS custom properties through the memo'd components — something
 * the plugin-level (rehype string) tests in animate.test.ts can't verify.
 */

import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const animated = {
  animation: "fadeIn" as const,
  duration: 500,
  easing: "ease",
};

const renderAnimated = async (markdown: string) => {
  const result = render(
    <Streamdown animated={animated} isAnimating={true}>
      {markdown}
    </Streamdown>
  );
  await act(() => Promise.resolve());
  return result;
};

describe("void element animation (React render)", () => {
  it("stamps the marker timing onto a list item", async () => {
    const { container } = await renderAnimated("- First item\n");
    const li = container.querySelector('[data-streamdown="list-item"]');
    expect(li).not.toBeNull();
    expect(li?.getAttribute("data-sd-animate-marker")).not.toBeNull();
    const style = li?.getAttribute("style") ?? "";
    expect(style).toContain("--sd-marker-duration");
    expect(style).toContain("--sd-marker-easing");
  });

  it("animates a task-list checkbox", async () => {
    const { container } = await renderAnimated("- [ ] A task item\n");
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute("data-sd-animate")).not.toBeNull();
    expect(input?.getAttribute("style") ?? "").toContain("--sd-animation");
  });

  it("animates an image", async () => {
    const { container } = await renderAnimated(
      "![alt](https://example.com/a.png)\n"
    );
    const img = container.querySelector('[data-streamdown="image"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute("data-sd-animate")).not.toBeNull();
    expect(img?.getAttribute("style") ?? "").toContain("--sd-animation");
  });

  it("animates a horizontal rule", async () => {
    const { container } = await renderAnimated("Above\n\n---\n\nBelow\n");
    const hr = container.querySelector('[data-streamdown="horizontal-rule"]');
    expect(hr).not.toBeNull();
    expect(hr?.getAttribute("data-sd-animate")).not.toBeNull();
    expect(hr?.getAttribute("style") ?? "").toContain("--sd-animation");
  });
});
