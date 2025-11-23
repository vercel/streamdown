import { type ComponentProps, memo, useMemo } from "react";
import type { BundledLanguage, TokensResult } from "shiki";
import { cn } from "../utils";

type CodeBlockBodyProps = ComponentProps<"pre"> & {
  result: TokensResult;
  language: BundledLanguage;
};

// Memoize line numbers class string since it's constant
const LINE_NUMBER_CLASSES = cn(
  "block",
  "before:content-[counter(line)]",
  "before:inline-block",
  "before:[counter-increment:line]",
  "before:w-4",
  "before:mr-4",
  "before:text-[13px]",
  "before:text-right",
  "before:text-muted-foreground/50",
  "before:font-mono",
  "before:select-none"
);

export const CodeBlockBody = memo(
  ({ children, result, language, className, ...rest }: CodeBlockBodyProps) => {
    // Memoize the pre style object
    const preStyle = useMemo(
      () => ({
        backgroundColor: result.bg,
        color: result.fg,
      }),
      [result.bg, result.fg]
    );

    return (
      <pre
        className={cn(className, "p-4 text-sm dark:bg-(--shiki-dark-bg)!")}
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
                  className="dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)!"
                  // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                  key={tokenIndex}
                  style={{
                    color: token.color,
                    backgroundColor: token.bgColor,
                    ...token.htmlStyle,
                  }}
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
