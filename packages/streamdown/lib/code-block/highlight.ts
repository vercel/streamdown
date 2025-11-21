import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

export const createShiki = async (
  language: BundledLanguage,
  shikiTheme: [BundledTheme, BundledTheme]
) => {
  const highlighter = await createHighlighter({
    themes: shikiTheme,
    langs: [language],
    engine: jsEngine,
  });

  return highlighter;
};
