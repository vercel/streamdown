import { existsSync } from "node:fs";
import path from "node:path";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type * as StreamdownEntry from "../index";

// Runs the built package. Its main entry and `streamdown/animate` are built
// separately, so each carries its own copy of the animate module, and the
// main entry's `createAnimatePlugin` must not be confused with the engine the
// `animated` prop loads. Needs `pnpm build` first.
const distEntry = path.resolve(import.meta.dirname, "../dist/index.js");

const animatedWords = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-sd-animate]")].map(
    (span) => ({
      duration: span.style.getPropertyValue("--sd-duration"),
      text: span.textContent?.trim(),
    })
  );

describe("built entries", () => {
  it("keeps the main entry's createAnimatePlugin apart from the engine the animated prop loads", async () => {
    if (!existsSync(distEntry)) {
      throw new Error("Build the package before running this test: pnpm build");
    }
    const { createAnimatePlugin, defaultRehypePlugins, Streamdown } =
      (await import(/* @vite-ignore */ distEntry)) as typeof StreamdownEntry;
    const legacy = createAnimatePlugin({ duration: 111 });
    const legacyPlugins = [
      ...Object.values(defaultRehypePlugins),
      legacy.rehypePlugin,
    ];

    const legacyRoot = render(
      <Streamdown rehypePlugins={legacyPlugins}>legacy words</Streamdown>
    );
    const engineRoot = render(
      <Streamdown animated={{ duration: 999 }} isAnimating>
        one
      </Streamdown>
    );

    // The word on screen before the engine arrived is settled, not faded in.
    await waitFor(() =>
      expect(animatedWords(engineRoot.container)).toEqual([
        { duration: "0ms", text: "one" },
      ])
    );

    engineRoot.rerender(
      <Streamdown animated={{ duration: 999 }} isAnimating>
        one two
      </Streamdown>
    );
    expect(animatedWords(engineRoot.container)).toEqual([
      { duration: "0ms", text: "one" },
      { duration: "999ms", text: "two" },
    ]);

    legacyRoot.rerender(
      <Streamdown rehypePlugins={legacyPlugins}>legacy words again</Streamdown>
    );
    expect(
      animatedWords(legacyRoot.container).map((word) => word.duration)
    ).toEqual(["111ms", "111ms", "111ms"]);
  });
});
