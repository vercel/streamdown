import {
  type HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode
} from "react";
import type { TokensResult } from "shiki";
import { StreamdownContext } from "../../index";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";
import { getHighlightedTokens } from "./highlight";

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  code: string;
  language: string;
  extraCodeHeader?: ReactNode
};

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  extraCodeHeader,
  ...rest
}: CodeBlockProps) => {
  const { shikiTheme, cdnUrl } = useContext(StreamdownContext);

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
    const cachedResult = getHighlightedTokens({
      code,
      language,
      shikiTheme,
      cdnUrl,
    });

    if (cachedResult) {
      // Already cached, use it immediately
      setResult(cachedResult);
      return;
    }

    // Not cached - reset to raw tokens while waiting for highlighting
    // This is critical for streaming: ensures we show current code, not stale tokens
    setResult(raw);

    // Subscribe to get highlighted tokens when ready
    getHighlightedTokens({
      code,
      language,
      shikiTheme,
      cdnUrl,
      callback: (highlightedResult) => {
        setResult(highlightedResult);
      },
    });
  }, [code, language, shikiTheme, cdnUrl, raw]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <CodeBlockContainer language={language}>
        <CodeBlockHeader extraComponent={extraCodeHeader} language={language}>{children}</CodeBlockHeader>
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
