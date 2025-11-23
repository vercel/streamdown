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
};

export const CodeBlock = ({
  code,
  language,
  className,
  children,
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

  // Use raw as initial state
  const [result, setResult] = useState<TokensResult>(raw);

  // Try to get cached result or subscribe to highlighting
  useEffect(() => {
    const cachedResult = getHighlightedTokens(code, language, shikiTheme);

    if (cachedResult) {
      // Already cached, use it immediately
      setResult(cachedResult);
      return;
    }

    // Not cached, subscribe to updates
    getHighlightedTokens(code, language, shikiTheme, (highlightedResult) => {
      setResult(highlightedResult);
    });
  }, [code, language, shikiTheme]);

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
