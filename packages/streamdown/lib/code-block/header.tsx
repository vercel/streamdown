import type { ReactNode } from "react";

interface CodeBlockHeaderProps {
  language: string;
  children: ReactNode;
  extraComponent: ReactNode
};

export const CodeBlockHeader = ({
  language,
  children,
  extraComponent
}: CodeBlockHeaderProps) => (
  <div
    className="flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs"
    data-language={language}
    data-streamdown="code-block-header"
  >
    <span className="ml-1 font-mono lowercase">{language}</span>
    <div className="flex items-center gap-2">
      {extraComponent}
      {children}
      </div>
  </div>
);
