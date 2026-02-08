import {
  type HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BundledLanguage } from "shiki";
import { StreamdownContext } from "../../index";
import { useCodePlugin } from "../plugin-context";
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

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  isIncomplete = false,
  ...rest
}: CodeBlockProps) => {
  const { shikiTheme } = useContext(StreamdownContext);
  const codePlugin = useCodePlugin();

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

  // Use raw as initial state
  const [result, setResult] = useState<HighlightResult>(raw);

  // Try to get cached result or subscribe to highlighting
  useEffect(() => {
    // If no code plugin, just use raw tokens (plain text)
    if (!codePlugin) {
      setResult(raw);
      return;
    }

    const cachedResult = codePlugin.highlight(
      {
        code: trimmedCode,
        language: language as BundledLanguage,
        themes: shikiTheme,
      },
      (highlightedResult) => {
        setResult(highlightedResult);
      }
    );

    if (cachedResult) {
      // Already cached, use it immediately
      setResult(cachedResult);
      return;
    }

    // Not cached - reset to raw tokens while waiting for highlighting
    // This is critical for streaming: ensures we show current code, not stale tokens
    setResult(raw);
  }, [trimmedCode, language, shikiTheme, codePlugin, raw]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <CodeBlockContainer isIncomplete={isIncomplete} language={language}>
        <CodeBlockHeader language={language}>{children}</CodeBlockHeader>
        <CodeBlockBody
          className={className}
          language={language}
          result={result}
          {...rest}
        />
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};
