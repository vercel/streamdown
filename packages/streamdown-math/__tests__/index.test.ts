import { describe, expect, it } from "vitest";
import { createMathPlugin, mathPlugin } from "../index";

describe("mathPlugin", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(mathPlugin.name).toBe("katex");
      expect(mathPlugin.type).toBe("math");
    });

    it("should have remarkPlugin", () => {
      expect(mathPlugin.remarkPlugin).toBeDefined();
      expect(Array.isArray(mathPlugin.remarkPlugin)).toBe(true);
    });

    it("should have rehypePlugin", () => {
      expect(mathPlugin.rehypePlugin).toBeDefined();
      expect(Array.isArray(mathPlugin.rehypePlugin)).toBe(true);
    });

    it("should have getStyles method", () => {
      expect(typeof mathPlugin.getStyles).toBe("function");
      expect(mathPlugin.getStyles?.()).toBe("katex/dist/katex.min.css");
    });
  });
});

describe("createMathPlugin", () => {
  it("should create plugin with default options", () => {
    const plugin = createMathPlugin();
    expect(plugin.name).toBe("katex");
    expect(plugin.type).toBe("math");
    expect(plugin.remarkPlugin).toBeDefined();
    expect(plugin.rehypePlugin).toBeDefined();
  });

  it("should create plugin with singleDollarTextMath option", () => {
    const plugin = createMathPlugin({ singleDollarTextMath: true });
    expect(plugin.remarkPlugin).toBeDefined();
    expect(Array.isArray(plugin.remarkPlugin)).toBe(true);
    const [, options] = plugin.remarkPlugin as [unknown, { singleDollarTextMath: boolean }];
    expect(options.singleDollarTextMath).toBe(true);
  });

  it("should create plugin with singleDollarTextMath false by default", () => {
    const plugin = createMathPlugin();
    const [, options] = plugin.remarkPlugin as [unknown, { singleDollarTextMath: boolean }];
    expect(options.singleDollarTextMath).toBe(false);
  });

  it("should create plugin with custom errorColor", () => {
    const plugin = createMathPlugin({ errorColor: "#ff0000" });
    expect(plugin.rehypePlugin).toBeDefined();
    expect(Array.isArray(plugin.rehypePlugin)).toBe(true);
    const [, options] = plugin.rehypePlugin as [unknown, { errorColor: string }];
    expect(options.errorColor).toBe("#ff0000");
  });

  it("should use default errorColor when not specified", () => {
    const plugin = createMathPlugin();
    const [, options] = plugin.rehypePlugin as [unknown, { errorColor: string }];
    expect(options.errorColor).toBe("var(--color-muted-foreground)");
  });

  it("should create independent plugin instances", () => {
    const plugin1 = createMathPlugin({ singleDollarTextMath: true });
    const plugin2 = createMathPlugin({ singleDollarTextMath: false });

    const [, options1] = plugin1.remarkPlugin as [unknown, { singleDollarTextMath: boolean }];
    const [, options2] = plugin2.remarkPlugin as [unknown, { singleDollarTextMath: boolean }];

    expect(options1.singleDollarTextMath).toBe(true);
    expect(options2.singleDollarTextMath).toBe(false);
  });
});
