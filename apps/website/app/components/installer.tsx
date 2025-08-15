'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const CODE = 'npm i streamdown';
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
      setTimeout(() => setIsCopied(false), TIMEOUT);
    } catch (error) {
      console.error(error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <div className="relative flex items-center gap-3 rounded-lg border px-0.5">
      <pre className="w-full py-2 pl-3">{CODE}</pre>
      <Button onClick={copyToClipboard} size="icon" variant="ghost">
        <Icon className="h-4 w-4" />
      </Button>
    </div>
  );
};
