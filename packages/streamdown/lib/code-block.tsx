'use client';

import { CheckIcon, CopyIcon, BarChart3Icon } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useState,
} from 'react';
import { type BundledLanguage, type BundledTheme, codeToHtml } from 'shiki';
import { ShikiThemeContext } from '../index';
import { cn } from './utils';

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
};

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
});

export async function highlightCode(
  code: string,
  language: BundledLanguage,
  theme: BundledTheme
) {
  return await codeToHtml(code, {
    lang: language,
    theme,
  });
}

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('');
  const theme = useContext(ShikiThemeContext);

  useEffect(() => {
    let isMounted = true;

    highlightCode(code, language, theme).then((result) => {
      if (isMounted) {
        setHtml(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [code, language, theme]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div className="group relative">
        <div
          className={cn('overflow-x-auto', className)}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
          dangerouslySetInnerHTML={{ __html: html }}
          {...props}
        />
        {children}
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<'button'> & {
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
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      onError?.(new Error('Clipboard API not available'));
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
        'absolute top-2 right-2 shrink-0 rounded-md p-3 opacity-0 transition-all',
        'hover:bg-secondary group-hover:opacity-100',
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

export type CodeBlockRenderButtonProps = ComponentProps<'button'> & {
  onRender?: (code: string) => void;
};

export const CodeBlockRenderButton = ({
  onRender,
  children,
  className,
  ...props
}: CodeBlockRenderButtonProps) => {
  const { code } = useContext(CodeBlockContext);

  const handleRender = () => {
    onRender?.(code);
  };

  return (
    <button
      className={cn(
        'absolute top-2 right-12 shrink-0 rounded-md p-3 opacity-0 transition-all hover:bg-secondary group-hover:opacity-100',
        className
      )}
      onClick={handleRender}
      type="button"
      {...props}
    >
      {children || <BarChart3Icon size={14} />}
    </button>
  );
};
