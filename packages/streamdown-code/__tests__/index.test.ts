import { describe, expect, it, vi } from "vitest";
import { codePlugin, createCodePlugin } from "../index";

describe("codePlugin", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(codePlugin.name).toBe("shiki");
      expect(codePlugin.type).toBe("code-highlighter");
    });

    it("should return default themes", () => {
      const themes = codePlugin.getThemes();
      expect(themes).toEqual(["github-light", "github-dark"]);
    });
  });

  describe("supportsLanguage", () => {
    it("should return true for supported languages", () => {
      expect(codePlugin.supportsLanguage("javascript")).toBe(true);
      expect(codePlugin.supportsLanguage("typescript")).toBe(true);
      expect(codePlugin.supportsLanguage("python")).toBe(true);
      expect(codePlugin.supportsLanguage("rust")).toBe(true);
    });

    it("should return false for unsupported languages", () => {
      expect(codePlugin.supportsLanguage("not-a-real-language")).toBe(false);
      expect(codePlugin.supportsLanguage("")).toBe(false);
    });
  });

  describe("getSupportedLanguages", () => {
    it("should return array of languages", () => {
      const languages = codePlugin.getSupportedLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    it("should include common languages", () => {
      const languages = codePlugin.getSupportedLanguages();
      expect(languages).toContain("javascript");
      expect(languages).toContain("typescript");
      expect(languages).toContain("python");
      expect(languages).toContain("html");
      expect(languages).toContain("css");
    });
  });

  describe("highlight", () => {
    it("should return null initially and call callback when ready", async () => {
      const callback = vi.fn();
      const result = codePlugin.highlight(
        {
          code: "const x = 1;",
          language: "javascript",
          themes: ["github-light", "github-dark"],
        },
        callback
      );

      expect(result).toBe(null);

      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      const highlightResult = callback.mock.calls[0][0];
      expect(highlightResult).toHaveProperty("tokens");
      expect(highlightResult).toHaveProperty("bg");
      expect(highlightResult).toHaveProperty("fg");
    });

    it("should return cached result on subsequent calls", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      codePlugin.highlight(
        {
          code: "let y = 2;",
          language: "javascript",
          themes: ["github-light", "github-dark"],
        },
        callback1
      );

      await vi.waitFor(
        () => {
          expect(callback1).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      const cachedResult = codePlugin.highlight(
        {
          code: "let y = 2;",
          language: "javascript",
          themes: ["github-light", "github-dark"],
        },
        callback2
      );

      expect(cachedResult).not.toBe(null);
      expect(cachedResult).toHaveProperty("tokens");
    });
  });
});

describe("createCodePlugin", () => {
  it("should create plugin with default themes", () => {
    const plugin = createCodePlugin();
    expect(plugin.getThemes()).toEqual(["github-light", "github-dark"]);
  });

  it("should create plugin with custom themes", () => {
    const plugin = createCodePlugin({
      themes: ["nord", "dracula"],
    });
    expect(plugin.getThemes()).toEqual(["nord", "dracula"]);
  });

  it("should retain all plugin methods", () => {
    const plugin = createCodePlugin();
    expect(plugin.name).toBe("shiki");
    expect(plugin.type).toBe("code-highlighter");
    expect(typeof plugin.highlight).toBe("function");
    expect(typeof plugin.supportsLanguage).toBe("function");
    expect(typeof plugin.getSupportedLanguages).toBe("function");
    expect(typeof plugin.getThemes).toBe("function");
  });
});
