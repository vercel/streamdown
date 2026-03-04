"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const CopyButton = ({ code }: { code: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      toast.error("Clipboard API not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    }
  }, [code]);

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className="shrink-0"
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
    >
      <Icon size={14} />
    </Button>
  );
};
