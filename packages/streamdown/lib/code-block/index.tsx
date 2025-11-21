import { type HTMLAttributes, useContext, useEffect, useState } from "react";
import { type BundledLanguage, codeToTokens, type TokensResult } from "shiki";
import { StreamdownContext } from "../../index";
import { CodeBlockBody } from "./body";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";

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

  useEffect(() => {
    let cancelled = false;

    codeToTokens(code, {
      lang: language,
      themes: {
        light: shikiTheme[0],
        dark: shikiTheme[1],
      },
    }).then((newResult) => {
      if (!cancelled) {
        setResult(newResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, shikiTheme]);

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

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className="my-4 w-full overflow-hidden rounded-xl border border-border"
        data-code-block-container
        data-language={language}
      >
        <CodeBlockHeader language={language}>{children}</CodeBlockHeader>
        <CodeBlockBody
          className={className}
          language={language}
          result={result ?? raw}
          {...rest}
        />
      </div>
    </CodeBlockContext.Provider>
  );
};
