import { type HTMLAttributes, useContext, useEffect, useState } from "react";
import type { BundledLanguage, Highlighter, TokensResult } from "shiki";
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
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    if (highlighter) {
      return;
    }

    createShiki(language, shikiTheme).then(setHighlighter);
  }, [language, shikiTheme, highlighter]);

  useEffect(() => {
    let cancelled = false;

    if (!highlighter) {
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

    return () => {
      cancelled = true;
    };
  }, [code, highlighter, shikiTheme, language]);

  const raw: TokensResult = {
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
  };

  console.log("result", result);

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
