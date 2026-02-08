import type { Element, Root, Text } from "hast";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { animate, createAnimatePlugin } from "../index";

const processHtml = async (html: string, plugin = animate) => {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(plugin.rehypePlugin)
    .use(rehypeStringify);

  const result = await processor.process(html);
  return String(result);
};

const getAnimatedSpans = (html: string): Element[] => {
  const processor = unified().use(rehypeParse, { fragment: true });
  const tree = processor.parse(html) as Root;
  const spans: Element[] = [];
  visit(tree, "element", (node: Element) => {
    if (node.properties?.["dataSdAnimate"] !== undefined) {
      spans.push(node);
    }
  });
  return spans;
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
      expect(result).toMatch(/<\/span>\s+<span/);
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
      const result = await processHtml(
        '<svg><text>label</text></svg>'
      );
      expect(result).not.toContain("data-sd-animate");
    });

    it("should animate text outside code but not inside", async () => {
      const result = await processHtml(
        "<p>Hello <code>world</code> foo</p>"
      );
      // "Hello" and "foo" should be animated
      expect(result).toContain("data-sd-animate");
      // "world" inside code should NOT be animated
      const codeMatch = result.match(/<code>([^<]*)<\/code>/);
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
});
