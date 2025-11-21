import { type ComponentProps, useId } from "react";
import type { BundledLanguage, TokensResult } from "shiki";
import { cn } from "../utils";

type CodeBlockBodyProps = ComponentProps<"pre"> & {
  result: TokensResult;
  language: BundledLanguage;
};

export const CodeBlockBody = ({
  children,
  result,
  language,
  className,
  ...rest
}: CodeBlockBodyProps) => {
  const id = useId();

  return (
    <pre
      className={cn(className, "p-4 text-sm")}
      data-code-block
      data-language={language}
      style={{
        backgroundColor: result.bg,
        color: result.fg,
      }}
      {...rest}
    >
      <code className="[counter-increment:line_0] [counter-reset:line]">
        {result.tokens.map((row, index) => (
          <span
            className={cn(
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
            )}
            // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
            key={`${id}-row-${index}`}
          >
            {row.map((token, tokenIndex) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: "This is a stable key."
                key={`${id}-row-${index}-token-${tokenIndex}`}
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
};
