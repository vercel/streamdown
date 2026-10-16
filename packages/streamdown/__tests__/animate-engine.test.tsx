import { act, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnimationEngine } from "../lib/plugin-types";

// Every call is one fetch of the engine's chunk in a built app.
const importEngine = vi.hoisted(() => vi.fn<() => Promise<AnimationEngine>>());

vi.mock("../lib/import-animation-engine", () => ({
  importAnimationEngine: importEngine,
}));

const realEngine = async () => (await import("../animate")).animate;

// A fresh Streamdown per test, so the shared engine store starts empty.
const freshStreamdown = async () => (await import("../index")).Streamdown;

const pendingEngine = () => {
  const load = Promise.withResolvers<AnimationEngine>();
  importEngine.mockReturnValueOnce(load.promise);
  return load;
};

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** Words wrapped for the fade, with whether each one is still to fade in. */
const fadedWords = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-sd-animate]")].map(
    (span) => ({
      fading: span.style.getPropertyValue("--sd-duration") !== "0ms",
      text: span.textContent?.trim(),
    })
  );

beforeEach(() => {
  vi.resetModules();
  importEngine.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("word fade engine", () => {
  it("animates from the first render when plugins.animate hands it over", async () => {
    const [Streamdown, animate] = await Promise.all([
      freshStreamdown(),
      realEngine(),
    ]);
    const { container } = render(
      <Streamdown animated isAnimating plugins={{ animate }}>
        one two
      </Streamdown>
    );

    expect(fadedWords(container).map((word) => word.fading)).toEqual([
      true,
      true,
    ]);
    expect(importEngine).not.toHaveBeenCalled();
  });

  it("never loads the engine without the animated prop", async () => {
    const Streamdown = await freshStreamdown();
    const { rerender } = render(<Streamdown isAnimating>one</Streamdown>);
    rerender(<Streamdown isAnimating>one two</Streamdown>);
    await flush();

    expect(importEngine).not.toHaveBeenCalled();
  });

  it("settles the words already on screen when the engine arrives, and fades only later ones", async () => {
    const Streamdown = await freshStreamdown();
    const load = pendingEngine();
    const { container, rerender } = render(
      <Streamdown animated isAnimating>
        one two
      </Streamdown>
    );
    rerender(
      <Streamdown animated isAnimating>
        one two three
      </Streamdown>
    );
    expect(fadedWords(container)).toEqual([]);

    load.resolve(await realEngine());
    await flush();
    expect(fadedWords(container).filter((word) => word.fading)).toEqual([]);

    rerender(
      <Streamdown animated isAnimating>
        one two three four
      </Streamdown>
    );
    expect(fadedWords(container).filter((word) => word.fading)).toEqual([
      { fading: true, text: "four" },
    ]);
  });

  it("starts one load for every instance waiting on it", async () => {
    const Streamdown = await freshStreamdown();
    const load = pendingEngine();
    const first = render(
      <Streamdown animated isAnimating>
        one
      </Streamdown>
    );
    const second = render(
      <Streamdown animated isAnimating>
        two
      </Streamdown>
    );
    await flush();
    expect(importEngine).toHaveBeenCalledTimes(1);

    load.resolve(await realEngine());
    await flush();
    first.rerender(
      <Streamdown animated isAnimating>
        one more
      </Streamdown>
    );
    second.rerender(
      <Streamdown animated isAnimating>
        two more
      </Streamdown>
    );
    expect(fadedWords(first.container).filter((word) => word.fading)).toEqual([
      { fading: true, text: "more" },
    ]);
    expect(fadedWords(second.container).filter((word) => word.fading)).toEqual([
      { fading: true, text: "more" },
    ]);
  });

  it("retries a failed load on a later update once its backoff has passed, and stops after four failures", async () => {
    const Streamdown = await freshStreamdown();
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    importEngine.mockRejectedValue(new Error("chunk failed"));
    const { rerender } = render(
      <Streamdown animated isAnimating>
        one
      </Streamdown>
    );
    await flush();
    expect(importEngine).toHaveBeenCalledTimes(1);

    // Within the 1 s backoff an update does not retry.
    now.mockReturnValue(10_500);
    rerender(
      <Streamdown animated isAnimating>
        one two
      </Streamdown>
    );
    await flush();
    expect(importEngine).toHaveBeenCalledTimes(1);

    // Backoffs of 1, 2 and 4 s, each retried by the next update after it.
    for (const [at, attempts] of [
      [11_000, 2],
      [13_000, 3],
      [17_000, 4],
      [60_000, 4],
    ] as const) {
      now.mockReturnValue(at);
      rerender(
        <Streamdown animated isAnimating>
          {`one two ${at}`}
        </Streamdown>
      );
      await flush();
      expect(importEngine).toHaveBeenCalledTimes(attempts);
    }
  });

  it("recovers on a later update after a failed load", async () => {
    const Streamdown = await freshStreamdown();
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    importEngine
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce(await realEngine());
    const { container, rerender } = render(
      <Streamdown animated isAnimating>
        one
      </Streamdown>
    );
    await flush();

    now.mockReturnValue(11_000);
    rerender(
      <Streamdown animated isAnimating>
        one two
      </Streamdown>
    );
    await flush();
    rerender(
      <Streamdown animated isAnimating>
        one two three
      </Streamdown>
    );

    expect(importEngine).toHaveBeenCalledTimes(2);
    expect(fadedWords(container).filter((word) => word.fading)).toEqual([
      { fading: true, text: "three" },
    ]);
  });

  // An engine whose block plugins fade every word for `duration` ms.
  const engineFading = async (duration: number): Promise<AnimationEngine> => {
    const animate = await realEngine();
    return {
      createBlockPlugin: (options) =>
        animate.createBlockPlugin({ ...options, duration }),
      createTimeline: animate.createTimeline,
    };
  };

  it("replaces the block plugins when plugins.animate switches engine, and keeps the words already shown", async () => {
    const [Streamdown, slow, fast] = await Promise.all([
      freshStreamdown(),
      engineFading(111),
      engineFading(999),
    ]);
    const { container, rerender } = render(
      <Streamdown animated isAnimating plugins={{ animate: slow }}>
        one
      </Streamdown>
    );
    expect(fadedWords(container)).toEqual([{ fading: true, text: "one" }]);

    rerender(
      <Streamdown animated isAnimating plugins={{ animate: fast }}>
        one two
      </Streamdown>
    );
    const durations = [
      ...container.querySelectorAll<HTMLElement>("[data-sd-animate]"),
    ].map((span) => span.style.getPropertyValue("--sd-duration"));
    expect(durations).toEqual(["0ms", "999ms"]);
  });

  it("keeps the block plugins for an engine re-created around the same functions", async () => {
    const [Streamdown, slow] = await Promise.all([
      freshStreamdown(),
      engineFading(111),
    ]);
    const createTimeline = vi.fn(slow.createTimeline);
    const engine = { ...slow, createTimeline };
    const { container, rerender } = render(
      <Streamdown animated isAnimating plugins={{ animate: { ...engine } }}>
        one
      </Streamdown>
    );
    rerender(
      <Streamdown animated isAnimating plugins={{ animate: { ...engine } }}>
        one two
      </Streamdown>
    );

    expect(createTimeline).toHaveBeenCalledTimes(1);
    expect(
      [...container.querySelectorAll<HTMLElement>("[data-sd-animate]")].map(
        (span) => span.style.getPropertyValue("--sd-duration")
      )
    ).toEqual(["0ms", "111ms"]);
  });

  it("rebuilds for an engine with new functions on every render, and keeps the words already shown", async () => {
    const Streamdown = await freshStreamdown();
    const { container, rerender } = render(
      <Streamdown
        animated
        isAnimating
        plugins={{ animate: await engineFading(111) }}
      >
        one
      </Streamdown>
    );
    rerender(
      <Streamdown
        animated
        isAnimating
        plugins={{ animate: await engineFading(111) }}
      >
        one two
      </Streamdown>
    );

    expect(
      [...container.querySelectorAll<HTMLElement>("[data-sd-animate]")].map(
        (span) => span.style.getPropertyValue("--sd-duration")
      )
    ).toEqual(["0ms", "111ms"]);
  });

  describe("hydration", () => {
    const hydrate = async (warmClient: boolean) => {
      const Streamdown = await freshStreamdown();
      const markdown = "one two";
      const html = renderToString(
        <Streamdown animated isAnimating>
          {markdown}
        </Streamdown>
      );
      const load = pendingEngine();
      if (warmClient) {
        // Another instance on the page has already loaded the engine.
        render(
          <Streamdown animated isAnimating>
            elsewhere
          </Streamdown>
        );
        load.resolve(await realEngine());
        await flush();
      }

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.append(container);
      const recoverableErrors: unknown[] = [];
      await act(() => {
        hydrateRoot(
          container,
          <Streamdown animated isAnimating>
            {markdown}
          </Streamdown>,
          { onRecoverableError: (error) => recoverableErrors.push(error) }
        );
      });
      if (!warmClient) {
        load.resolve(await realEngine());
      }
      await flush();
      return { container, recoverableErrors };
    };

    it("hydrates a cold server render on a cold client, then settles the words it showed", async () => {
      const { container, recoverableErrors } = await hydrate(false);

      expect(recoverableErrors).toEqual([]);
      expect(fadedWords(container).filter((word) => word.fading)).toEqual([]);
    });

    it("hydrates a cold server render on a client that already has the engine", async () => {
      const { container, recoverableErrors } = await hydrate(true);

      expect(recoverableErrors).toEqual([]);
      expect(fadedWords(container).filter((word) => word.fading)).toEqual([]);
    });
  });
});
