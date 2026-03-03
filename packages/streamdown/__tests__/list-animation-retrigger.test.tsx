/**
 * Tests for fix #410: Ordered list animations incorrectly retrigger
 *
 * Root cause: when streaming content contains multiple ordered/unordered lists,
 * the Marked lexer merges them into a single block. As new items appear the block
 * is re-processed through the rehype pipeline, recreating `data-sd-animate` spans
 * for ALL text — including already-visible content — causing those characters to
 * re-run their CSS entry animation.
 *
 * Fix: two layers of protection:
 * 1. Memo'd list components (MemoLi, MemoUl, etc.) prevent re-rendering when
 *    the node position hasn't changed — existing spans stay in the DOM.
 * 2. When the node position DOES change (e.g., during streaming as text grows),
 *    the animate plugin tracks prevContentLength and sets --sd-duration:0ms for
 *    text-node positions that were already rendered in the previous pass.
 */

import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const animatedConfig = {
  animation: "fadeIn" as const,
  duration: 700,
  easing: "ease-in-out",
  sep: "char" as const,
};

describe("list animation retrigger fix (#410)", () => {
  it("does not remount spans for existing list items when a new item appears", async () => {
    const { rerender, container } = render(
      <Streamdown animated={animatedConfig} isAnimating={true}>
        {"1. Item 1\n2. Item 2\n"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    const initialSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    );
    expect(initialSpans.length).toBeGreaterThan(0);

    // Tag spans so we can track identity across re-renders
    initialSpans.forEach((span, i) => {
      (span as HTMLElement).dataset.origIdx = String(i);
    });

    // Simulate a new list group appearing (triggers tight→loose transition)
    await act(() => {
      rerender(
        <Streamdown animated={animatedConfig} isAnimating={true}>
          {"1. Item 1\n2. Item 2\n\n1. Item A\n"}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    const afterSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    );

    // There should be MORE spans after (new item appeared)
    expect(afterSpans.length).toBeGreaterThan(initialSpans.length);

    // All original spans should still be in the document (not remounted)
    const remountedCount = initialSpans.filter(
      (s) => !container.contains(s)
    ).length;
    expect(remountedCount).toBe(0);
  });

  it("sets --sd-duration:0ms on already-rendered content when item text grows", async () => {
    // When a list item's text grows during streaming, its node position
    // changes (end column extends). This causes the memo'd MemoLi to
    // re-render, and the animate plugin applies 0ms to already-visible chars.
    const { rerender, container } = render(
      <Streamdown animated={animatedConfig} isAnimating={true}>
        {"- AB\n"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    // First render: "AB" → 2 animated chars (A, B), both 700ms
    const firstRenderSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    ) as HTMLElement[];
    expect(firstRenderSpans.length).toBe(2);
    for (const span of firstRenderSpans) {
      const duration = span.style.getPropertyValue("--sd-duration");
      expect(duration).toBe("700ms");
    }

    // Streaming update: item text grows from "AB" to "AB CD"
    // This changes the li node position → MemoLi re-renders
    await act(() => {
      rerender(
        <Streamdown animated={animatedConfig} isAnimating={true}>
          {"- AB CD\n"}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    const afterSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    ) as HTMLElement[];

    // Should have 4 animated chars: A, B (old), C, D (new)
    expect(afterSpans.length).toBe(4);

    // "A" and "B" (chars 0-1) should have duration:0ms — already visible
    for (const span of afterSpans.slice(0, 2)) {
      const duration = span.style.getPropertyValue("--sd-duration");
      expect(duration).toBe("0ms");
    }

    // "C" and "D" (chars 2-3) should have normal duration
    for (const span of afterSpans.slice(2)) {
      const duration = span.style.getPropertyValue("--sd-duration");
      expect(duration).toBe("700ms");
    }
  });

  it("keeps animatePlugin stable when animated is a new inline object with same values", async () => {
    // This tests the value-based useMemo deps fix.
    // When animated is an inline object literal, each parent render creates
    // a new reference. The fix ensures the plugin instance stays stable
    // so that prevContentLength mutations affect the correct processor closure.
    const getAnimated = () => ({
      animation: "fadeIn" as const,
      duration: 700,
      easing: "ease-in-out",
      sep: "char" as const,
    });

    const { rerender, container } = render(
      <Streamdown animated={getAnimated()} isAnimating={true}>
        {"- Alpha\n- Beta\n"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    // Tag initial spans
    const initialSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    );
    initialSpans.forEach((span, i) => {
      (span as HTMLElement).dataset.origIdx = String(i);
    });

    // Re-render with new object reference for animated (same values)
    // and new content — simulates a streaming update from a parent that
    // re-creates the animated object literal on each render
    await act(() => {
      rerender(
        <Streamdown animated={getAnimated()} isAnimating={true}>
          {"- Alpha\n- Beta\n- Gamma\n"}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    const afterSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    );

    // Original spans should still be in the document
    const remountedCount = initialSpans.filter(
      (s) => !container.contains(s)
    ).length;
    expect(remountedCount).toBe(0);

    // New spans for "Gamma" should exist
    expect(afterSpans.length).toBeGreaterThan(initialSpans.length);
  });
});
