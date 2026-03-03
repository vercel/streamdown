import { useCn } from "../prefix-context";

interface CodeBlockHeaderProps {
  language: string;
}

export const CodeBlockHeader = ({ language }: CodeBlockHeaderProps) => {
  const cn = useCn();
  return (
    <div
      className={cn("flex h-8 items-center text-muted-foreground text-xs")}
      data-language={language}
      data-streamdown="code-block-header"
    >
      <span className={cn("ml-1 font-mono lowercase")}>{language}</span>
    </div>
  );
};
