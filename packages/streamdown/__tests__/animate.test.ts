import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { animate, createAnimatePlugin } from "../lib/animate";

const SPAN_GAP_RE = /<\/span>\s+<span/;
const CODE_CONTENT_RE = /<code>([^<]*)<\/code>/;

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
      expect(result).toContain(">Hello<");
      expect(result).toContain(">world<");
      expect(result).toContain(">foo<");
    });

    it("should preserve whitespace as text nodes", async () => {
      const result = await processHtml("<p>Hello world</p>");
      // Whitespace should not be wrapped in a span
      expect(result).toMatch(SPAN_GAP_RE);
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
      expect(result).toContain(">i<");
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
      expect(result).toContain(">Hello<");
      expect(result).toContain(">bold<");
      expect(result).toContain(">text<");
    });

    it("should animate text in list items", async () => {
      const result = await processHtml(
        "<ul><li>First item</li><li>Second item</li></ul>"
      );
      expect(result).toContain("data-sd-animate");
      expect(result).toContain(">First<");
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

    it("setPrevContentLength with getLastRenderCharCount should skip already-rendered chars", async () => {
      const plugin = createAnimatePlugin();
      // First render: "Hello"
      await processHtml("<p>Hello</p>", plugin);
      const prevCount = plugin.getLastRenderCharCount();

      // Second render: "Hello world" — set prev length from HAST count
      plugin.setPrevContentLength(prevCount);
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
      const prevCount = plugin.getLastRenderCharCount();

      plugin.setPrevContentLength(prevCount);
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
});
