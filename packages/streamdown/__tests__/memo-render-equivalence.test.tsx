/**
 * The default markdown components are memoized. The contract those comparators
 * have to honour is:
 *
 *   a memoized markup component may skip rendering only when every prop capable
 *   of changing its rendered output is equivalent.
 *
 * Comparing source position instead is not equivalent. A replacement of the same
 * length occupies the same lines and columns, so a position-based comparator
 * reports "unchanged" for content that changed and the component keeps rendering
 * the previous text.
 *
 * These tests assert BOTH directions: changed output must commit, and an
 * unchanged block must still skip, so a correctness fix here cannot quietly
 * become "always re-render".
 */

import { render, waitFor } from "@testing-library/react";
import type { Root } from "hast";
import type { ReactNode } from "react";
import { visit } from "unist-util-visit";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

describe("memoized components re-render when their output changes", () => {
  it("updates paragraph text after a same-length edit", async () => {
    const before = "Revenue grew";
    const after = "Booking grew";
    expect(after).toHaveLength(before.length);

    const { container, rerender } = render(<Streamdown>{before}</Streamdown>);
    await waitFor(() => expect(container.textContent).toContain("Revenue"));

    rerender(<Streamdown>{after}</Streamdown>);

    await waitFor(() => {
      expect(container.textContent).toContain("Booking");
    });
    expect(container.textContent).not.toContain("Revenue");
  });

  it("updates heading text after a same-length edit", async () => {
    const before = "# Revenue growth\n\nUnchanged body";
    const after = "# Booking growth\n\nUnchanged body";
    expect(after).toHaveLength(before.length);

    const { container, rerender } = render(<Streamdown>{before}</Streamdown>);
    await waitFor(() =>
      expect(container.querySelector("h1")?.textContent).toBe("Revenue growth")
    );

    rerender(<Streamdown>{after}</Streamdown>);

    await waitFor(() => {
      expect(container.querySelector("h1")?.textContent).toBe("Booking growth");
    });
  });

  it("updates list item and strong text after a same-length edit", async () => {
    const before = "- **Revenue** is up\n- Unchanged";
    const after = "- **Booking** is up\n- Unchanged";
    expect(after).toHaveLength(before.length);

    const { container, rerender } = render(<Streamdown>{before}</Streamdown>);
    await waitFor(() =>
      expect(
        container.querySelector('[data-streamdown="strong"]')?.textContent
      ).toBe("Revenue")
    );

    rerender(<Streamdown>{after}</Streamdown>);

    await waitFor(() => {
      expect(
        container.querySelector('[data-streamdown="strong"]')?.textContent
      ).toBe("Booking");
    });
  });

  it("drops animation spans once the stream settles (issue #570)", async () => {
    // The animate plugin is excluded from the pipeline when isAnimating goes
    // false, so the block re-parses without the per-word spans. The source text
    // is identical, so every element keeps its position — which is why a
    // position-based comparator discards the span-free re-parse and the spans
    // stay in the DOM for the life of the page.
    const animated = {
      animation: "fadeIn",
      duration: 200,
      easing: "ease-out",
      sep: "word",
      stagger: 0,
    } as const;
    const markdown =
      "First paragraph with several words here.\n\nSecond paragraph also has words.";

    const { container, rerender } = render(
      <Streamdown animated={animated} isAnimating>
        {markdown}
      </Streamdown>
    );
    await waitFor(() =>
      expect(
        container.querySelectorAll("[data-sd-animate]").length
      ).toBeGreaterThan(0)
    );

    rerender(
      <Streamdown animated={animated} isAnimating={false}>
        {markdown}
      </Streamdown>
    );

    await waitFor(() => {
      expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(0);
    });
  });

  it("keeps every element describing the version on screen after an insertion above it", async () => {
    // An insertion earlier in the document moves everything below it. The text
    // is unchanged, so nothing below may be re-rendered from the previous pass
    // while carrying attributes derived from the new parse.
    const offsets = () => (tree: Root) => {
      visit(tree, "element", (node) => {
        const start = node.position?.start?.offset;
        if (start !== undefined) {
          node.properties = { ...node.properties, "data-start": String(start) };
        }
      });
    };
    const head = "Intro paragraph";
    const tail = "\n\n## Section\n\n> Quote here";

    const { container, rerender } = render(
      <Streamdown mode="static" rehypePlugins={[offsets]}>
        {head + tail}
      </Streamdown>
    );
    await waitFor(() => expect(container.querySelector("h2")).toBeTruthy());

    const startBefore = Number(
      container.querySelector("h2")?.getAttribute("data-start")
    );

    const inserted = "0123456789"; // ten bytes, no new lines
    rerender(
      <Streamdown mode="static" rehypePlugins={[offsets]}>
        {head + inserted + tail}
      </Streamdown>
    );

    await waitFor(() => {
      const startAfter = Number(
        container.querySelector("h2")?.getAttribute("data-start")
      );
      expect(startAfter).toBe(startBefore + inserted.length);
    });
  });
});

describe("memoized components still skip when their output is unchanged", () => {
  it("does not re-render a code block while a different block streams", async () => {
    let renders = 0;
    vi.doMock("../lib/code-block", () => ({
      CodeBlock: ({
        code,
        children,
      }: {
        code: string;
        children?: ReactNode;
      }) => {
        renders += 1;
        return (
          <div data-testid="mock-code-block">
            <pre>{code}</pre>
            {children}
          </div>
        );
      },
    }));
    vi.resetModules();
    const { Streamdown: Fresh } = await import("../index");

    const code = "```js\nconst a = 1;\n```\n\n";
    const { container, rerender } = render(<Fresh>{`${code}Streaming`}</Fresh>);
    await waitFor(() =>
      expect(container.textContent).toContain("const a = 1;")
    );

    const baseline = renders;
    expect(baseline).toBeGreaterThan(0);

    for (const suffix of [
      " one",
      " one two",
      " one two three",
      " one two three four",
    ]) {
      rerender(<Fresh>{`${code}Streaming${suffix}`}</Fresh>);
      await waitFor(() =>
        expect(container.textContent).toContain(`Streaming${suffix}`)
      );
    }

    expect(renders).toBe(baseline);
    vi.doUnmock("../lib/code-block");
  });
});
