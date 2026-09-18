import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

function pendingAnimation() {
  let finish: () => void = () => undefined;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return {
    animation: {
      animationName: "sd-fadeIn",
      playState: "running",
      effect: { getComputedTiming: () => ({ endTime: 500 }) },
      finished,
    },
    finish,
  };
}

function message(text: string, streaming: boolean) {
  return (
    <StrictMode>
      <Streamdown animated={{ duration: 250 }} isAnimating={streaming}>
        {text}
      </Streamdown>
    </StrictMode>
  );
}

describe("animation drain", () => {
  it("retains pending words after streaming ends and cleans up after every animation finishes", async () => {
    const first = pendingAnimation();
    const last = pendingAnimation();
    const { container, rerender } = render(message("Alpha beta", true));
    Object.defineProperty(container.firstElementChild, "getAnimations", {
      value: () => [first.animation, last.animation],
    });
    const word = container.querySelector("[data-sd-animate]");
    await act(() => rerender(message("Alpha beta gamma", false)));
    expect(container.querySelector("[data-sd-animate]")).toBe(word);
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(3);

    await act(async () => first.finish());
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(3);
    await act(async () => last.finish());
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(0);
    expect(container.textContent).toBe("Alpha beta gamma");
  });

  it("does not let completion of an earlier drain tear down a resumed stream", async () => {
    const previous = pendingAnimation();
    const current = pendingAnimation();
    let animations = [previous.animation];
    const { container, rerender } = render(message("Alpha", true));
    Object.defineProperty(container.firstElementChild, "getAnimations", {
      value: () => animations,
    });
    await act(() => rerender(message("Alpha", false)));
    await act(() => rerender(message("Alpha beta", true)));
    await act(async () => previous.finish());
    animations = [current.animation];
    await act(() => rerender(message("Alpha beta gamma", false)));
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(3);
    await act(async () => current.finish());
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(0);
  });

  it("resamples animations when the final content changes during a drain", async () => {
    const previous = pendingAnimation();
    const current = pendingAnimation();
    let animations = [previous.animation];
    const { container, rerender } = render(message("Alpha", true));
    Object.defineProperty(container.firstElementChild, "getAnimations", {
      value: () => animations,
    });
    await act(() => rerender(message("Alpha", false)));
    animations = [previous.animation, current.animation];
    await act(() => rerender(message("Alpha beta", false)));
    await act(async () => previous.finish());
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(2);
    await act(async () => current.finish());
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(0);
  });

  it("does not wait for unrelated or infinite animations", async () => {
    const unrelated = pendingAnimation();
    unrelated.animation.animationName = "spinner";
    const infinite = pendingAnimation();
    infinite.animation.effect.getComputedTiming = () => ({
      endTime: Number.POSITIVE_INFINITY,
    });
    const { container, rerender } = render(message("Alpha", true));
    Object.defineProperty(container.firstElementChild, "getAnimations", {
      value: () => [unrelated.animation, infinite.animation],
    });
    await act(() => rerender(message("Alpha", false)));
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(0);
  });
});
