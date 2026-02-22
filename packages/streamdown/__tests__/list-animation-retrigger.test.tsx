/**
 * Tests for fix #410: Ordered list animations incorrectly retrigger
 *
 * Root cause: when streaming content contains multiple ordered/unordered lists,
 * the Marked lexer merges them into a single block. As new items appear the block
 * is re-processed through the rehype pipeline, recreating `data-sd-animate` spans
 * for ALL text — including already-visible content — causing those characters to
 * re-run their CSS entry animation.
 *
 * Fix: track prevContentLength per Block and set --sd-duration:0ms for text-node
 * positions that were already rendered in the previous pass.
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

  it("sets --sd-duration:0ms on already-rendered content to prevent visual re-animation", async () => {
    const { rerender, container } = render(
      <Streamdown animated={animatedConfig} isAnimating={true}>
        {"- Item 1\n- Item 2\n"}
      </Streamdown>
    );
    await act(() => Promise.resolve());

    // First render: all spans should have normal duration (700ms)
    const firstRenderSpans = Array.from(
      container.querySelectorAll("[data-sd-animate]")
    ) as HTMLElement[];
    expect(firstRenderSpans.length).toBeGreaterThan(0);

    // After initial render all existing spans have full duration
    for (const span of firstRenderSpans) {
      const style = span.getAttribute("style") ?? "";
      expect(style).toContain("--sd-duration: 700ms");
    }

    // Force a re-render (simulates streaming update — e.g., a new item appears)
    await act(() => {
      rerender(
        <Streamdown animated={animatedConfig} isAnimating={true}>
          {"- Item 1\n- Item 2\n\n- Item 3\n"}
        </Streamdown>
      );
    });
    await act(() => Promise.resolve());

    // Spans for Item 1 and Item 2 (already rendered) should have duration:0ms
    // to suppress any visual re-animation
    const item1Spans = Array.from(
      container.querySelectorAll("li:first-child [data-sd-animate]")
    ) as HTMLElement[];
    expect(item1Spans.length).toBeGreaterThan(0);
    for (const span of item1Spans) {
      const style = span.getAttribute("style") ?? "";
      expect(style).toContain("--sd-duration: 0ms");
    }

    // Spans for Item 3 (newly streamed) should have normal duration
    const item3Spans = Array.from(
      container.querySelectorAll("li:last-child [data-sd-animate]")
    ) as HTMLElement[];
    expect(item3Spans.length).toBeGreaterThan(0);
    for (const span of item3Spans) {
      const style = span.getAttribute("style") ?? "";
      expect(style).toContain("--sd-duration: 700ms");
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
