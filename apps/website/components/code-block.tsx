"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
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
  bundledLanguages,
  getSingletonHighlighter,
  type BundledLanguage,
  type Highlighter,
  type SpecialLanguage,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { useShikiHighlighter } from "react-shiki";
import { cn } from "@/lib/utils";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
};

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

// Get singleton highlighter with JavaScript engine (PR #77)
async function getWebsiteHighlighter(
  lang: BundledLanguage | SpecialLanguage
): Promise<Highlighter> {
  const highlighter = await getSingletonHighlighter({
    themes: ["github-light", "github-dark"],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });

  // Load the language if it's a bundled language
  if (lang !== "text" && Object.hasOwn(bundledLanguages, lang)) {
    const loadedLanguages = highlighter.getLoadedLanguages();
    if (!loadedLanguages.includes(lang)) {
      await highlighter.loadLanguage(lang as BundledLanguage);
    }
  }

  return highlighter;
}

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [highlighter, setHighlighter] = useState<Highlighter | undefined>(
    undefined
  );
  const mounted = useRef(false);

  // Check if language is supported
  const isLanguageSupported = (lang: string): lang is BundledLanguage => {
    return Object.hasOwn(bundledLanguages, lang);
  };

  const langToUse = isLanguageSupported(language)
    ? language
    : ("text" as SpecialLanguage);

  useEffect(() => {
    mounted.current = true;
    getWebsiteHighlighter(langToUse).then((h) => {
      if (mounted.current) {
        setHighlighter(h);
      }
    });

    return () => {
      mounted.current = false;
    };
  }, [langToUse]);

  // Use react-shiki with singleton highlighter
  const html = useShikiHighlighter(
    code,
    langToUse,
    { light: "github-light", dark: "github-dark" },
    {
      highlighter,
      defaultColor: "light-dark()",
      outputFormat: "html",
    }
  );

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div className="group relative">
        <div
          className={cn("overflow-x-auto [&>pre]:bg-transparent!", className)}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
          dangerouslySetInnerHTML={{ __html: (html as string) || "" }}
          {...props}
        />
        {children}
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<"button"> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <button
      className={cn(
        "absolute top-2 right-2 shrink-0 rounded-md p-3 opacity-0 transition-all",
        "hover:bg-secondary group-hover:opacity-100",
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
