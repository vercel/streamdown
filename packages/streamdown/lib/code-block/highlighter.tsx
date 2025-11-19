"use client";

import {
  type BundledLanguage,
  type BundledTheme,
  bundledLanguages,
  createHighlighter,
  type ShikiTransformer,
  type SpecialLanguage,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export const getTransformersFromPreClassName = (
  preClassName?: string
): ShikiTransformer[] => {
  if (!preClassName) {
    return [];
  }
  const preTransformer: ShikiTransformer = {
    pre(node) {
      this.addClassToHast(node, preClassName);
      return node;
    },
  };
  return [preTransformer];
};

export const isLanguageSupported = (
  language: string
): language is BundledLanguage => {
  return Object.hasOwn(bundledLanguages, language);
};

export const getFallbackLanguage = (): SpecialLanguage => {
  return "text";
};

export const createHighlighters = async (
  themes: [BundledTheme, BundledTheme]
) => {
  const [lightTheme, darkTheme] = themes;
  const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

  const lightHighlighter = await createHighlighter({
    themes: [lightTheme],
    langs: [],
    engine: jsEngine,
  });

  const darkHighlighter = await createHighlighter({
    themes: [darkTheme],
    langs: [],
    engine: jsEngine,
  });

  return { lightHighlighter, darkHighlighter };
};

export const performHighlight = async (
  code: string,
  language: BundledLanguage,
  lightTheme: BundledTheme,
  darkTheme: BundledTheme,
  preClassName?: string
): Promise<[string, string]> => {
  const { lightHighlighter, darkHighlighter } = await createHighlighters([
    lightTheme,
    darkTheme,
  ]);

  const lang = isLanguageSupported(language)
    ? language
    : getFallbackLanguage();

  // Load the language if supported
  if (isLanguageSupported(language)) {
    await lightHighlighter.loadLanguage(language);
    await darkHighlighter.loadLanguage(language);
  }

  const transformers = getTransformersFromPreClassName(preClassName);

  const light = lightHighlighter.codeToHtml(code, {
    lang,
    theme: lightTheme,
    transformers,
  });

  const dark = darkHighlighter.codeToHtml(code, {
    lang,
    theme: darkTheme,
    transformers,
  });

  return [light, dark];
};
