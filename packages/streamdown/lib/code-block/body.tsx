import {
  type ComponentProps,
  type CSSProperties,
  memo,
  useContext,
  useMemo,
} from "react";
import { StreamdownContext } from "../../index";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import { resolveMaxHeight, usePinnedScroll } from "../use-pinned-scroll";
import { cn as baseCn } from "../utils";

type CodeBlockBodyProps = ComponentProps<"div"> & {
  maxHeight?: number | string;
  result: HighlightResult;
  language: string;
  startLine?: number;
  /** Show line numbers in code blocks. @default true */
  lineNumbers?: boolean;
};

// Base line classes string (merged without prefix for memoization)
const LINE_CLASSES_BASE = baseCn("block");

// Base line numbers class string (merged without prefix for memoization)
const LINE_NUMBER_CLASSES_BASE = baseCn(
  "block",
  "before:content-[counter(line)]",
  "before:inline-block",
  "before:[counter-increment:line]",
  "before:w-6",
  "before:mr-4",
  "before:text-[13px]",
  "before:text-right",
  "before:text-muted-foreground/50",
  "before:font-mono",
  "before:select-none"
);

/**
 * Parse a CSS declarations string (e.g. Shiki's rootStyle) into a style object.
 * This extracts CSS custom properties like --shiki-dark-bg from Shiki's dual theme output.
 */
const parseRootStyle = (rootStyle: string): Record<string, string> => {
  const style: Record<string, string> = {};
  for (const decl of rootStyle.split(";")) {
    const idx = decl.indexOf(":");
    if (idx > 0) {
      const prop = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (prop && val) {
        style[prop] = val;
      }
    }
  }
  return style;
};

export const CodeBlockBody = memo(
  ({
    children,
    result,
    language,
    className,
    maxHeight,
    startLine,
    lineNumbers = true,
    ...rest
  }: CodeBlockBodyProps) => {
    const cn = useCn();
    const { isAnimating } = useContext(StreamdownContext);
    const maxHeightStyle = resolveMaxHeight(maxHeight);
    const scrollRef = usePinnedScroll(
      isAnimating,
      Boolean(maxHeightStyle),
      result
    );

    // Prefix the pre-computed line number classes
    const lineNumberClasses = useMemo(() => cn(LINE_NUMBER_CLASSES_BASE), [cn]);

    // Prefix the base line classes string
    const baseLineClasses = useMemo(() => cn(LINE_CLASSES_BASE), [cn]);

    // Use CSS custom properties instead of direct inline styles so that
    // dark-mode Tailwind classes can override without !important.
    // This is necessary because !important syntax differs between Tailwind v3 and v4.
    const preStyle = useMemo(() => {
      const style: Record<string, string> = {};

      if (result.bg) {
        style["--sdm-bg"] = result.bg;
      }
      if (result.fg) {
        style["--sdm-fg"] = result.fg;
      }

      // Parse rootStyle for Shiki dark theme CSS variables (--shiki-dark-bg, etc.)
      if (result.rootStyle) {
        Object.assign(style, parseRootStyle(result.rootStyle));
      }

      return style as CSSProperties;
    }, [result.bg, result.fg, result.rootStyle]);

    return (
      <div
        className={cn(
          className,
          maxHeightStyle ? "overflow-y-auto" : null,
          "overflow-x-auto rounded-md border border-border bg-background p-4 text-sm"
        )}
        data-language={language}
        data-streamdown="code-block-body"
        ref={scrollRef}
        style={maxHeightStyle ? { maxHeight: maxHeightStyle } : undefined}
        {...rest}
      >
        <pre
          className={cn(
            className,
            "bg-[var(--sdm-bg,inherit)]",
            "dark:bg-[var(--shiki-dark-bg,var(--sdm-bg,inherit))]"
          )}
          style={preStyle}
        >
          <code
            className={
              lineNumbers
                ? cn("[counter-increment:line_0] [counter-reset:line]")
                : undefined
            }
            style={
              lineNumbers && startLine && startLine > 1
                ? { counterReset: `line ${startLine - 1}` }
                : undefined
            }
          >
            {result.tokens.map((row, index) => (
              <span
                className={lineNumbers ? lineNumberClasses : baseLineClasses}
                // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                key={index}
              >
                {row.length === 0 || (row.length === 1 && row[0].content === "")
                  ? // Empty line: insert newline to preserve copy behavior
                    "\n"
                  : // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: dual-theme token style mapping
                    row.map((token, tokenIndex) => {
                      // Shiki dual-theme tokens put direct CSS properties (color,
                      // background-color) into htmlStyle alongside CSS custom
                      // properties (--shiki-dark, etc). Direct properties as inline
                      // styles override the Tailwind class-based dark mode approach,
                      // so we redirect them to CSS custom properties instead.
                      const tokenStyle: Record<string, string> = {};
                      let hasBg = Boolean(token.bgColor);

                      if (token.color) {
                        tokenStyle["--sdm-c"] = token.color;
                      }
                      if (token.bgColor) {
                        tokenStyle["--sdm-tbg"] = token.bgColor;
                      }

                      if (token.htmlStyle) {
                        for (const [key, value] of Object.entries(
                          token.htmlStyle
                        )) {
                          if (key === "color") {
                            tokenStyle["--sdm-c"] = value;
                          } else if (key === "background-color") {
                            tokenStyle["--sdm-tbg"] = value;
                            hasBg = true;
                          } else {
                            tokenStyle[key] = value;
                          }
                        }
                      }

                      return (
                        <span
                          className={cn(
                            "text-[var(--sdm-c,inherit)]",
                            "dark:text-[var(--shiki-dark,var(--sdm-c,inherit))]",
                            hasBg && "bg-[var(--sdm-tbg)]",
                            hasBg &&
                              "dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg))]"
                          )}
                          // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                          key={tokenIndex}
                          style={tokenStyle as CSSProperties}
                          {...token.htmlAttrs}
                        >
                          {token.content}
                        </span>
                      );
                    })}
              </span>
            ))}
          </code>
        </pre>
      </div>
    );
  }
  // No custom comparator: React's default shallow comparison already compares
  // `result` by reference — the tokens are memoized upstream, so an unchanged
  // code string does not re-highlight — and, unlike a hand-written list of
  // props, it also covers whatever the caller forwards through CodeBlock.
);
