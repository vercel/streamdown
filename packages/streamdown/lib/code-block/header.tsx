interface CodeBlockHeaderProps {
  language: string;
}

export const CodeBlockHeader = ({ language }: CodeBlockHeaderProps) => (
  <div
    className="flex h-12 items-center bg-muted/80 px-4 text-muted-foreground text-xs"
    data-language={language}
    data-streamdown="code-block-header"
  >
    <span className="ml-1 font-mono lowercase">{language}</span>
  </div>
);
