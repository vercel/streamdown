import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

afterEach(() => vi.restoreAllMocks());

describe("animation history after clearing content", () => {
  it.each([
    50, 1000,
  ])("animates the first batch again after clearing at %i ms", async (elapsed) => {
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const message = (text: string) => (
      <StrictMode>
        <Streamdown animated={{ duration: 250, stagger: 40 }} isAnimating>
          {text}
        </Streamdown>
      </StrictMode>
    );
    const batch = "Alpha beta gamma delta epsilon zeta eta theta";
    const { container, rerender } = render(message(batch));
    now += elapsed;
    await act(() => rerender(message("")));
    await act(() => rerender(message(batch)));
    const words = [
      ...container.querySelectorAll<HTMLElement>("[data-sd-animate]"),
    ];
    expect(words).toHaveLength(8);
    for (const [index, word] of words.entries()) {
      expect(word.style.getPropertyValue("--sd-duration")).toBe("250ms");
      expect(word.style.getPropertyValue("--sd-delay") || "0ms").toBe(
        `${index * 40}ms`
      );
    }
  });
});

describe.each([
  false,
  true,
])("animation lifetime (StrictMode: %s)", (strict) => {
  it("preserves pending and active fades across fast updates, then settles them", async () => {
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const config = { duration: 250, stagger: 100 };
    const message = (text: string) => {
      const content = (
        <Streamdown animated={config} isAnimating>
          {text}
        </Streamdown>
      );
      return strict ? <StrictMode>{content}</StrictMode> : content;
    };
    const { container, rerender } = render(message("One two three"));
    const words = [
      ...container.querySelectorAll<HTMLElement>("[data-sd-animate]"),
    ];
    const styles = words.map((word) => word.getAttribute("style"));
    expect(words).toHaveLength(3);

    now += 50;
    await act(() => rerender(message("One two three four")));
    const updated = [
      ...container.querySelectorAll<HTMLElement>("[data-sd-animate]"),
    ];
    for (const [index, word] of words.entries()) {
      expect(updated[index]).toBe(word);
      expect(word.getAttribute("style")).toBe(styles[index]);
    }

    now += 50;
    await act(() => rerender(message("One two three four five")));
    for (const [index, word] of words.entries()) {
      expect(word.getAttribute("style")).toBe(styles[index]);
    }

    now = 1600;
    await act(() => rerender(message("One two three four five six")));
    for (const word of words) {
      expect(word.style.getPropertyValue("--sd-duration")).toBe("0ms");
    }
    const last = container.querySelector<HTMLElement>(
      "[data-sd-animate]:last-child"
    );
    expect(last?.textContent?.trim()).toBe("six");
    expect(last?.style.getPropertyValue("--sd-duration")).toBe("250ms");
  });

  it("keeps a partial word's fade while tokens extend that word", async () => {
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const message = (text: string) => {
      const content = (
        <Streamdown animated={{ duration: 250 }} isAnimating>
          {text}
        </Streamdown>
      );
      return strict ? <StrictMode>{content}</StrictMode> : content;
    };
    const { container, rerender } = render(message("Hel"));
    const word = container.querySelector<HTMLElement>("[data-sd-animate]");
    const style = word?.getAttribute("style");
    now += 50;
    await act(() => rerender(message("Hello")));
    expect(container.querySelector("[data-sd-animate]")).toBe(word);
    expect(word?.textContent).toBe("Hello");
    expect(word?.getAttribute("style")).toBe(style);
  });
});
