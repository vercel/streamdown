import { type ComponentProps, type CSSProperties, memo, useMemo } from "react";
import type { HighlightResult } from "../plugin-types";
import { cn } from "../utils";

type CodeBlockBodyProps = ComponentProps<"pre"> & {
  result: HighlightResult;
  language: string;
};

// Memoize line numbers class string since it's constant
const LINE_NUMBER_CLASSES = cn(
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
  ({ children, result, language, className, ...rest }: CodeBlockBodyProps) => {
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
      <pre
        className={cn(
          className,
          "p-4 text-sm",
          "bg-[var(--sdm-bg,transparent)]",
          "dark:bg-[var(--shiki-dark-bg,var(--sdm-bg,transparent))]"
        )}
        data-language={language}
        data-streamdown="code-block-body"
        style={preStyle}
        {...rest}
      >
        <code className="[counter-increment:line_0] [counter-reset:line]">
          {result.tokens.map((row, index) => (
            <span
              className={LINE_NUMBER_CLASSES}
              // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
              key={index}
            >
              {row.map((token, tokenIndex) => (
                <span
                  className={cn(
                    "text-[var(--sdm-c,inherit)]",
                    "dark:text-[var(--shiki-dark,var(--sdm-c,inherit))]",
                    token.bgColor && "bg-[var(--sdm-tbg)]",
                    token.bgColor &&
                      "dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg))]"
                  )}
                  // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                  key={tokenIndex}
                  style={
                    {
                      ...(token.color ? { "--sdm-c": token.color } : {}),
                      ...(token.bgColor ? { "--sdm-tbg": token.bgColor } : {}),
                      ...token.htmlStyle,
                    } as CSSProperties
                  }
                  {...token.htmlAttrs}
                >
                  {token.content}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if result tokens actually changed
    return (
      prevProps.result === nextProps.result &&
      prevProps.language === nextProps.language &&
      prevProps.className === nextProps.className
    );
  }
);
