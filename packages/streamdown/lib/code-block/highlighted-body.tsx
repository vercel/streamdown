import { type HTMLAttributes, useContext, useEffect, useState } from "react";
import type { BundledLanguage } from "shiki";
import { StreamdownContext } from "../../index";
import { useCodePlugin } from "../plugin-context";
import type { HighlightResult } from "../plugin-types";
import { CodeBlockBody } from "./body";

type HighlightedCodeBlockBodyProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  raw: HighlightResult;
  startLine?: number;
};

export const HighlightedCodeBlockBody = ({
  code,
  language,
  raw,
  className,
  startLine,
  ...rest
}: HighlightedCodeBlockBodyProps) => {
  const { shikiTheme } = useContext(StreamdownContext);
  const codePlugin = useCodePlugin();
  const [result, setResult] = useState<HighlightResult>(raw);

  useEffect(() => {
    if (!codePlugin) {
      setResult(raw);
      return;
    }

    const cachedResult = codePlugin.highlight(
      {
        code,
        language: language as BundledLanguage,
        themes: shikiTheme,
      },
      (highlightedResult) => {
        setResult(highlightedResult);
      }
    );

    if (cachedResult) {
      setResult(cachedResult);
    }
  }, [code, language, shikiTheme, codePlugin, raw]);

  return (
    <CodeBlockBody
      className={className}
      language={language}
      result={result}
      startLine={startLine}
      {...rest}
    />
  );
};
