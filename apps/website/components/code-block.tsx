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
import { type BundledLanguage, codeToHtml } from "shiki";
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

export async function highlightCode(code: string, language: BundledLanguage) {
  return Promise.all([
    await codeToHtml(code, {
      lang: language,
      theme: "github-light",
    }),
    await codeToHtml(code, {
      lang: language,
      theme: "github-dark",
    }),
  ]);
}

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");
  const mounted = useRef(false);

  useEffect(() => {
    highlightCode(code, language).then(([light, dark]) => {
      if (!mounted.current) {
        setHtml(light);
        setDarkHtml(dark);
        mounted.current = true;
      }
    });

    return () => {
      mounted.current = false;
    };
  }, [code, language]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div className="group relative">
        <div
          className={cn(
            "overflow-x-auto dark:hidden [&>pre]:bg-transparent!",
            className
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
          dangerouslySetInnerHTML={{ __html: html }}
          {...props}
        />
        <div
          className={cn(
            "hidden overflow-x-auto dark:block [&>pre]:bg-transparent!",
            className
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
          dangerouslySetInnerHTML={{ __html: darkHtml }}
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
