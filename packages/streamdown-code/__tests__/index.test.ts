import type { BundledLanguage, ThemeRegistrationAny } from "shiki";
import { describe, expect, it, vi } from "vitest";
import { code, createCodePlugin } from "../index";

describe("code", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(code.name).toBe("shiki");
      expect(code.type).toBe("code-highlighter");
    });

    it("should return default themes", () => {
      const themes = code.getThemes();
      expect(themes).toEqual(["github-light", "github-dark"]);
    });
  });

  describe("supportsLanguage", () => {
    it("should return true for supported languages", () => {
      expect(code.supportsLanguage("javascript")).toBe(true);
      expect(code.supportsLanguage("typescript")).toBe(true);
      expect(code.supportsLanguage("js" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("ts" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("cjs" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("mjs" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("cts" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("mts" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("zsh" as BundledLanguage)).toBe(true);
      expect(code.supportsLanguage("python")).toBe(true);
      expect(code.supportsLanguage("rust")).toBe(true);
    });

    it("should return false for unsupported languages", () => {
      expect(code.supportsLanguage("not-a-real-language")).toBe(false);
      expect(code.supportsLanguage("")).toBe(false);
    });
  });

  describe("getSupportedLanguages", () => {
    it("should return array of languages", () => {
      const languages = code.getSupportedLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    it("should include common languages", () => {
      const languages = code.getSupportedLanguages();
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
      const result = code.highlight(
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

      code.highlight(
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

      const cachedResult = code.highlight(
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

    it("should work without a callback", async () => {
      const result = code.highlight({
        code: "const z = 3;",
        language: "javascript",
        themes: ["github-light", "github-dark"],
      });

      // First call returns null (async loading)
      expect(result).toBe(null);

      // Wait for background highlighting to finish
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Second call should return cached result
      const cached = code.highlight({
        code: "const z = 3;",
        language: "javascript",
        themes: ["github-light", "github-dark"],
      });

      expect(cached).not.toBe(null);
      expect(cached).toHaveProperty("tokens");
    });

    it("should handle code longer than 100 characters", async () => {
      const longCode =
        "const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\nconst e = 5;\nconst f = 6;\nconst g = 7;\nconst h = 8;";
      expect(longCode.length).toBeGreaterThan(100);

      const callback = vi.fn();
      code.highlight(
        {
          code: longCode,
          language: "javascript",
          themes: ["github-light", "github-dark"],
        },
        callback
      );

      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      const result = callback.mock.calls[0][0];
      expect(result).toHaveProperty("tokens");
    });

    it("should notify multiple subscribers for the same code", async () => {
      const plugin = createCodePlugin({ themes: ["nord", "dracula"] });
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      plugin.highlight(
        {
          code: "const multi = 1;",
          language: "javascript",
          themes: ["nord", "dracula"],
        },
        callback1
      );

      // Second call before first resolves — adds second subscriber
      plugin.highlight(
        {
          code: "const multi = 1;",
          language: "javascript",
          themes: ["nord", "dracula"],
        },
        callback2
      );

      await vi.waitFor(
        () => {
          expect(callback1).toHaveBeenCalled();
          expect(callback2).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      expect(callback1.mock.calls[0][0]).toHaveProperty("tokens");
      expect(callback2.mock.calls[0][0]).toHaveProperty("tokens");
    });

    it("should fall back to text when language is not loaded", async () => {
      const callback = vi.fn();
      // "text" is a special language in shiki, not a bundled language
      // so it won't be in getLoadedLanguages() as a bundled lang
      code.highlight(
        {
          code: "hello world",
          language: "text" as BundledLanguage,
          themes: ["github-light", "github-dark"],
        },
        callback
      );

      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      const result = callback.mock.calls[0][0];
      expect(result).toHaveProperty("tokens");
    });

    it("should fall back to text for unknown/truncated language identifiers", async () => {
      const callback = vi.fn();
      const plugin = createCodePlugin();

      plugin.highlight(
        {
          code: "const x = 1;",
          language: "javas" as BundledLanguage, // truncated "javascript"
          themes: ["github-light", "github-dark"],
        },
        callback
      );

      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      const result = callback.mock.calls[0][0];
      expect(result).toHaveProperty("tokens");
    });

    it("should highlight language aliases using bundled grammars", async () => {
      const callback = vi.fn();
      const result = code.highlight(
        {
          code: "const x = 1;",
          language: "js" as BundledLanguage,
          themes: ["github-light", "github-dark"],
        },
        callback
      );

      if (result) {
        expect(result).toHaveProperty("tokens");
        return;
      }

      await vi.waitFor(
        () => {
          expect(callback).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    });
  });
});

describe("highlight error handling", () => {
  it("should handle highlighting errors gracefully", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    // Create a fresh plugin to avoid cache
    const freshPlugin = createCodePlugin({
      themes: ["invalid-theme-that-does-not-exist", "another-invalid-theme"],
    });

    const callback = vi.fn();

    freshPlugin.highlight(
      {
        code: "const x = 1;",
        language: "javascript",
        themes: ["invalid-theme-that-does-not-exist", "another-invalid-theme"],
      },
      callback
    );

    // Wait for the async operation to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The callback should not be called due to error
    // and console.error should be called
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
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

  it("should create plugin with custom theme objects", () => {
    const customLight: ThemeRegistrationAny = {
      name: "my-light-theme",
      type: "light",
      colors: { "editor.background": "#ffffff" },
      tokenColors: [],
    };
    const customDark: ThemeRegistrationAny = {
      name: "my-dark-theme",
      type: "dark",
      colors: { "editor.background": "#1e1e1e" },
      tokenColors: [],
    };
    const plugin = createCodePlugin({
      themes: [customLight, customDark],
    });
    const themes = plugin.getThemes();
    expect(themes[0]).toBe(customLight);
    expect(themes[1]).toBe(customDark);
  });

  it("should create plugin with mixed built-in and custom themes", () => {
    const customDark: ThemeRegistrationAny = {
      name: "my-dark-theme",
      type: "dark",
      colors: { "editor.background": "#1e1e1e" },
      tokenColors: [],
    };
    const plugin = createCodePlugin({
      themes: ["github-light", customDark],
    });
    const themes = plugin.getThemes();
    expect(themes[0]).toBe("github-light");
    expect(themes[1]).toBe(customDark);
  });

  it("should highlight code with custom theme objects", async () => {
    const customLight: ThemeRegistrationAny = {
      name: "custom-light",
      type: "light",
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
      tokenColors: [],
    };
    const customDark: ThemeRegistrationAny = {
      name: "custom-dark",
      type: "dark",
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      tokenColors: [],
    };
    const plugin = createCodePlugin({
      themes: [customLight, customDark],
    });

    const callback = vi.fn();
    const result = plugin.highlight(
      {
        code: "const x = 1;",
        language: "javascript",
        themes: [customLight, customDark],
      },
      callback
    );

    expect(result).toBeNull();

    await vi.waitFor(
      () => {
        expect(callback).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    const highlightResult = callback.mock.calls[0][0];
    expect(highlightResult.tokens).toBeDefined();
    expect(Array.isArray(highlightResult.tokens)).toBe(true);
  });
});
