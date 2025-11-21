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
import { createShiki } from "./highlight";

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
  const [result, setResult] = useState<TokensResult | null>(null);

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

  // Combine both effects into one to reduce re-renders
  useEffect(() => {
    let cancelled = false;

    createShiki(language, shikiTheme)
      .then((highlighter) => {
        if (cancelled) {
          return;
        }

        const newResult = highlighter.codeToTokens(code, {
          lang: language,
          themes: {
            light: shikiTheme[0],
            dark: shikiTheme[1],
          },
        });

        if (!cancelled) {
          setResult(newResult);
        }
      })
      .catch((error) => {
        // Silently fail and use raw tokens
        console.error("Failed to highlight code:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [code, language, shikiTheme]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <CodeBlockContainer language={language}>
        <CodeBlockHeader language={language}>{children}</CodeBlockHeader>
        <CodeBlockBody
          className={className}
          language={language}
          result={result ?? raw}
          {...rest}
        />
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};
