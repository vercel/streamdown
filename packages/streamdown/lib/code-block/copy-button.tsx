import {
  type ComponentProps,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { useCodeBlockContext } from "./context";

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
  code: propCode,
  ...props
}: CodeBlockCopyButtonProps & { code?: string }) => {
  const cn = useCn();
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(0);
  const { code: contextCode } = useCodeBlockContext();
  const { isAnimating } = useContext(StreamdownContext);
  const t = useTranslations();
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

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const icons = useIcons();
  const Icon = isCopied ? icons.CheckIcon : icons.CopyIcon;

  return (
    <button
      aria-label={t.copyCode}
      className={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-streamdown="code-block-copy-button"
      disabled={isAnimating}
      onClick={copyToClipboard}
      title={t.copyCode}
      type="button"
      {...props}
    >
      {children ?? <Icon aria-hidden="true" size={14} />}
    </button>
  );
};
