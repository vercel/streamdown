import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";
import {
  type AnimatePlugin,
  type AnimationEffect,
  createAnimatePlugin,
} from "../lib/animate";

const DELAY_RE = /--sd-delay:(\d+)ms/g;
const DURATION_RE = /--sd-duration:(\d+)ms/;
const MARK_RE = /data-mark="([^"]*)"/g;

const prose =
  "<p>The quick brown fox jumps over the lazy dog near the quiet river.</p>";

const run = async (plugin: AnimatePlugin, html = prose) =>
  String(
    await unified()
      .use(rehypeParse, { fragment: true })
      .use(plugin.rehypePlugin)
      .use(rehypeStringify)
      .process(html)
  );

const delaysOf = (html: string) =>
  Array.from(html.matchAll(DELAY_RE), (m) => Number.parseInt(m[1], 10));

const isSorted = (values: number[]) =>
  values.every((value, i) => i === 0 || value >= values[i - 1]);

describe("animation effects", () => {
  it("uses the effect's keyframes and default duration", async () => {
    const effect: AnimationEffect = { name: "shimmer", duration: 400 };
    const html = await run(createAnimatePlugin({ animation: effect }));
    expect(html).toContain("--sd-animation:sd-shimmer");
    expect(html.match(DURATION_RE)?.[1]).toBe("400");
  });

  it("lets animated.duration override the effect's default", async () => {
    const html = await run(
      createAnimatePlugin({
        animation: { name: "shimmer", duration: 400 },
        duration: 120,
      })
    );
    expect(html.match(DURATION_RE)?.[1]).toBe("120");
  });

  it("scatters delays when the effect asks for it", async () => {
    const scattered = await run(
      createAnimatePlugin({ animation: { name: "shimmer", scatter: 150 } })
    );
    const ordered = await run(createAnimatePlugin({ animation: "fadeIn" }));
    expect(isSorted(delaysOf(scattered))).toBe(false);
    expect(isSorted(delaysOf(ordered))).toBe(true);
  });

  it("gives each word the same timing and attributes on every run", async () => {
    const plugin = createAnimatePlugin({
      animation: {
        decorate: (text, seed) => ({ "data-mark": `${text}:${seed}` }),
        name: "shimmer",
        scatter: 150,
      },
    });
    expect(await run(plugin)).toBe(await run(plugin));
  });

  it("decorates animating words with the trimmed word and a stable seed", async () => {
    const decorate = vi.fn((text: string) => ({ "data-mark": text }));
    const html = await run(
      createAnimatePlugin({ animation: { decorate, name: "shimmer" } })
    );
    const marks = Array.from(html.matchAll(MARK_RE), (m) => m[1]);
    expect(marks[0]).toBe("The");
    expect(marks).toHaveLength(13);
    const seeds = decorate.mock.calls.map(([, seed]) => seed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("only passes data attributes through", async () => {
    const html = await run(
      createAnimatePlugin({
        animation: {
          // Simulate an effect returning something it shouldn't.
          decorate: () =>
            ({ "data-ok": "yes", onclick: "x" }) as Record<
              `data-${string}`,
              string
            >,
          name: "shimmer",
        },
      })
    );
    expect(html).toContain('data-ok="yes"');
    expect(html).not.toContain("onclick");
  });

  it("stops decorating words whose animation has finished", async () => {
    const decorate = vi.fn(() => ({ "data-mark": "x" }));
    const plugin = createAnimatePlugin({
      animation: { decorate, name: "shimmer" },
    });
    plugin.setPrevContentLength(prose.length);
    const html = await run(plugin);
    expect(decorate).not.toHaveBeenCalled();
    expect(html).not.toContain("data-mark");
  });
});
