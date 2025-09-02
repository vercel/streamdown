'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type BundledLanguage, type BundledTheme, codeToHtml } from 'shiki';
import { ShikiThemeContext } from '../index';
import { cn } from './utils';

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
  code: '',
});

export async function highlightCode(
  code: string,
  language: BundledLanguage,
  themes: [BundledTheme, BundledTheme],
  preClassName?: string
) {
  const addPreClass = (html: string) => {
    if (!preClassName) {
      return html;
    }
    return html.replace(PRE_TAG_REGEX, `<pre class="${preClassName}"$1`);
  };
  const [light, dark] = await Promise.all([
    codeToHtml(code, { lang: language, theme: themes[0] }),
    codeToHtml(code, { lang: language, theme: themes[1] }),
  ]);
  return [
    removePreBackground(addPreClass(light)),
    removePreBackground(addPreClass(dark)),
  ];
}

// Remove background styles from <pre> tags (inline style)
function removePreBackground(html: string) {
  return html.replace(
    /(<pre[^>]*)(style="[^"]*background[^";]*;?[^"]*")([^>]*>)/g,
    '$1$3'
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
  const [html, setHtml] = useState<string>('');
  const [darkHtml, setDarkHtml] = useState<string>('');
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
      <div className="my-4 w-full overflow-hidden rounded-xl border">
        <div className="flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs">
          <span className="ml-1 font-mono lowercase">{language}</span>
          <div>{children}</div>
        </div>
        <div className="w-full">
          <div className="min-w-full">
            <div
              className={cn('overflow-x-auto dark:hidden', className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: html }}
              {...rest}
            />
            <div
              className={cn('hidden overflow-x-auto dark:block', className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: darkHtml }}
              {...rest}
            />
          </div>
        </div>
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
  code: propCode,
  ...props
}: CodeBlockCopyButtonProps & { code?: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const contextCode = useContext(CodeBlockContext).code;
  const code = propCode ?? contextCode;

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
      className={cn('text-muted-foreground', 'p-1 transition-all', className)}
      onClick={copyToClipboard}
      type="button"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </button>
  );
};
