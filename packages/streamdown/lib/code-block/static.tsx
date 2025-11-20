import {
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { BundledLanguage } from "shiki";
import { StreamdownContext } from "../../index";
import { cn } from "../utils";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";
import { highlighterManager } from "./highlight-manager";
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
  const { shikiTheme } = useContext(StreamdownContext);
  const [lightTheme, darkTheme] = shikiTheme;
  const [html, setHtml] = useState<string>(createPlainHtml(code, preClassName));
  const mounted = useRef(false);

  useEffect(() => {
    highlighterManager.initializeHighlighters([lightTheme, darkTheme]);
  }, [lightTheme, darkTheme]);

  useEffect(() => {
    mounted.current = true;

    highlighterManager
      .highlightCode(code, language, preClassName)
      .then((highlightedHtml) => {
        if (mounted.current) {
          setHtml(highlightedHtml);
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
              className={cn("overflow-x-auto", className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: html }}
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
