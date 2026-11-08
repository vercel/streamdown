/**
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`pnpm check-types:exact-optional`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import { createCodePlugin, type ThemeInput } from "../dist/index";

interface CodeOptions {
  isIncomplete?: boolean;
  themes?: [ThemeInput, ThemeInput];
}

// Forwarding possibly-`undefined` optional props must type-check.
export const createPlugin = (options: CodeOptions) =>
  createCodePlugin({ themes: options.themes });

export const plugin = createCodePlugin({ themes: undefined });

export const highlight = (options: CodeOptions) =>
  plugin.highlight({
    code: "",
    isIncomplete: options.isIncomplete,
    language: "ts",
    themes: plugin.getThemes(),
  });
