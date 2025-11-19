"use client";

import {
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { BundledLanguage } from "shiki";
import { ShikiThemeContext } from "../../index";
import { cn } from "../utils";
import { CodeBlockContext } from "./context";
import { highlighterManager } from "./highlight-manager";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
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
  const [html, setHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");
  const [lastHighlightedCode, setLastHighlightedCode] = useState("");
  const mounted = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [lightTheme, darkTheme] = useContext(ShikiThemeContext);

  useEffect(() => {
    highlighterManager.initializeHighlighters([lightTheme, darkTheme]);
  }, [lightTheme, darkTheme]);

  useEffect(() => {
    mounted.current = true;

    // Cancel previous highlight operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (code && code !== lastHighlightedCode) {
      highlighterManager
        .highlightCode(code, language, preClassName, signal)
        .then(([light, dark]) => {
          if (mounted.current && !signal.aborted) {
            setHtml(light);
            setDarkHtml(dark);
            setLastHighlightedCode(code);
          }
        })
        .catch((err) => {
          // Silently ignore AbortError
          if (err.name !== "AbortError") {
            throw err;
          }
        });
    }

    return () => {
      mounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, [code, language, preClassName, lastHighlightedCode]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className="my-4 w-full overflow-hidden rounded-xl border border-border"
        data-code-block-container
        data-language={language}
      >
        <div
          className="flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs"
          data-code-block-header
          data-language={language}
        >
          <span className="ml-1 font-mono lowercase">{language}</span>
          <div className="flex items-center gap-2">{children}</div>
        </div>
        <div className="w-full">
          <div className="min-w-full">
            <div
              className={cn("overflow-x-auto dark:hidden", className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: html }}
              data-code-block
              data-language={language}
              {...rest}
            />
            <div
              className={cn("hidden overflow-x-auto dark:block", className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: darkHtml }}
              data-code-block
              data-language={language}
              {...rest}
            />
          </div>
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};
