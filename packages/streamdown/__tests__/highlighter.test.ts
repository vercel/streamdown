import { describe, expect, it, vi } from "vitest";
import {
  getFallbackLanguage,
  getTransformersFromPreClassName,
  isLanguageSupported,
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
        expect(mockContext.addClassToHast).toHaveBeenCalledWith(
          mockNode,
          "test-class"
        );
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
});
