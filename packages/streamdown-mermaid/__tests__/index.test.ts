import { describe, expect, it, vi } from "vitest";
import { createMermaidPlugin, mermaidPlugin } from "../index";

describe("mermaidPlugin", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(mermaidPlugin.name).toBe("mermaid");
      expect(mermaidPlugin.type).toBe("diagram");
    });

    it("should have correct language identifier", () => {
      expect(mermaidPlugin.language).toBe("mermaid");
    });

    it("should have getMermaid method", () => {
      expect(typeof mermaidPlugin.getMermaid).toBe("function");
    });
  });

  describe("getMermaid", () => {
    it("should return mermaid instance", () => {
      const instance = mermaidPlugin.getMermaid();
      expect(instance).toBeDefined();
      expect(typeof instance.initialize).toBe("function");
      expect(typeof instance.render).toBe("function");
    });

    it("should accept config on getMermaid call", () => {
      const instance = mermaidPlugin.getMermaid({ theme: "dark" });
      expect(instance).toBeDefined();
    });
  });
});

describe("createMermaidPlugin", () => {
  it("should create plugin with default options", () => {
    const plugin = createMermaidPlugin();
    expect(plugin.name).toBe("mermaid");
    expect(plugin.type).toBe("diagram");
    expect(plugin.language).toBe("mermaid");
  });

  it("should create plugin with custom config", () => {
    const plugin = createMermaidPlugin({
      config: {
        theme: "forest",
        fontFamily: "Arial",
      },
    });
    expect(plugin.name).toBe("mermaid");
    expect(plugin.type).toBe("diagram");
  });

  it("should create independent plugin instances", () => {
    const plugin1 = createMermaidPlugin();
    const plugin2 = createMermaidPlugin();

    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.getMermaid).not.toBe(plugin2.getMermaid);
  });

  it("should retain all plugin methods", () => {
    const plugin = createMermaidPlugin();
    expect(typeof plugin.getMermaid).toBe("function");
    expect(plugin.name).toBe("mermaid");
    expect(plugin.type).toBe("diagram");
    expect(plugin.language).toBe("mermaid");
  });
});

describe("MermaidInstance", () => {
  it("should initialize with config", () => {
    const plugin = createMermaidPlugin();
    const instance = plugin.getMermaid();

    expect(() => {
      instance.initialize({ theme: "dark" });
    }).not.toThrow();
  });

  it("should render diagram", async () => {
    const plugin = createMermaidPlugin();
    const instance = plugin.getMermaid();

    const diagram = `graph TD
      A[Start] --> B[End]`;

    const result = await instance.render("test-diagram", diagram);
    expect(result).toHaveProperty("svg");
    expect(typeof result.svg).toBe("string");
    expect(result.svg).toContain("svg");
  });

  it("should handle invalid diagram gracefully", async () => {
    const plugin = createMermaidPlugin();
    const instance = plugin.getMermaid();

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await instance.render("invalid-test", "not a valid diagram %%%");
    } catch {
      // Expected to throw for invalid diagram
    }

    consoleSpy.mockRestore();
  });
});
