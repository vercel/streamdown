import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import {
  animate,
  createAnimatePlugin,
  createAnimateTimeline,
  MAX_ANIMATION_BACKLOG_MS,
} from "../lib/animate";

const SPAN_GAP_RE = /<\/span>\s+<span/;
const SPAN_GAP_STRICT_RE = /<\/span> <span/;
const SPAN_GAP_CHAR_RE = /<\/span> <span[^>]*>t</;
const HELLO_SPAN_RE = />Hello <\/span>/;
const WORLD_SPAN_RE = />world<\/span>/;
const I_SPACE_SPAN_RE = />i <\/span>/;
const INLINE_CODE_ANIMATE_RE =
  /<code[^>]*>[\s\S]*data-sd-animate[\s\S]*world[\s\S]*<\/code>/;
const FENCED_PRE_BARE_RE = /<pre><code>block<\/code><\/pre>/;
const PRE_ANIMATE_RE = /<pre>[\s\S]*data-sd-animate/;

const INPUT_TAG_RE = /<input[^>]*>/;
const INPUT_TAG_GLOBAL_RE = /<input[^>]*>/g;
const IMG_TAG_RE = /<img[^>]*>/;
const HR_TAG_RE = /<hr[^>]*>/;
const DELAY_RE = /--sd-delay:(\d+)ms/g;

const delaysOf = (html: string): number[] =>
  Array.from(html.matchAll(DELAY_RE), (match) => Number.parseInt(match[1], 10));

const processHtml = async (html: string, plugin = animate) => {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(plugin.rehypePlugin)
    .use(rehypeStringify);

  const result = await processor.process(html);
  return String(result);
};

