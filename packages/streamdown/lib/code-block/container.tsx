import type { ComponentProps } from "react";
import { useCn } from "../prefix-context";

type CodeBlockContainerProps = ComponentProps<"div"> & {
  language: string;
  /** Whether the code block is still being streamed (incomplete) */
  isIncomplete?: boolean;
};

export const CodeBlockContainer = ({
  className,
  language,
  style,
  isIncomplete,
  ...props
}: CodeBlockContainerProps) => {
  const cn = useCn();
  return (
    <div
      className={cn(
        "relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
        className
      )}
      data-incomplete={isIncomplete || undefined}
      data-language={language}
      data-streamdown="code-block"
      style={{
        // Use content-visibility to skip rendering off-screen blocks
        // This can significantly improve performance for large documents
        contentVisibility: "auto",
        // Provide a hint for layout to prevent layout shifts
        containIntrinsicSize: "auto 200px",
        ...style,
      }}
      {...props}
    />
  );
};
