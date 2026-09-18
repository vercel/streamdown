import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type BlockProps, Streamdown } from "../index";

const first = "Hello there";
const words = (count: number) =>
  Array.from({ length: count }, (_, i) => `word${i}`).join(" ");
const full = `${first} ${words(40)}`;

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const textOf = (container: HTMLElement) => container.textContent ?? "";

describe("smooth", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "performance",
        "Date",
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders appends immediately when off", () => {
    const { container, rerender } = render(
      <Streamdown isAnimating>{first}</Streamdown>
    );
    rerender(<Streamdown isAnimating>{full}</Streamdown>);
    expect(textOf(container)).toBe(full);
  });

  it("shows existing content immediately on mount", () => {
    const { container } = render(<Streamdown smooth>{full}</Streamdown>);
    expect(textOf(container)).toBe(full);
  });

  it("reveals a large append over time, a word at a time", () => {
    const { container, rerender } = render(
      <Streamdown isAnimating smooth>
        {first}
      </Streamdown>
    );
    advance(500);
    rerender(
      <Streamdown isAnimating smooth>
        {`${full} `}
      </Streamdown>
    );
    expect(textOf(container)).toBe(first);

    advance(48);
    const partial = textOf(container);
    expect(partial.length).toBeGreaterThan(first.length);
    expect(partial.length).toBeLessThan(full.length);
    expect(full.startsWith(partial)).toBe(true);
    expect(full.charAt(partial.length)).toBe(" ");

    advance(1000);
    expect(textOf(container)).toBe(full);
  });

  it("keeps streaming behavior until caught up after switching to static", () => {
    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating smooth>
        {first}
      </Streamdown>
    );
    advance(500);
    // The stream ends in the same update that delivers a large final chunk,
    // and the app switches to static mode.
    rerender(
      <Streamdown caret="block" isAnimating={false} mode="static" smooth>
        {full}
      </Streamdown>
    );
    const caret = () =>
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        "--streamdown-caret"
      );
    expect(textOf(container).length).toBeLessThan(full.length);
    expect(caret()).toBe('" ▋"');

    advance(300);
    expect(textOf(container)).toBe(full);
    expect(caret()).toBe("");
  });

  it("fires onAnimationEnd once the held-back text is shown", () => {
    const onAnimationEnd = vi.fn();
    const { container, rerender } = render(
      <Streamdown isAnimating onAnimationEnd={onAnimationEnd} smooth>
        {first}
      </Streamdown>
    );
    advance(500);
    rerender(
      <Streamdown isAnimating={false} onAnimationEnd={onAnimationEnd} smooth>
        {full}
      </Streamdown>
    );
    expect(textOf(container).length).toBeLessThan(full.length);
    expect(onAnimationEnd).not.toHaveBeenCalled();

    advance(300);
    expect(textOf(container)).toBe(full);
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it("shows a change that is not an append immediately", () => {
    const { container, rerender } = render(
      <Streamdown isAnimating smooth>
        {full}
      </Streamdown>
    );
    rerender(
      <Streamdown isAnimating smooth>
        {"A different message entirely"}
      </Streamdown>
    );
    expect(textOf(container)).toBe("A different message entirely");
  });

  it("shows everything at once in a hidden tab", () => {
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    try {
      const { container, rerender } = render(
        <Streamdown isAnimating smooth>
          {first}
        </Streamdown>
      );
      advance(500);
      rerender(
        <Streamdown isAnimating smooth>
          {`${full} `}
        </Streamdown>
      );
      expect(textOf(container)).toBe(full);
    } finally {
      visibility.mockRestore();
    }
  });

  it("does not rewind when turned on mid-stream", () => {
    const rendered: string[] = [];
    const RecordingBlock = ({ content }: BlockProps) => {
      rendered.push(content);
      return <p>{content}</p>;
    };
    const { rerender } = render(
      <Streamdown BlockComponent={RecordingBlock} isAnimating>
        {first}
      </Streamdown>
    );
    rerender(
      <Streamdown BlockComponent={RecordingBlock} isAnimating>
        {full}
      </Streamdown>
    );
    rendered.length = 0;
    rerender(
      <Streamdown BlockComponent={RecordingBlock} isAnimating smooth>
        {full}
      </Streamdown>
    );
    expect(rendered).not.toContain(first);
    expect(rendered.at(-1)).toBe(full);
  });
});
