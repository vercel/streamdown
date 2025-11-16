"use client";

import { track } from "@vercel/analytics";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

const CODE = "npx ai-elements@latest add message";
const TIMEOUT = 2000;

export const Installer = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE);
    toast.success("Copied to clipboard");
    setCopied(true);

    track("Copied installer command");
    setTimeout(() => {
      setCopied(false);
    }, TIMEOUT);
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <InputGroup className="min-w-64 font-mono shadow-none">
      <InputGroupAddon>
        <InputGroupText className="font-normal text-muted-foreground">
          $
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput readOnly value={CODE} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label="Copy"
          onClick={handleCopy}
          size="icon-xs"
          title="Copy"
        >
          <Icon className="size-3.5" size={14} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
