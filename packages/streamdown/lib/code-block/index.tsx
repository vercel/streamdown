import {
  type HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TokensResult } from "shiki";
import { StreamdownContext } from "../../index";
import { useShikiPlugin } from "../plugin-context";
import { CodeBlockBody } from "./body";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  code: string;
  language: string;
};

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  ...rest
}: CodeBlockProps) => {
  const { shikiTheme } = useContext(StreamdownContext);
  const shikiPlugin = useShikiPlugin();

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
    // If no shiki plugin, just use raw tokens (plain text)
    if (!shikiPlugin) {
      setResult(raw);
      return;
    }

    const cachedResult = shikiPlugin.highlight(
      {
        code,
        language,
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
  }, [code, language, shikiTheme, shikiPlugin, raw]);

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
