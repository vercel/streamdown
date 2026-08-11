import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const FADE = {
  animation: "fadeIn",
  duration: 200,
  easing: "ease-out",
  sep: "word",
  stagger: 0,
} as const;

const MD =
  "First paragraph with several words here.\n\nSecond paragraph also has words.\n\nThird paragraph ends it.";

describe("Animate integration", () => {
  it("should remove animation spans when isAnimating goes false", () => {
    const { container, rerender } = render(
      <Streamdown animated={FADE} isAnimating>
        {MD}
      </Streamdown>
    );
    expect(
      container.querySelectorAll("[data-sd-animate]").length
    ).toBeGreaterThan(0);

    // Stream ends: same children, animation off.
    rerender(
      <Streamdown animated={FADE} isAnimating={false}>
        {MD}
      </Streamdown>
    );
    expect(
      container.querySelectorAll("[data-sd-animate]").length
    ).toBe(0);
  });
});
