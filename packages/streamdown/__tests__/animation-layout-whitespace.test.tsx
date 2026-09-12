import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

afterEach(() => vi.restoreAllMocks());

const prefixes = [
  ["paragraph", "But in ourselves, that we"],
  ["tight list", "1. First\n2. But in ourselves, that we"],
  ["loose ordered list", "1. First\n\n2. But in ourselves, that we"],
  ["loose unordered list", "- First\n\n- But in ourselves, that we"],
  ["italic list item", "1. First\n\n2. *But in ourselves, that we"],
  ["nested list", "- First\n\n  - But in ourselves, that we"],
  ["quoted list", "> 1. First\n>\n> 2. But in ourselves, that we"],
];

describe.each(["word", "char"] as const)("layout whitespace (%s)", (sep) => {
  it.each(prefixes)("fades every arriving unit in a %s", async (_, prefix) => {
    const clock = vi.spyOn(performance, "now").mockReturnValue(1000);
    const config = { duration: 250, stagger: 10, sep };
    const message = (text: string) => (
      <StrictMode>
        <Streamdown animated={config} isAnimating>
          {text}
        </Streamdown>
      </StrictMode>
    );
    const { container, rerender } = render(message(prefix));
    const read = () => [
      ...container.querySelectorAll<HTMLElement>("[data-sd-animate]"),
    ];
    const previous = read();
    const styles = previous.map((word) => word.getAttribute("style"));
    clock.mockReturnValue(1050);
    await act(() => rerender(message(`${prefix} are underlings.`)));
    const updated = read();
    for (const [index, word] of previous.entries()) {
      expect(updated[index]).toBe(word);
      expect(word.getAttribute("style")).toBe(styles[index]);
    }
    const arrived = updated.slice(previous.length);
    expect(arrived.map((word) => word.textContent).join("")).toBe(
      "are underlings."
    );
    for (const word of arrived) {
      expect(word.style.getPropertyValue("--sd-duration")).toBe("250ms");
    }
    const delays = arrived.map((word) =>
      Number.parseFloat(word.style.getPropertyValue("--sd-delay") || "0")
    );
    for (let index = 1; index < delays.length; index++) {
      expect(delays[index]).toBeGreaterThan(delays[index - 1]);
    }
  });
});

it("preserves source whitespace between inline elements in the animation offsets", async () => {
  const clock = vi.spyOn(performance, "now").mockReturnValue(1000);
  const config = { duration: 250, stagger: 10 };
  const message = (text: string) => (
    <Streamdown animated={config} isAnimating>
      {text}
    </Streamdown>
  );
  const { container, rerender } = render(message("1. First\n\n2. *One* "));
  clock.mockReturnValue(1050);
  await act(() => rerender(message("1. First\n\n2. *One* **two** three")));
  const words = [
    ...container.querySelectorAll<HTMLElement>("[data-sd-animate]"),
  ];
  expect(words.slice(-2).map((word) => word.textContent)).toEqual([
    "two",
    "three",
  ]);
  for (const word of words.slice(-2)) {
    expect(word.style.getPropertyValue("--sd-duration")).toBe("250ms");
  }
});
