/**
 * Integration coverage for the active animation-related issues:
 *   #482  concurrent sibling-block stagger
 *   #535  underline leaks through word gaps under links
 *   #550  un-animated streaming starved by useTransition
 *   #570  animate spans stick around after isAnimating→false
 *         + StrictMode-unsafe prevContentLength (secondary)
 */
import { act, render } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { MAX_ANIMATION_BACKLOG_MS } from "../lib/animate";

const parseDelay = (el: Element): number => {
  const raw = (el as HTMLElement).style.getPropertyValue("--sd-delay").trim();
  if (!raw) {
    return 0;
  }
  return Number.parseInt(raw, 10) || 0;
};

describe("issue #482 — cross-block stagger serialization", () => {
  it("delays a new block's first word past the previous block's cascade", async () => {
    const config = {
      animation: "fadeIn" as const,
      duration: 150,
      stagger: 50,
    };

    const { rerender, container } = render(
      <Streamdown animated={config} isAnimating={true} mode="streaming">
        {"Hello world foo bar baz\n\n"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    const firstPass = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    ) as HTMLElement[];
    expect(firstPass.length).toBeGreaterThanOrEqual(5);
    expect(Math.max(...firstPass.map(parseDelay))).toBeGreaterThan(0);

    await act(() => {
      rerender(
        <Streamdown animated={config} isAnimating={true} mode="streaming">
          {"Hello world foo bar baz\n\nNext section arrives\n"}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    const newWords = (
      Array.from(
        container.querySelectorAll("[data-sd-animate]")
      ) as HTMLElement[]
    ).filter((el) =>
      /^(Next|section|arrives)$/.test(el.textContent?.trim() ?? "")
    );
    expect(newWords.length).toBe(3);

    const newDelays = newWords.map(parseDelay);
    const newMin = Math.min(...newDelays);
    // Must not all start at 0 while the previous cascade still has residual time.
    expect(newMin).toBeGreaterThan(0);
    expect(Math.max(...newDelays)).toBeGreaterThan(newMin);
  });

  // A four-item shortlist is ~25 words. Compression fits the cascade into the
  // backlog budget while keeping the next block ordered after the list.
  it("compresses a realistic list and keeps the heading ordered after it", async () => {
    const config = { animation: "fadeIn" as const, duration: 150, stagger: 40 };
    const list = [
      "- Latency under 200ms p95 in us-east-1",
      "- Pricing that stays linear past 10M requests",
      "- SOC 2 Type II completed within 12 months",
      "- Support with a named Slack channel",
      "",
    ].join("\n");

    const { container, rerender } = render(
      <Streamdown animated={config} isAnimating={true} mode="streaming">
        {list}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    const listDelays = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    ).map(parseDelay);
    expect(listDelays.length).toBeGreaterThan(20);
    const listEndsAt = Math.max(...listDelays);
    // Compressed into the budget (uncapped would be ~1s). Allow +1 for rounding.
    expect(listEndsAt).toBeLessThanOrEqual(MAX_ANIMATION_BACKLOG_MS + 1);

    await act(() => {
      rerender(
        <Streamdown animated={config} isAnimating={true} mode="streaming">
          {`${list}\n## Recommendation\n`}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    const headingDelays = Array.from(
      container.querySelectorAll("h2 [data-sd-animate]")
    ).map(parseDelay);
    expect(headingDelays.length).toBeGreaterThan(0);

    // Heading waits for the list — not the #482 delay-0 bug.
    // Delays are relative to each render's `now`, so a few ms of wall-clock
    // drift between act() frames is fine; absolute order is still preserved.
    expect(Math.min(...headingDelays)).toBeGreaterThan(0);
    expect(Math.min(...headingDelays)).toBeGreaterThanOrEqual(
      listEndsAt - 50
    );
  });
});

describe("issue #535 — underline doesn't paint ahead of link words", () => {
  it("glues trailing whitespace into the preceding animate span under an anchor", async () => {
    // Use a full URL form so rehype-harden keeps the link (protocol-relative
    // hosts are fine). Empty + act so streaming displayBlocks flushes.
    const md =
      "See [a link here](https://example.com/path) and more words after.";
    const { container } = render(
      <Streamdown
        animated={{ animation: "fadeIn", duration: 200, stagger: 50 }}
        isAnimating={true}
        mode="streaming"
      >
        {md}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    const anchor =
      container.querySelector('[data-streamdown="link"]') ??
      container.querySelector("a");
    expect(anchor).toBeTruthy();

    const spans = Array.from(
      anchor?.querySelectorAll("[data-sd-animate]") ?? []
    ) as HTMLElement[];
    expect(spans.length).toBeGreaterThanOrEqual(2);

    // No bare text-node space between animate spans inside the link —
    // that bare space is what paints underline before the word fades in.
    const html = anchor?.innerHTML ?? "";
    expect(html).not.toMatch(/<\/span> <span/);
  });
});

describe("issue #550 — un-animated streaming is never starved", () => {
  it("commits every block update urgently (no useTransition gate)", async () => {
    const { rerender, container } = render(
      <Streamdown mode="streaming">{"one"}</Streamdown>
    );
    await act(() => Promise.resolve());
    expect(container.textContent).toContain("one");

    await act(() => {
      rerender(
        <Streamdown mode="streaming">{"one two three four"}</Streamdown>
      );
    });
    await act(() => Promise.resolve());

    // Without animated, blocks used to sit behind startTransition and could
    // freeze. They must now show the full text immediately.
    expect(container.textContent).toContain("one two three four");
  });
});

describe("issue #570 — spans come off when isAnimating goes false", () => {
  it("removes data-sd-animate spans after the stream settles", async () => {
    const FADE = {
      animation: "fadeIn" as const,
      duration: 200,
      easing: "ease-out",
      sep: "word" as const,
      stagger: 0,
    };
    const MD =
      "First paragraph with several words here.\n\nSecond paragraph also has words.\n\nThird paragraph ends it.";

    const { container, rerender } = render(
      <Streamdown animated={FADE} isAnimating={true} mode="streaming">
        {MD}
      </Streamdown>
    );
    await act(() => Promise.resolve());
    expect(
      container.querySelectorAll("[data-sd-animate]").length
    ).toBeGreaterThan(0);

    await act(() => {
      rerender(
        <Streamdown animated={FADE} isAnimating={false} mode="streaming">
          {MD}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    expect(container.querySelectorAll("[data-sd-animate]").length).toBe(0);
  });

  it("does not remount block-level hosts when isAnimating flips off", async () => {
    let mounts = 0;
    // Stable identity — new inline components each render would remount anyway.
    const CountingP = Object.assign(
      (props: React.ComponentProps<"p">) => {
        useEffect(() => {
          mounts += 1;
        }, []);
        return <p data-counting-p="" {...props} />;
      },
      { displayName: "CountingP" }
    );

    const FADE = { animation: "fadeIn" as const, duration: 100, stagger: 0 };
    const MD = "Hello world from a paragraph.";
    const components = { p: CountingP };

    const { container, rerender } = render(
      <Streamdown
        animated={FADE}
        components={components}
        isAnimating={true}
        mode="streaming"
      >
        {MD}
      </Streamdown>
    );
    await act(() => Promise.resolve());
    const el = container.querySelector("[data-counting-p]");
    expect(el).toBeTruthy();
    const mountsWhileAnimating = mounts;
    expect(mountsWhileAnimating).toBe(1);

    await act(() => {
      rerender(
        <Streamdown
          animated={FADE}
          components={components}
          isAnimating={false}
          mode="streaming"
        >
          {MD}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    // Same DOM node must survive the settle (no Markdown key remount).
    expect(container.querySelector("[data-counting-p]")).toBe(el);
    expect(mounts).toBe(1);
  });

  it("suppresses already-seen words under StrictMode double-invoke", async () => {
    const config = {
      animation: "fadeIn" as const,
      duration: 200,
      sep: "word" as const,
      stagger: 0,
    };

    const { rerender, container } = render(
      <StrictMode>
        <Streamdown animated={config} isAnimating={true} mode="streaming">
          {"one two three"}
        </Streamdown>
      </StrictMode>
    );
    // Flush displayBlocks + layout effects (commit char count).
    await act(() => Promise.resolve());
    await act(() => Promise.resolve());

    await act(() => {
      rerender(
        <StrictMode>
          <Streamdown animated={config} isAnimating={true} mode="streaming">
            {"one two three four five"}
          </Streamdown>
        </StrictMode>
      );
    });
    await act(() => Promise.resolve());
    await act(() => Promise.resolve());

    const spans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    ) as HTMLElement[];

    // "one"/"two"/"three" should have duration 0 (already seen); "four"/"five"
    // keep the configured duration. Under the old get-and-reset path, StrictMode
    // would wipe prevContentLength and every span would be 200ms.
    const durations = spans.map((el) =>
      el.style.getPropertyValue("--sd-duration").trim()
    );
    const zeroCount = durations.filter((d) => d === "0ms").length;
    const liveCount = durations.filter((d) => d === "200ms").length;
    expect(zeroCount).toBeGreaterThanOrEqual(3);
    expect(liveCount).toBeGreaterThanOrEqual(2);
  });
});
