import {
  type HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { BundledLanguage, TokensResult } from "shiki";
import { StreamdownContext } from "../../index";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";
import { getHighlightedTokens } from "./highlight";

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  code: string;
  language: BundledLanguage;
  preClassName?: string;
};

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  preClassName,
  ...rest
}: CodeBlockProps) => {
  const { shikiTheme } = useContext(StreamdownContext);

  // Memoize the raw fallback tokens to avoid recomputing on every render
  const raw: TokensResult = useMemo(
    () => ({
      bg: "transparent",
      fg: "inherit",
      tokens: code.split("\n").map((line) => [
        {
          content: line,
          color: "inherit",
          bgColor: "transparent",
          htmlStyle: {},
          offset: 0,
        },
      ]),
    }),
    [code]
  );

  // Try to get cached result immediately
  const cachedResult = useMemo(
    () => getHighlightedTokens(code, language, shikiTheme),
    [code, language, shikiTheme]
  );

  // Use cached result if available, otherwise use raw
  const [result, setResult] = useState<TokensResult>(cachedResult || raw);

  // Subscribe to highlighting updates only if not cached
  useEffect(() => {
    if (cachedResult) {
      // Already cached, use it immediately
      setResult(cachedResult);
      return;
    }

    // Not cached, subscribe to updates
    getHighlightedTokens(code, language, shikiTheme, (highlightedResult) => {
      setResult(highlightedResult);
    });
  }, [code, language, shikiTheme, cachedResult]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <CodeBlockContainer language={language}>
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
