import { useCallback, useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, XIcon } from "./icons";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock";
import { cn } from "./utils";

interface LinkSafetyModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LinkSafetyModal = ({
  url,
  isOpen,
  onClose,
  onConfirm,
}: LinkSafetyModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [url]);

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        unlockBodyScroll();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay"
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"
      data-streamdown="link-safety-modal"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
      <div
        className="relative mx-4 flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <button
          className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          onClick={onClose}
          title="Close"
          type="button"
        >
          <XIcon size={16} />
        </button>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <ExternalLinkIcon size={20} />
            <span>Open external link?</span>
          </div>
          <p className="text-muted-foreground text-sm">
            You're about to visit an external website.
          </p>
        </div>

        <div
          className={cn(
            "break-all rounded-md bg-muted p-3 font-mono text-sm",
            url.length > 100 && "max-h-32 overflow-y-auto"
          )}
        >
          {url}
        </div>

        <div className="flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 font-medium text-sm transition-all hover:bg-muted"
            onClick={handleCopy}
            type="button"
          >
            {copied ? (
              <>
                <CheckIcon size={14} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={14} />
                <span>Copy link</span>
              </>
            )}
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90"
            onClick={handleConfirm}
            type="button"
          >
            <ExternalLinkIcon size={14} />
            <span>Open link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
