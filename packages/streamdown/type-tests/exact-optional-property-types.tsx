/**
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`pnpm check-types:exact-optional`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import { Streamdown } from "../dist/index";

interface MessageProps {
  caret?: "block" | "circle";
  className?: string;
  codeBlockMaxHeight?: number | string;
  dir?: "auto" | "ltr" | "rtl";
  isAnimating?: boolean;
  lineNumbers?: boolean;
  mode?: "static" | "streaming";
  parseIncompleteMarkdown?: boolean;
  prefix?: string;
  tableMaxHeight?: number | string;
  text: string;
}

// Forwarding possibly-`undefined` optional props must type-check.
export const Message = (props: MessageProps) => (
  <Streamdown
    caret={props.caret}
    className={props.className}
    codeBlockMaxHeight={props.codeBlockMaxHeight}
    controls={{
      code: { copy: undefined, download: undefined },
      table: { copy: undefined, csvSeparator: undefined },
    }}
    dir={props.dir}
    isAnimating={props.isAnimating}
    lineNumbers={props.lineNumbers}
    linkSafety={{ enabled: true, onLinkCheck: undefined }}
    mermaid={{ config: undefined, errorComponent: undefined }}
    mode={props.mode}
    parseIncompleteMarkdown={props.parseIncompleteMarkdown}
    plugins={{ cjk: undefined, code: undefined, math: undefined }}
    prefix={props.prefix}
    remend={{ bold: undefined, handlers: undefined }}
    shikiTheme={undefined}
    tableMaxHeight={props.tableMaxHeight}
  >
    {props.text}
  </Streamdown>
);
