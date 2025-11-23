import type { ComponentProps } from "react";
import type { BundledLanguage } from "shiki";
import { cn } from "../utils";

type CodeBlockContainerProps = ComponentProps<"div"> & {
  language: BundledLanguage;
};

export const CodeBlockContainer = ({
  className,
  language,
  style,
  ...props
}: CodeBlockContainerProps) => (
  <div
    className={cn(
      "my-4 w-full overflow-hidden rounded-xl border border-border",
      className
    )}
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
