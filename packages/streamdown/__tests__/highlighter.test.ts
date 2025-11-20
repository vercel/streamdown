import { describe, expect, it, vi } from "vitest";
import {
  createHighlighters,
  getFallbackLanguage,
  getTransformersFromPreClassName,
  isLanguageSupported,
  performHighlight,
} from "../lib/code-block/highlighter";

describe("Highlighter Utils", () => {
  describe("getTransformersFromPreClassName", () => {
    it("should return empty array when no preClassName provided", () => {
      const result = getTransformersFromPreClassName();
      expect(result).toEqual([]);
    });

    it("should return empty array when preClassName is undefined", () => {
      const result = getTransformersFromPreClassName(undefined);
      expect(result).toEqual([]);
    });

    it("should return transformer when preClassName is provided", () => {
      const result = getTransformersFromPreClassName("custom-class");
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("pre");
      expect(typeof result[0].pre).toBe("function");
    });

    it("should add class to node when transformer is applied", () => {
      const transformers = getTransformersFromPreClassName("test-class");
      const transformer = transformers[0];

      const mockNode = {
        properties: { className: [] },
      };

      const mockContext = {
        addClassToHast: vi.fn((node, className) => {
          if (Array.isArray(node.properties.className)) {
            node.properties.className.push(className);
          }
        }),
      };

      if (transformer.pre) {
        const result = transformer.pre.call(mockContext, mockNode);
        expect(mockContext.addClassToHast).toHaveBeenCalledWith(mockNode, "test-class");
        expect(result).toBe(mockNode);
      }
    });
  });

  describe("isLanguageSupported", () => {
    it("should return true for supported languages", () => {
      expect(isLanguageSupported("javascript")).toBe(true);
      expect(isLanguageSupported("typescript")).toBe(true);
      expect(isLanguageSupported("python")).toBe(true);
      expect(isLanguageSupported("java")).toBe(true);
      expect(isLanguageSupported("go")).toBe(true);
      expect(isLanguageSupported("rust")).toBe(true);
    });

    it("should return false for unsupported languages", () => {
      expect(isLanguageSupported("fake-language")).toBe(false);
      expect(isLanguageSupported("not-a-real-lang")).toBe(false);
      expect(isLanguageSupported("")).toBe(false);
    });

    it("should handle common language aliases", () => {
      expect(isLanguageSupported("js")).toBe(true);
      expect(isLanguageSupported("ts")).toBe(true);
      expect(isLanguageSupported("py")).toBe(true);
    });
  });

  describe("getFallbackLanguage", () => {
    it("should return 'text' as fallback language", () => {
      const result = getFallbackLanguage();
      expect(result).toBe("text");
    });
  });

  describe("createHighlighters", () => {
    it("should create light and dark highlighters", async () => {
      const themes: ["github-light", "github-dark"] = ["github-light", "github-dark"];
      const result = await createHighlighters(themes);

      expect(result).toHaveProperty("lightHighlighter");
      expect(result).toHaveProperty("darkHighlighter");
      expect(result.lightHighlighter).toBeDefined();
      expect(result.darkHighlighter).toBeDefined();
    });

    it("should create highlighters with different themes", async () => {
      const themes: ["min-light", "min-dark"] = ["min-light", "min-dark"];
      const result = await createHighlighters(themes);

      expect(result.lightHighlighter).toBeDefined();
      expect(result.darkHighlighter).toBeDefined();
    });
  });

  describe("performHighlight", () => {
    it("should highlight code with supported language", async () => {
      const code = "const x = 1;";
      const language = "javascript";
      const lightTheme = "github-light";
      const darkTheme = "github-dark";

      const [lightHtml, darkHtml] = await performHighlight(
        code,
        language,
        lightTheme,
        darkTheme
      );

      expect(lightHtml).toContain("<pre");
      expect(lightHtml).toContain("const");
      expect(darkHtml).toContain("<pre");
      expect(darkHtml).toContain("const");
    });

    it("should highlight code with preClassName", async () => {
      const code = "print('hello')";
      const language = "python";
      const lightTheme = "github-light";
      const darkTheme = "github-dark";
      const preClassName = "custom-pre-class";

      const [lightHtml, darkHtml] = await performHighlight(
        code,
        language,
        lightTheme,
        darkTheme,
        preClassName
      );

      expect(lightHtml).toContain("custom-pre-class");
      expect(darkHtml).toContain("custom-pre-class");
    });

    it("should use fallback language for unsupported language", async () => {
      const code = "some text content";
      const language = "unsupported-lang" as any;
      const lightTheme = "github-light";
      const darkTheme = "github-dark";

      const [lightHtml, darkHtml] = await performHighlight(
        code,
        language,
        lightTheme,
        darkTheme
      );

      expect(lightHtml).toContain("<pre");
      expect(darkHtml).toContain("<pre");
      expect(lightHtml).toContain("some text content");
      expect(darkHtml).toContain("some text content");
    });

    it("should handle empty code", async () => {
      const code = "";
      const language = "javascript";
      const lightTheme = "github-light";
      const darkTheme = "github-dark";

      const [lightHtml, darkHtml] = await performHighlight(
        code,
        language,
        lightTheme,
        darkTheme
      );

      expect(lightHtml).toContain("<pre");
      expect(darkHtml).toContain("<pre");
    });

    it("should handle code with special characters", async () => {
      const code = '<div class="test">Hello & Goodbye</div>';
      const language = "html";
      const lightTheme = "github-light";
      const darkTheme = "github-dark";

      const [lightHtml, darkHtml] = await performHighlight(
        code,
        language,
        lightTheme,
        darkTheme
      );

      expect(lightHtml).toBeDefined();
      expect(darkHtml).toBeDefined();
      expect(lightHtml).toContain("<pre");
      expect(darkHtml).toContain("<pre");
    });

    it("should handle multiline code", async () => {
      const code = `function hello() {
  console.log('world');
  return true;
}`;
      const language = "javascript";
      const lightTheme = "github-light";
      const darkTheme = "github-dark";

      const [lightHtml, darkHtml] = await performHighlight(
        code,
        language,
        lightTheme,
        darkTheme
      );

      expect(lightHtml).toContain("function");
      expect(lightHtml).toContain("console");
      expect(darkHtml).toContain("function");
      expect(darkHtml).toContain("console");
    });
  });
});
