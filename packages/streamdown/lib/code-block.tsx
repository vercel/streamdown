"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { ShikiThemeContext } from "../index";
import { cn } from "./utils";

const PRE_TAG_REGEX = /<pre(\s|>)/;

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  preClassName?: string;
};

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

class HighlighterManager {
  private lightHighlighter: Awaited<
    ReturnType<typeof createHighlighter>
  > | null = null;
  private darkHighlighter: Awaited<
    ReturnType<typeof createHighlighter>
  > | null = null;
  private lightTheme: BundledTheme | null = null;
  private darkTheme: BundledTheme | null = null;
  private readonly loadedLanguages: Set<BundledLanguage> = new Set();
  private initializationPromise: Promise<void> | null = null;

  private async ensureHighlightersInitialized(
    themes: [BundledTheme, BundledTheme],
    language: BundledLanguage
  ): Promise<void> {
    const [lightTheme, darkTheme] = themes;
    const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

    // Check if we need to recreate highlighters due to theme change
    const needsLightRecreation =
      !this.lightHighlighter || this.lightTheme !== lightTheme;
    const needsDarkRecreation =
      !this.darkHighlighter || this.darkTheme !== darkTheme;

    if (needsLightRecreation || needsDarkRecreation) {
      // If themes changed, reset loaded languages
      this.loadedLanguages.clear();
    }

    // Check if we need to load the language
    const needsLanguageLoad = !this.loadedLanguages.has(language);

    // Create or recreate light highlighter if needed
    if (needsLightRecreation) {
      this.lightHighlighter = await createHighlighter({
        themes: [lightTheme],
        langs: [language],
        engine: jsEngine,
      });
      this.lightTheme = lightTheme;
      this.loadedLanguages.add(language);
    } else if (needsLanguageLoad) {
      // Load the language if not already loaded
      await this.lightHighlighter?.loadLanguage(language);
    }

    // Create or recreate dark highlighter if needed
    if (needsDarkRecreation) {
      // If recreating dark highlighter, load all previously loaded languages plus the new one
      const langsToLoad = needsLanguageLoad
        ? [...this.loadedLanguages, language]
        : Array.from(this.loadedLanguages);

      this.darkHighlighter = await createHighlighter({
        themes: [darkTheme],
        langs: langsToLoad.length > 0 ? langsToLoad : [language],
        engine: jsEngine,
      });
      this.darkTheme = darkTheme;
    } else if (needsLanguageLoad) {
      // Load the language if not already loaded
      await this.darkHighlighter?.loadLanguage(language);
    }

    // Mark language as loaded after both highlighters have it
    if (needsLanguageLoad) {
      this.loadedLanguages.add(language);
    }
  }

  async highlightCode(
    code: string,
    language: BundledLanguage,
    themes: [BundledTheme, BundledTheme],
    preClassName?: string
  ): Promise<[string, string]> {
    // Ensure only one initialization happens at a time
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    // Initialize or load language
    this.initializationPromise = this.ensureHighlightersInitialized(
      themes,
      language
    );
    await this.initializationPromise;
    this.initializationPromise = null;

    const addPreClass = (html: string) => {
      if (!preClassName) {
        return html;
      }
      return html.replace(PRE_TAG_REGEX, `<pre class="${preClassName}"$1`);
    };

    const [lightTheme, darkTheme] = themes;

    const light = this.lightHighlighter?.codeToHtml(code, {
      lang: language,
      theme: lightTheme,
    });
    const dark = this.darkHighlighter?.codeToHtml(code, {
      lang: language,
      theme: darkTheme,
    });

    return [
      removePreBackground(addPreClass(light)),
      removePreBackground(addPreClass(dark)),
    ];
  }
}

// Create a singleton instance of the highlighter manager
const highlighterManager = new HighlighterManager();

export async function highlightCode(
  code: string,
  language: BundledLanguage,
  themes: [BundledTheme, BundledTheme],
  preClassName?: string
) {
  return highlighterManager.highlightCode(code, language, themes, preClassName);
}

// Remove background styles from <pre> tags (inline style)
function removePreBackground(html: string) {
  return html.replace(
    /(<pre[^>]*)(style="[^"]*background[^";]*;?[^"]*")([^>]*>)/g,
    "$1$3"
  );
}

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
  const mounted = useRef(false);
  const [lightTheme, darkTheme] = useContext(ShikiThemeContext);

  useEffect(() => {
    mounted.current = true;

    highlightCode(code, language, [lightTheme, darkTheme], preClassName).then(
      ([light, dark]) => {
        if (mounted.current) {
          setHtml(light);
          setDarkHtml(dark);
        }
      }
    );

    return () => {
      mounted.current = false;
    };
  }, [code, language, lightTheme, darkTheme, preClassName]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className="my-4 w-full overflow-hidden rounded-xl border"
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
              dangerouslySetInnerHTML={{ __html: html }}
              data-code-block
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              data-language={language}
              {...rest}
            />
            <div
              className={cn("hidden overflow-x-auto dark:block", className)}
              dangerouslySetInnerHTML={{ __html: darkHtml }}
              data-code-block
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              data-language={language}
              {...rest}
            />
          </div>
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<"button"> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export type CodeBlockDownloadButtonProps = ComponentProps<"button"> & {
  onDownload?: () => void;
  onError?: (error: Error) => void;
};

export const CodeBlockDownloadButton = ({
  onDownload,
  onError,
  children,
  className,
  code: propCode,
  ...props
}: CodeBlockDownloadButtonProps & { code?: string }) => {
  const contextCode = useContext(CodeBlockContext).code;
  const code = propCode ?? contextCode;

  const downloadCode = async () => {
    if (typeof window === "undefined") {
      onError?.(new Error("Download not available"));
      return;
    }

    try {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onDownload?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <button
      className={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all",
        className
      )}
      onClick={downloadCode}
      title="Download file"
      type="button"
      {...props}
    >
      {children ?? <DownloadIcon size={14} />}
    </button>
  );
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  code: propCode,
  ...props
}: CodeBlockCopyButtonProps & { code?: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(0);
  const contextCode = useContext(CodeBlockContext).code;
  const code = propCode ?? contextCode;

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      if (!isCopied) {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        onCopy?.();
        timeoutRef.current = window.setTimeout(
          () => setIsCopied(false),
          timeout
        );
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <button
      className={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all",
        className
      )}
      onClick={copyToClipboard}
      type="button"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </button>
  );
};
