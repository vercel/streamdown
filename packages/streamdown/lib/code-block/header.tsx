import type { ReactNode } from "react";

type CodeBlockHeaderProps = {
  language: string;
  children: ReactNode;
};

export const CodeBlockHeader = ({
  language,
  children,
}: CodeBlockHeaderProps) => (
  <div
    className="flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs"
    data-language={language}
    data-streamdown="code-block-header"
  >
    <span className="ml-1 font-mono lowercase">{language}</span>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);
