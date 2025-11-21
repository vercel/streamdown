import type { ComponentProps } from "react";
import type { BundledLanguage } from "shiki";
import { cn } from "../utils";

type CodeBlockContainerProps = ComponentProps<"div"> & {
  language: BundledLanguage;
};

export const CodeBlockContainer = ({
  className,
  language,
  ...props
}: CodeBlockContainerProps) => (
  <div
    className={cn(
      "my-4 w-full overflow-hidden rounded-xl border border-border",
      className
    )}
    data-code-block-container
    data-language={language}
    {...props}
  />
);
