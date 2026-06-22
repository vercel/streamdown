import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { animate, createAnimatePlugin } from "../lib/animate";

const SPAN_GAP_RE = /<\/span>\s+<span/;
const CODE_CONTENT_RE = /<code>([^<]*)<\/code>/;
const INPUT_TAG_RE = /<input[^>]*>/;
const INPUT_TAG_GLOBAL_RE = /<input[^>]*>/g;
const IMG_TAG_RE = /<img[^>]*>/;
const HR_TAG_RE = /<hr[^>]*>/;

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
  });
});
