import { type HTMLAttributes, lazy, Suspense, useMemo } from "react";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";

const trimTrailingNewlines = (str: string): string => {
  let end = str.length;
  while (end > 0 && str[end - 1] === "\n") {
    end--;
  }
  return str.slice(0, end);
};

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  /** Whether the code block is still being streamed (incomplete) */
  isIncomplete?: boolean;
  /** Custom starting line number for line numbering (default: 1) */
  startLine?: number;
  /** Show line numbers in code blocks. @default true */
  lineNumbers?: boolean;
};

const HighlightedCodeBlockBody = lazy(() =>
  import("./highlighted-body").then((mod) => ({
    default: mod.HighlightedCodeBlockBody,
  }))
);

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  isIncomplete = false,
  startLine,
  lineNumbers,
  ...rest
}: CodeBlockProps) => {
  const cn = useCn();
  // Remove trailing newlines to prevent empty line at end of code blocks
  const trimmedCode = useMemo(() => trimTrailingNewlines(code), [code]);

  // Memoize the raw fallback tokens to avoid recomputing on every render
  const raw: HighlightResult = useMemo(
    () => ({
      bg: "transparent",
      fg: "inherit",
      tokens: trimmedCode.split("\n").map((line) => [
        {
          content: line,
          color: "inherit",
          bgColor: "transparent",
          htmlStyle: {},
          offset: 0,
        },
      ]),
    }),
    [trimmedCode]
  );

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <CodeBlockContainer isIncomplete={isIncomplete} language={language}>
        <CodeBlockHeader language={language} />
        {children ? (
          <div
            className={cn(
              "pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end"
            )}
          >
            <div
              className={cn(
                "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
              )}
              data-streamdown="code-block-actions"
            >
              {children}
            </div>
          </div>
        ) : null}
        <Suspense
          fallback={
            <CodeBlockBody
              className={className}
              language={language}
              lineNumbers={lineNumbers}
              result={raw}
              startLine={startLine}
              {...rest}
            />
          }
        >
          <HighlightedCodeBlockBody
            className={className}
            code={trimmedCode}
            language={language}
            lineNumbers={lineNumbers}
            raw={raw}
            startLine={startLine}
            {...rest}
          />
        </Suspense>
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};
