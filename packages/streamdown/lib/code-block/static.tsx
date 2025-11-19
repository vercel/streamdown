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
import { CodeBlockHeader } from "./header";
import { performHighlight } from "./highlighter";
import { escapeHtml } from "./utils";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  preClassName?: string;
};

const createPlainHtml = (code: string, className?: string) => {
  const escapedCode = escapeHtml(code);

  return `<pre class="${className || ""}"><code>${escapedCode}</code></pre>`;
};

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  preClassName,
  ...rest
}: CodeBlockProps) => {
  const [lightTheme, darkTheme] = useContext(ShikiThemeContext);
  const [html, setHtml] = useState<string>(createPlainHtml(code, preClassName));
  const [darkHtml, setDarkHtml] = useState<string>(
    createPlainHtml(code, preClassName)
  );
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    performHighlight(code, language, lightTheme, darkTheme, preClassName)
      .then(([light, dark]) => {
        if (mounted.current) {
          setHtml(light);
          setDarkHtml(dark);
        }
      })
      .catch((err) => {
        // Silently ignore AbortError
        if (err.name !== "AbortError") {
          throw err;
        }
      });

    return () => {
      mounted.current = false;
    };
  }, [code, language, preClassName, lightTheme, darkTheme]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className="my-4 w-full overflow-hidden rounded-xl border border-border"
        data-code-block-container
        data-language={language}
      >
        <CodeBlockHeader language={language}>{children}</CodeBlockHeader>
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
