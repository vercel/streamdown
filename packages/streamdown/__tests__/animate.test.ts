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
const CODE_CONTENT_RE = /<code>([^<]*)<\/code>/;
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
    it("should not animate text inside code elements", async () => {
      const result = await processHtml("<code>const x = 1</code>");
      expect(result).not.toContain("data-sd-animate");
      expect(result).toContain("const x = 1");
    });

    it("should not animate text inside pre elements", async () => {
      const result = await processHtml("<pre>some code</pre>");
      expect(result).not.toContain("data-sd-animate");
    });

    it("should not animate text inside svg elements", async () => {
      const result = await processHtml("<svg><text>label</text></svg>");
      expect(result).not.toContain("data-sd-animate");
    });

    it("should animate text outside code but not inside", async () => {
      const result = await processHtml("<p>Hello <code>world</code> foo</p>");
      // "Hello" and "foo" should be animated
      expect(result).toContain("data-sd-animate");
      // "world" inside code should NOT be animated
      const codeMatch = result.match(CODE_CONTENT_RE);
      expect(codeMatch?.[1]).toBe("world");
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
      expect(result).toMatch(/>Hello <\/span>/);
      expect(result).toMatch(/>world<\/span>/);
      // No bare whitespace text node between the two spans
      expect(result).not.toMatch(/<\/span> <span/);
    });

    it("glues spaces in char mode onto the preceding character", async () => {
      const plugin = createAnimatePlugin({ sep: "char", stagger: 20 });
      const result = await processHtml("<p>Hi there</p>", plugin);
      expect(result).toMatch(/>i <\/span>/);
      expect(result).not.toMatch(/<\/span> <span[^>]*>t</);
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
        results.push(
          delaysOf(await processHtml(`<p>${words}</p>`, p))
        );
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
});