describe("animate plugin", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(animate.name).toBe("animate");
      expect(animate.type).toBe("animate");
    });

    it("should have a rehypePlugin", () => {
      expect(animate.rehypePlugin).toBeDefined();
      expect(typeof animate.rehypePlugin).toBe("function");
    });
  });

  describe("createAnimatePlugin", () => {
    it("should create plugin with default options", () => {
      const plugin = createAnimatePlugin();
      expect(plugin.name).toBe("animate");
      expect(plugin.type).toBe("animate");
    });

    it("should create independent instances", () => {
      const plugin1 = createAnimatePlugin();
      const plugin2 = createAnimatePlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.rehypePlugin).not.toBe(plugin2.rehypePlugin);
    });

    it("should accept custom options", () => {
      const plugin = createAnimatePlugin({
        animation: "blurIn",
        duration: 300,
        easing: "ease-out",
        sep: "char",
      });
      expect(plugin.name).toBe("animate");
    });
  });

  describe("word splitting", () => {
    it("should wrap each word in a span", async () => {
      const result = await processHtml("<p>Hello world foo</p>");
      expect(result).toContain("data-sd-animate");
      // Trailing whitespace is glued into the word span (#535).
      expect(result).toContain(">Hello <");
      expect(result).toContain(">world <");
      expect(result).toContain(">foo<");
    });

    it("should glue trailing whitespace into the preceding word span", async () => {
      const result = await processHtml("<p>Hello world</p>");
      // No bare whitespace between animate spans — space lives inside "Hello "
      expect(result).not.toMatch(SPAN_GAP_RE);
      expect(result).toContain(">Hello <");
    });

    it("should handle single word", async () => {
      const result = await processHtml("<p>Hello</p>");
      expect(result).toContain("data-sd-animate");
      expect(result).toContain(">Hello<");
    });

    it("should not wrap whitespace-only text", async () => {
      const result = await processHtml("<p>   </p>");
      expect(result).not.toContain("data-sd-animate");
    });
  });

  describe("char splitting", () => {
    it("should wrap each character in a span", async () => {
      const plugin = createAnimatePlugin({ sep: "char" });
      const result = await processHtml("<p>Hi there</p>", plugin);
      expect(result).toContain(">H<");
      // Space after "i" is glued onto that char span (#535).
      expect(result).toContain(">i <");
      expect(result).toContain(">t<");
    });
  });

  describe("skip tags", () => {
    // Inline <code> is layout-neutral to word-span wrapping (#594).
    it("should animate text inside inline code elements", async () => {
      const result = await processHtml("<code>const x = 1</code>");
      expect(result).toContain("data-sd-animate");
      expect(result).toContain("const ");
      expect(result).toContain("x ");
      expect(result).toContain("= ");
      expect(result).toContain(">1<");
    });

    it("should not animate text inside pre elements", async () => {
      const result = await processHtml("<pre>some code</pre>");
      expect(result).not.toContain("data-sd-animate");
    });

    it("should not animate text inside pre > code (fenced blocks)", async () => {
      const result = await processHtml("<pre><code>const x = 1</code></pre>");
      expect(result).not.toContain("data-sd-animate");
      expect(result).toContain("const x = 1");
    });

    it("should not animate text inside svg elements", async () => {
      const result = await processHtml("<svg><text>label</text></svg>");
      expect(result).not.toContain("data-sd-animate");
    });

    it("should animate prose and inline code, but not fenced pre", async () => {
      const result = await processHtml(
        "<p>Hello <code>world</code> foo</p><pre><code>block</code></pre>"
      );
      expect(result).toContain("data-sd-animate");
      // Inline code is animated — its text sits inside animate spans.
      expect(result).toMatch(INLINE_CODE_ANIMATE_RE);
      // Fenced block stays a bare text child (no animate spans under pre).
      expect(result).toMatch(FENCED_PRE_BARE_RE);
      expect(result).not.toMatch(PRE_ANIMATE_RE);
    });
  });

  describe("custom options", () => {
    it("should apply custom animation name", async () => {
      const plugin = createAnimatePlugin({ animation: "blurIn" });
      const result = await processHtml("<p>Hello</p>", plugin);
      expect(result).toContain("sd-blurIn");
    });

    it("should apply custom duration", async () => {
      const plugin = createAnimatePlugin({ duration: 300 });
      const result = await processHtml("<p>Hello</p>", plugin);
      expect(result).toContain("300ms");
    });

    it("should apply custom easing", async () => {
      const plugin = createAnimatePlugin({ easing: "ease-out" });
      const result = await processHtml("<p>Hello</p>", plugin);
      expect(result).toContain("ease-out");
    });

    it("should apply custom animation string", async () => {
      const plugin = createAnimatePlugin({ animation: "myCustomAnim" });
      const result = await processHtml("<p>Hello</p>", plugin);
      expect(result).toContain("sd-myCustomAnim");
    });
  });

  describe("nested elements", () => {
    it("should animate text in nested elements", async () => {
      const result = await processHtml(
        "<p>Hello <strong>bold</strong> text</p>"
      );
      expect(result).toContain("data-sd-animate");
      // All text nodes outside skip tags should be animated
      expect(result).toContain(">Hello <");
      expect(result).toContain(">bold<");
      expect(result).toContain(">text<");
    });

    it("should animate text in list items", async () => {
      const result = await processHtml(
        "<ul><li>First item</li><li>Second item</li></ul>"
      );
      expect(result).toContain("data-sd-animate");
      expect(result).toContain(">First <");
      expect(result).toContain(">item<");
    });

    it("should animate text in headings", async () => {
      const result = await processHtml("<h1>Hello world</h1>");
      expect(result).toContain("data-sd-animate");
    });
  });

  describe("CSS custom properties", () => {
    it("should set style with CSS custom properties", async () => {
      const result = await processHtml("<p>Hello</p>");
      expect(result).toContain("--sd-animation:sd-fadeIn");
      expect(result).toContain("--sd-duration:150ms");
      expect(result).toContain("--sd-easing:ease");
    });
  });

  describe("getLastRenderCharCount", () => {
    it("should return 0 before any render", () => {
      const plugin = createAnimatePlugin();
      expect(plugin.getLastRenderCharCount()).toBe(0);
    });

    it("should return HAST text node char count after render", async () => {
      const plugin = createAnimatePlugin();
      // "Hello world" = 11 HAST chars (5 + 1 space + 5)
      await processHtml("<p>Hello world</p>", plugin);
      expect(plugin.getLastRenderCharCount()).toBe(11);
    });

    it("should not include markdown syntax chars — only rendered text", async () => {
      const plugin = createAnimatePlugin();
      // plain text: "Hello" = 5 HAST chars
      await processHtml("<p>Hello</p>", plugin);
      expect(plugin.getLastRenderCharCount()).toBe(5);
    });

    it("should update after each render", async () => {
      const plugin = createAnimatePlugin();
      await processHtml("<p>Hi</p>", plugin);
      const firstCount = plugin.getLastRenderCharCount();
      await processHtml("<p>Hello world</p>", plugin);
      const secondCount = plugin.getLastRenderCharCount();
      expect(secondCount).toBeGreaterThan(firstCount);
    });

    it("getLastRenderCharCount is non-destructive (StrictMode-safe)", async () => {
      const plugin = createAnimatePlugin();
      await processHtml("<p>Hello</p>", plugin);
      const a = plugin.getLastRenderCharCount();
      const b = plugin.getLastRenderCharCount();
      expect(a).toBe(5);
      expect(b).toBe(5);
    });

    it("setPrevContentLength with getLastRenderCharCount should skip already-rendered chars", async () => {
      const plugin = createAnimatePlugin();
      // First render: "Hello"
      await processHtml("<p>Hello</p>", plugin);
      plugin.commit();

      // Second render: "Hello world" — committed count drives the skip window
      const result = await processHtml("<p>Hello world</p>", plugin);

      // "Hello" (chars 0-4) should have duration:0ms — already visible
      // " world" should have normal duration
      const spans = result.match(/--sd-duration:[^;"]*/g) ?? [];
      expect(spans.some((s) => s.includes("0ms"))).toBe(true);
      expect(spans.some((s) => s.includes("150ms"))).toBe(true);
    });
  });

  describe("stagger delay", () => {
    it("should apply incremental delay to each word", async () => {
      const plugin = createAnimatePlugin({ stagger: 50 });
      const result = await processHtml("<p>Hello world foo</p>", plugin);
      const delays = result.match(/--sd-delay:\d+ms/g) ?? [];
      // First word has delay 0 (omitted), second has 50ms, third has 100ms
      expect(delays).toEqual(["--sd-delay:50ms", "--sd-delay:100ms"]);
    });

    it("should apply incremental delay to each char", async () => {
      const plugin = createAnimatePlugin({ stagger: 20, sep: "char" });
      const result = await processHtml("<p>Hi there</p>", plugin);
      const delays = result.match(/--sd-delay:\d+ms/g) ?? [];
      // H=0ms(omitted), i=20ms, t=40ms, h=60ms, e=80ms, r=100ms, e=120ms
      expect(delays).toEqual([
        "--sd-delay:20ms",
        "--sd-delay:40ms",
        "--sd-delay:60ms",
        "--sd-delay:80ms",
        "--sd-delay:100ms",
        "--sd-delay:120ms",
      ]);
    });

    it("should not apply delay to skipped (already-rendered) words", async () => {
      const plugin = createAnimatePlugin({ stagger: 50 });
      await processHtml("<p>Hello</p>", plugin);
      plugin.commit();

      const result = await processHtml("<p>Hello world foo</p>", plugin);

      // "Hello" is skipped (duration:0ms, no delay)
      // "world" is first new word → delay 0 (omitted)
      // "foo" is second new word → delay 50ms
      const delays = result.match(/--sd-delay:\d+ms/g) ?? [];
      expect(delays).toEqual(["--sd-delay:50ms"]);
    });

    it("should default stagger to 40ms", async () => {
      const plugin = createAnimatePlugin();
      const result = await processHtml("<p>Hello world</p>", plugin);
      const delays = result.match(/--sd-delay:\d+ms/g) ?? [];
      expect(delays).toEqual(["--sd-delay:40ms"]);
    });

    it("should support stagger of 0 to disable delay", async () => {
      const plugin = createAnimatePlugin({ stagger: 0 });
      const result = await processHtml("<p>Hello world foo</p>", plugin);
      const delays = result.match(/--sd-delay:\d+ms/g) ?? [];
      expect(delays).toEqual([]);
    });
  });

  describe("trailing whitespace glued into word spans (#535)", () => {
    it("keeps the space after a word inside the same animate span", async () => {
      const result = await processHtml("<p>Hello world</p>");
      // "Hello " (with trailing space) is one span, then "world"
      expect(result).toMatch(HELLO_SPAN_RE);
      expect(result).toMatch(WORLD_SPAN_RE);
      // No bare whitespace text node between the two spans
      expect(result).not.toMatch(SPAN_GAP_STRICT_RE);
    });

    it("glues spaces in char mode onto the preceding character", async () => {
      const plugin = createAnimatePlugin({ sep: "char", stagger: 20 });
      const result = await processHtml("<p>Hi there</p>", plugin);
      expect(result).toMatch(I_SPACE_SPAN_RE);
      expect(result).not.toMatch(SPAN_GAP_CHAR_RE);
    });
  });

  describe("shared timeline (cross-block / cross-tick chaining) (#482)", () => {
    it("chains delays across sibling blocks in one pass", async () => {
      const timeline = createAnimateTimeline({ now: () => 1000 });
      const block0 = createAnimatePlugin({ stagger: 50, timeline });
      const block1 = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(1000);
      const result0 = await processHtml("<p>Hello world</p>", block0);
      const result1 = await processHtml("<p>foo bar</p>", block1);
      timeline.commitPass();

      // block0: Hello=0 (omitted), world=50
      expect(delaysOf(result0)).toEqual([50]);
      // block1: foo=100, bar=150
      expect(delaysOf(result1)).toEqual([100, 150]);
    });

    it("pushes a later block past a still-running cascade (memoized prior block)", async () => {
      let now = 0;
      const timeline = createAnimateTimeline({ now: () => now });
      const list = createAnimatePlugin({ stagger: 50, timeline });
      const heading = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(0);
      await processHtml("<ul><li>one two three four five</li></ul>", list);
      timeline.commitPass();

      now = 80;
      timeline.beginPass(now);
      const result = await processHtml("<h2>Done</h2>", heading);
      timeline.commitPass();

      // delay = max(0, 250-80) = 170
      expect(delaysOf(result)).toEqual([170]);
    });

    it("does not add delay once the cascade has drained", async () => {
      let now = 0;
      const timeline = createAnimateTimeline({ now: () => now });
      const block0 = createAnimatePlugin({ stagger: 50, timeline });
      const block1 = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(0);
      await processHtml("<p>Hello world</p>", block0);
      timeline.commitPass();

      now = 500;
      timeline.beginPass(now);
      const result = await processHtml("<p>later</p>", block1);
      timeline.commitPass();
      expect(delaysOf(result)).toEqual([]);
    });

    it("only advances the timeline for newly animated words", async () => {
      let now = 0;
      const timeline = createAnimateTimeline({ now: () => now });
      const plugin = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(0);
      await processHtml("<p>Hello world</p>", plugin);
      timeline.commitPass();
      plugin.commit();

      now = 30;
      timeline.beginPass(now);
      const result = await processHtml("<p>Hello world foo</p>", plugin);
      timeline.commitPass();

      expect(delaysOf(result)).toEqual([70]);
    });

    it("per-plugin mark/rewind makes StrictMode double-rehype idempotent", async () => {
      const timeline = createAnimateTimeline({ now: () => 0 });
      const plugin = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(0);
      const a = await processHtml("<p>one two three</p>", plugin);
      // StrictMode: rehype re-enters without a second beginPass
      const b = await processHtml("<p>one two three</p>", plugin);
      timeline.commitPass();
      plugin.commit();

      expect(delaysOf(a)).toEqual(delaysOf(b));
      expect(delaysOf(b)).toEqual([50, 100]);
    });

    it("StrictMode multi-block stays ordered without double-counting", async () => {
      const timeline = createAnimateTimeline({ now: () => 0 });
      const a = createAnimatePlugin({ stagger: 50, timeline });
      const b = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(0);
      await processHtml("<p>one two</p>", a);
      await processHtml("<p>one two</p>", a);
      const b1 = await processHtml("<p>three four</p>", b);
      const b2 = await processHtml("<p>three four</p>", b);
      timeline.commitPass();

      expect(delaysOf(b1)).toEqual([100, 150]);
      expect(delaysOf(b2)).toEqual(delaysOf(b1));
    });

    it("compresses stagger under load and keeps siblings ordered", async () => {
      const timeline = createAnimateTimeline({
        now: () => 0,
        maxBacklogMs: 200,
      });
      const list = createAnimatePlugin({ stagger: 50, timeline });
      const heading = createAnimatePlugin({ stagger: 50, timeline });

      timeline.beginPass(0);
      const words = Array.from({ length: 20 }, (_, i) => `w${i}`).join(" ");
      const listHtml = await processHtml(`<p>${words}</p>`, list);
      const headHtml = await processHtml("<h2>Next</h2>", heading);
      timeline.commitPass();

      const listDelays = delaysOf(listHtml);
      const headDelays = delaysOf(headHtml);

      expect(Math.max(0, ...listDelays)).toBeLessThanOrEqual(200);
      for (let i = 1; i < listDelays.length; i += 1) {
        expect(listDelays[i]).toBeGreaterThan(listDelays[i - 1]);
      }
      expect(Math.min(...headDelays)).toBeGreaterThanOrEqual(
        Math.max(0, ...listDelays)
      );
    });

    it("long list then heading stays serialized under default budget", async () => {
      const timeline = createAnimateTimeline({ now: () => 0 });
      const list = createAnimatePlugin({ stagger: 40, timeline });
      const heading = createAnimatePlugin({ stagger: 40, timeline });

      timeline.beginPass(0);
      const words = Array.from({ length: 25 }, (_, i) => `item${i}`).join(" ");
      const listHtml = await processHtml(`<ul><li>${words}</li></ul>`, list);
      const headHtml = await processHtml("<h2>Done</h2>", heading);
      timeline.commitPass();

      const listMax = Math.max(0, ...delaysOf(listHtml));
      const headMin = Math.min(
        ...(delaysOf(headHtml).length ? delaysOf(headHtml) : [0])
      );

      // List cascade fits in the budget (with min-step floor it may overshoot
      // slightly past maxBacklog if a prior batch already filled it).
      expect(listMax).toBeLessThanOrEqual(MAX_ANIMATION_BACKLOG_MS + 1);
      expect(headMin).toBeGreaterThanOrEqual(listMax);
    });

    it("plateaus when stream outpaces stagger (compressed, not growing)", async () => {
      let now = 0;
      const stagger = 40;
      const timeline = createAnimateTimeline({ now: () => now });
      const block = createAnimatePlugin({ stagger, timeline });
      const maxDelayPerTick: number[] = [];

      for (let tick = 0; tick < 20; tick += 1) {
        const words = Array.from(
          { length: (tick + 1) * 3 },
          (_, i) => `w${i}`
        ).join(" ");
        timeline.beginPass(now);
        const result = await processHtml(`<p>${words}</p>`, block);
        timeline.commitPass();
        block.commit();
        maxDelayPerTick.push(Math.max(0, ...delaysOf(result)));
        now += 50;
      }

      // Under compression every batch fits in the budget (±1ms for float→int).
      expect(Math.max(...maxDelayPerTick)).toBeLessThanOrEqual(
        MAX_ANIMATION_BACKLOG_MS + 1
      );
      // Not growing unboundedly — later ticks stay near the ceiling.
      const late = maxDelayPerTick.slice(10);
      expect(Math.max(...late) - Math.min(...late)).toBeLessThanOrEqual(
        MAX_ANIMATION_BACKLOG_MS
      );
    });

    it("multi-block pass keeps a cascade after the budget is filled", async () => {
      // Fresh mount of 5 paragraphs — first-come budget would give blocks
      // 2+ step=0 (all words simultaneous, #482-shaped). Min-step floor keeps
      // a cascade going, with slight budget overshoot.
      const timeline = createAnimateTimeline({
        now: () => 0,
        maxBacklogMs: 200,
      });
      const plugins = Array.from({ length: 5 }, () =>
        createAnimatePlugin({ stagger: 40, timeline })
      );

      timeline.beginPass(0);
      const results: number[][] = [];
      for (const p of plugins) {
        const words = Array.from({ length: 6 }, (_, i) => `w${i}`).join(" ");
        results.push(delaysOf(await processHtml(`<p>${words}</p>`, p)));
      }
      timeline.commitPass();

      // Every block has a non-zero internal cascade (not all equal).
      for (const delays of results) {
        expect(delays.length).toBeGreaterThan(1);
        expect(new Set(delays).size).toBeGreaterThan(1);
      }
      // Blocks stay ordered: each block's first word ≥ previous block's last.
      for (let i = 1; i < results.length; i += 1) {
        const prevLast = Math.max(...results[i - 1]);
        const thisFirst = Math.min(...results[i]);
        expect(thisFirst).toBeGreaterThanOrEqual(prevLast);
      }
    });

    it("honours stagger:0 (no cascade, no min-step floor)", async () => {
      const timeline = createAnimateTimeline({ now: () => 0 });
      const plugin = createAnimatePlugin({ stagger: 0, timeline });
      timeline.beginPass(0);
      const result = await processHtml("<p>one two three four</p>", plugin);
      timeline.commitPass();
      expect(delaysOf(result)).toEqual([]);
    });
  });

  describe("list marker", () => {
    it("should stamp marker animation vars on the list item", async () => {
      const result = await processHtml("<ul><li>Hello world</li></ul>");
      expect(result).toContain("data-sd-animate-marker");
      expect(result).toContain("--sd-marker-duration:150ms");
      expect(result).toContain("--sd-marker-delay:0ms");
      expect(result).toContain("--sd-marker-easing:ease");
    });

    it("should sync marker delay with the item's first word", async () => {
      const plugin = createAnimatePlugin({ stagger: 40 });
      const result = await processHtml(
        "<ul><li>Hello world</li><li>Foo bar</li></ul>",
        plugin
      );
      const delays = result.match(/--sd-marker-delay:\d+ms/g) ?? [];
      // First item's first word has delay 0; second item's first word is the
      // third animated word in the block → 2 * 40ms.
      expect(delays).toEqual([
        "--sd-marker-delay:0ms",
        "--sd-marker-delay:80ms",
      ]);
    });

    it("should respect custom duration and easing", async () => {
      const plugin = createAnimatePlugin({ duration: 300, easing: "ease-out" });
      const result = await processHtml("<ul><li>Hello</li></ul>", plugin);
      expect(result).toContain("--sd-marker-duration:300ms");
      expect(result).toContain("--sd-marker-easing:ease-out");
    });

    it("should not re-animate the marker of an already-rendered item", async () => {
      const plugin = createAnimatePlugin();
      await processHtml("<ul><li>Hello</li></ul>", plugin);
      const prevCount = plugin.getLastRenderCharCount();

      plugin.setPrevContentLength(prevCount);
      const result = await processHtml(
        "<ul><li>Hello</li><li>World</li></ul>",
        plugin
      );

      const durations = result.match(/--sd-marker-duration:\d+ms/g) ?? [];
      // First (already-shown) item → 0ms; newly added item → 150ms.
      expect(durations).toEqual([
        "--sd-marker-duration:0ms",
        "--sd-marker-duration:150ms",
      ]);
    });

    it("should not stamp marker vars on non-list content", async () => {
      const result = await processHtml("<p>Hello world</p>");
      expect(result).not.toContain("data-sd-animate-marker");
    });
  });

  describe("task-list checkbox", () => {
    const TASK_ITEM =
      '<ul><li class="task-list-item"><input type="checkbox" disabled=""/> Hello world</li></ul>';

    it("should tag the checkbox with data-sd-animate and timing", async () => {
      const result = await processHtml(TASK_ITEM);
      const input = result.match(INPUT_TAG_RE)?.[0] ?? "";
      expect(input).toContain("data-sd-animate");
      expect(input).toContain("--sd-animation:sd-fadeIn");
      expect(input).toContain("--sd-duration:150ms");
      expect(input).toContain("--sd-delay:0ms");
    });

    it("should sync the checkbox with the configured animation", async () => {
      const plugin = createAnimatePlugin({ animation: "slideUp" });
      const result = await processHtml(TASK_ITEM, plugin);
      const input = result.match(INPUT_TAG_RE)?.[0] ?? "";
      expect(input).toContain("--sd-animation:sd-slideUp");
    });

    it("should not re-animate the checkbox of an already-rendered item", async () => {
      const plugin = createAnimatePlugin();
      await processHtml(TASK_ITEM, plugin);
      const prevCount = plugin.getLastRenderCharCount();

      plugin.setPrevContentLength(prevCount);
      const result = await processHtml(TASK_ITEM, plugin);
      const input = result.match(INPUT_TAG_RE)?.[0] ?? "";
      expect(input).toContain("--sd-duration:0ms");
    });

    it("should not tag inputs outside of list items", async () => {
      const result = await processHtml(
        '<p><input type="checkbox"/> Hello world</p>'
      );
      const input = result.match(INPUT_TAG_RE)?.[0] ?? "";
      expect(input).not.toContain("data-sd-animate");
    });

    it("should not let a parent item capture a nested item's checkbox", async () => {
      // A regular outer item containing a task sub-item: the outer item has no
      // checkbox of its own and must not stamp the nested one.
      const result = await processHtml(
        '<ul><li>Outer item<ul><li class="task-list-item">' +
          '<input type="checkbox"/> Nested task</li></ul></li></ul>'
      );
      const inputs = result.match(INPUT_TAG_GLOBAL_RE) ?? [];
      expect(inputs).toHaveLength(1);
      // The lone checkbox should be tagged once, with the nested item's own
      // delay. It is the 3rd animated word ("Outer"=0, "item"=40, "Nested"=80).
      expect(inputs[0]).toContain("data-sd-animate");
      expect(inputs[0]).toContain("--sd-delay:80ms");
    });
  });

  describe("void elements (img / hr)", () => {
    it("should tag an image with data-sd-animate and timing", async () => {
      const result = await processHtml('<p><img src="x.png" alt="x"/></p>');
      const img = result.match(IMG_TAG_RE)?.[0] ?? "";
      expect(img).toContain("data-sd-animate");
      expect(img).toContain("--sd-animation:sd-fadeIn");
      expect(img).toContain("--sd-duration:150ms");
    });

    it("should tag a horizontal rule with data-sd-animate", async () => {
      const result = await processHtml("<hr/>");
      const hr = result.match(HR_TAG_RE)?.[0] ?? "";
      expect(hr).toContain("data-sd-animate");
      expect(hr).toContain("--sd-animation:sd-fadeIn");
    });

    it("should use the configured animation type", async () => {
      const plugin = createAnimatePlugin({ animation: "blurIn" });
      const result = await processHtml('<p><img src="x.png"/></p>', plugin);
      const img = result.match(IMG_TAG_RE)?.[0] ?? "";
      expect(img).toContain("--sd-animation:sd-blurIn");
    });

    it("should preserve an existing inline style", async () => {
      const result = await processHtml('<img src="x.png" style="width:10px"/>');
      const img = result.match(IMG_TAG_RE)?.[0] ?? "";
      expect(img).toContain("width:10px");
      expect(img).toContain("--sd-animation");
    });

    it("should not animate void elements inside skip tags", async () => {
      const result = await processHtml('<pre><img src="x.png"/></pre>');
      const img = result.match(IMG_TAG_RE)?.[0] ?? "";
      expect(img).not.toContain("data-sd-animate");
    });

    it("should advance the stagger sequence alongside words", async () => {
      const plugin = createAnimatePlugin({ stagger: 50 });
      const result = await processHtml("<p>Hello</p><hr/><p>World</p>", plugin);
      // Hello=word0(delay 0), hr=slot1(delay 50), World=word2(delay 100)
      expect(result).toContain("--sd-delay:50ms");
      expect(result).toContain("--sd-delay:100ms");
    });

    it("should not re-animate a trailing void on the next stream tick", async () => {
      const plugin = createAnimatePlugin();
      await processHtml("<p>Hello</p><hr/>", plugin);
      const prevCount = plugin.getLastRenderCharCount();
      plugin.setPrevContentLength(prevCount);

      const result = await processHtml("<p>Hello</p><hr/>", plugin);
      const hr = result.match(HR_TAG_RE)?.[0] ?? "";
      expect(hr).toContain("--sd-duration:0ms");
    });
  });
});
