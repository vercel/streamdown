'use client';

import { track } from '@vercel/analytics/react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const CODE = 'npx ai-elements add response';
const CODE_SM = 'npx ai-elements@latest add response';
const TIMEOUT = 2000;

export const Installer = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(CODE);
      setIsCopied(true);
      track('Copied installer code');
      setTimeout(() => setIsCopied(false), TIMEOUT);
    } catch (error) {
      console.error(error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <div className="dark w-fit">
      <div className="relative flex items-center gap-3 rounded-md border bg-background p-0.5 text-foreground">
        <pre className="block w-full py-2 pl-3 text-sm sm:hidden">{CODE}</pre>
        <pre className="hidden w-full py-2 pl-3 text-sm sm:block">
          {CODE_SM}
        </pre>
        <Button
          className="rounded-sm"
          onClick={copyToClipboard}
          size="icon"
          variant="ghost"
        >
          <Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
