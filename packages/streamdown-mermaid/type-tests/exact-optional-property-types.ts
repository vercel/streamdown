/**
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`pnpm check-types:exact-optional`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import type { MermaidConfig } from "mermaid";
import { createMermaidPlugin } from "../dist/index";

interface MermaidOptions {
  config?: MermaidConfig;
  useMermaidDefaults?: boolean;
}

// Forwarding possibly-`undefined` optional props must type-check.
export const createPlugin = (options: MermaidOptions) =>
  createMermaidPlugin({
    config: options.config,
    useMermaidDefaults: options.useMermaidDefaults,
  });

export const plugin = createMermaidPlugin({
  config: undefined,
  useMermaidDefaults: undefined,
});
