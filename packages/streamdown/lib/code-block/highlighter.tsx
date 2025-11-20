import {
  type BundledLanguage,
  bundledLanguages,
  type ShikiTransformer,
  type SpecialLanguage,
} from "shiki";

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
): language is BundledLanguage => Object.hasOwn(bundledLanguages, language);

export const getFallbackLanguage = (): SpecialLanguage => "text";
