/**
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`pnpm check-types:exact-optional`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import { createMathPlugin, type MathPlugin } from "../dist/index";

interface MathOptions {
  errorColor?: string;
  getStyles?: () => string;
  singleDollarTextMath?: boolean;
}

// Forwarding possibly-`undefined` optional props must type-check.
export const createPlugin = (options: MathOptions) =>
  createMathPlugin({
    errorColor: options.errorColor,
    singleDollarTextMath: options.singleDollarTextMath,
  });

export const plugin = createMathPlugin({
  errorColor: undefined,
  singleDollarTextMath: undefined,
});

export const withStyles = (options: MathOptions): MathPlugin => ({
  ...plugin,
  getStyles: options.getStyles,
});
