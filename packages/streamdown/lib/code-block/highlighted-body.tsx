import { type HTMLAttributes, useContext, useEffect, useState } from "react";
import { StreamdownContext } from "../../index";
import { useCodePlugin } from "../plugin-context";
import type { BundledLanguage, HighlightResult } from "../plugin-types";
import { CodeBlockBody } from "./body";

type HighlightedCodeBlockBodyProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  isIncomplete?: boolean;
  language: string;
  maxHeight?: number | string;
  raw: HighlightResult;
  startLine?: number;
  lineNumbers?: boolean;
};

export const HighlightedCodeBlockBody = ({
  code,
  isIncomplete = false,
  language,
  maxHeight,
  raw,
  className,
  startLine,
  lineNumbers,
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

    // Ignore results for code this block has already moved past
    let current = true;
    const cachedResult = codePlugin.highlight(
      {
        code,
        isIncomplete,
        language: language as BundledLanguage,
        themes: shikiTheme,
      },
      (highlightedResult) => {
        if (current) {
          setResult(highlightedResult);
        }
      }
    );

    if (cachedResult) {
      setResult(cachedResult);
    }
    return () => {
      current = false;
    };
  }, [code, isIncomplete, language, shikiTheme, codePlugin, raw]);

  return (
    <CodeBlockBody
      className={className}
      language={language}
      lineNumbers={lineNumbers}
      maxHeight={maxHeight}
      result={result}
      startLine={startLine}
      {...rest}
    />
  );
};
