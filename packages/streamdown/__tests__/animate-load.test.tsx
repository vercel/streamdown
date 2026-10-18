import { act, render } from "@testing-library/react";
import type { Element, ElementContent, Root } from "hast";
import { Suspense, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { unified } from "unified";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StreamdownProps } from "../index";
import { createShownTextPlugin } from "../lib/shown-text";

type AnimateModule = typeof import("../lib/animate");

// Every call is one fetch of the fade's chunk in a built app.
const importAnimate = vi.hoisted(() => vi.fn<() => Promise<AnimateModule>>());

vi.mock("../lib/import-animate", () => ({ importAnimate }));

const realAnimate = () => import("../lib/animate");

// A fresh Streamdown per test, so the loaded fade is not shared between tests.
const freshStreamdown = async () => (await import("../index")).Streamdown;

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** Words still to fade in; a settled word keeps its span at 0 ms. */
const fadingWords = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-sd-animate]")]
    .filter((span) => span.style.getPropertyValue("--sd-duration") !== "0ms")
    .map((span) => span.textContent?.trim());

beforeEach(() => {
  vi.resetModules();
  importAnimate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loading the word fade", () => {
  it("never loads it without the animated prop", async () => {
    const Streamdown = await freshStreamdown();
    render(<Streamdown isAnimating>one</Streamdown>);
    await flush();

    expect(importAnimate).not.toHaveBeenCalled();
  });

  it("starts a block's later fade fresh once the first one took over", async () => {
    const Streamdown = await freshStreamdown();
    importAnimate.mockReturnValueOnce(realAnimate());
    const { container, rerender } = render(
      <Streamdown animated isAnimating>
        one
      </Streamdown>
    );
    await flush();
    rerender(
      <Streamdown animated={{ duration: 300 }} isAnimating>
        fresh
      </Streamdown>
    );

    expect(fadingWords(container)).toEqual(["fresh"]);
  });

  it("fades from the first render once it has loaded", async () => {
    const Streamdown = await freshStreamdown();
    importAnimate.mockReturnValueOnce(realAnimate());
    render(
      <Streamdown animated isAnimating>
        elsewhere
      </Streamdown>
    );
    await flush();

    const { container } = render(
      <Streamdown animated isAnimating>
        one two
      </Streamdown>
    );
    expect(fadingWords(container)).toEqual(["one", "two"]);
    expect(importAnimate).toHaveBeenCalledTimes(1);
  });

  it("renders without the fade and reports once when it fails to load", async () => {
    const Streamdown = await freshStreamdown();
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    importAnimate.mockRejectedValueOnce(new Error("chunk failed"));
    const { container } = render(
      <Streamdown animated isAnimating>
        one
      </Streamdown>
    );
    await flush();

    expect(container.querySelector("[data-sd-animate]")).toBeNull();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("hydrates on a client that already has it, then settles what it showed", async () => {
    const Streamdown = await freshStreamdown();
    const view = (text: string) => (
      <Streamdown animated isAnimating>
        {text}
      </Streamdown>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(view("one two"));
    document.body.append(container);
    importAnimate.mockReturnValueOnce(realAnimate());
    render(view("elsewhere"));
    await flush();

    const onRecoverableError = vi.fn();
    const root = await act(() =>
      hydrateRoot(container, view("one two"), { onRecoverableError })
    );
    await flush();
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.querySelectorAll("[data-sd-animate]")).toHaveLength(2);
    expect(fadingWords(container)).toEqual([]);

    act(() => root.render(view("one two three")));
    expect(fadingWords(container)).toEqual(["three"]);
    act(() => root.unmount());
  });

  // The fade starts each block from what its last commit showed.
  describe("a render React discards", () => {
    const pending = new Promise<never>(() => undefined);
    const Suspender = (): never => {
      throw pending;
    };
    const mountDiscardable = async () => {
      const Streamdown = await freshStreamdown();
      const load = Promise.withResolvers<AnimateModule>();
      importAnimate.mockReturnValueOnce(load.promise);
      const container = document.createElement("div");
      const root = createRoot(container);
      const view = (
        text: string,
        props: Pick<StreamdownProps, "animated" | "isAnimating">,
        suspend = false
      ) => (
        <Suspense fallback={null}>
          <Streamdown {...props}>{text}</Streamdown>
          {suspend ? <Suspender /> : null}
        </Suspense>
      );
      return {
        arrive: async () => {
          load.resolve(await realAnimate());
          await flush();
        },
        container,
        discard: (
          text: string,
          props: Pick<StreamdownProps, "animated" | "isAnimating">
        ) =>
          act(() =>
            startTransition(() => root.render(view(text, props, true)))
          ),
        root,
        show: (
          text: string,
          props: Pick<StreamdownProps, "animated" | "isAnimating">
        ) => act(() => root.render(view(text, props))),
      };
    };
    const live = { animated: true, isAnimating: true };

    // The fade starts each block from what its last commit showed.
    it("fades a block that only a discarded render drew while it loaded", async () => {
      const view = await mountDiscardable();
      view.show("one", live);
      view.discard("one\n\nnot shown", live);
      await view.arrive();
      view.show("one\n\nfresh words", live);

      expect(fadingWords(view.container)).toEqual(["fresh", "words"]);
      act(() => view.root.unmount());
    });

    it("keeps the count when the render that hands it to the fade is discarded", async () => {
      const view = await mountDiscardable();
      view.show("one", live);
      view.show("one", { animated: true, isAnimating: false });
      await view.arrive();
      view.discard("one two", live);
      view.show("one two", { animated: { duration: 300 }, isAnimating: true });

      expect(fadingWords(view.container)).toEqual(["two"]);
      act(() => view.root.unmount());
    });
  });

  it("counts what a block shows while it loads the way the fade does", async () => {
    const text = (value: string): ElementContent => ({ type: "text", value });
    const element = (
      tagName: string,
      children: ElementContent[] = []
    ): Element => ({
      type: "element",
      tagName,
      properties: {},
      children,
    });
    const tree = (): Root => ({
      type: "root",
      children: [
        element("p", [
          text("Hi "),
          element("code", [text("x")]),
          text(" 你好"),
        ]),
        element("pre", [element("code", [text("const x = 1")])]),
        element("p", [element("img"), text(" after")]),
        element("math", [element("annotation", [text("x^2")])]),
      ],
    });
    const fade = (await realAnimate()).createRenderAnimatePlugin();
    const shown = createShownTextPlugin();
    unified().use([fade.rehypePlugin]).runSync(tree());
    unified().use([shown.rehypePlugin]).runSync(tree());

    expect(shown.getLastRenderCharCount()).toBe(fade.getLastRenderCharCount());
  });
});
