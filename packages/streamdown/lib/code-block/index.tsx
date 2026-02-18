import { type HTMLAttributes, lazy, Suspense, useMemo } from "react";
import type { HighlightResult } from "../plugin-types";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";

const TRAILING_NEWLINES_REGEX = /\n+$/;

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  code: string;
  language: string;
  /** Whether the code block is still being streamed (incomplete) */
  isIncomplete?: boolean;
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
  ...rest
}: CodeBlockProps) => {
  // Remove trailing newlines to prevent empty line at end of code blocks
  const trimmedCode = useMemo(
    () => code.replace(TRAILING_NEWLINES_REGEX, ""),
    [code]
  );

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
          <div className="pointer-events-none sticky top-0 z-10 -mt-12 flex h-12 items-center justify-end px-4">
            <div
              className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-md bg-muted/80 px-1.5 py-1 supports-[backdrop-filter]:bg-muted/70 supports-[backdrop-filter]:backdrop-blur"
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
              result={raw}
              {...rest}
            />
          }
        >
          <HighlightedCodeBlockBody
            className={className}
            code={trimmedCode}
            language={language}
            raw={raw}
            {...rest}
          />
        </Suspense>
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};
