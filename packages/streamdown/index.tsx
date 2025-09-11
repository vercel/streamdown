"use client";

import { createContext, memo, useId, useMemo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { BundledTheme } from "shiki";
import "katex/dist/katex.min.css";
import hardenReactMarkdownImport from "harden-react-markdown";
import type { Options as RemarkGfmOptions } from "remark-gfm";
import type { Options as RemarkMathOptions } from "remark-math";
import type { MermaidConfig } from "mermaid";
import { components as defaultComponents } from "./lib/components";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { parseIncompleteMarkdown } from "./lib/parse-incomplete-markdown";
import { cn } from "./lib/utils";

export type { MermaidConfig } from "mermaid";

type HardenReactMarkdownProps = Options & {
  defaultOrigin?: string;
  allowedLinkPrefixes?: string[];
  allowedImagePrefixes?: string[];
};

// Handle both ESM and CJS imports
const hardenReactMarkdown =
  // biome-ignore lint/suspicious/noExplicitAny: "this is needed."
  (hardenReactMarkdownImport as any).default || hardenReactMarkdownImport;

// Create a hardened version of ReactMarkdown
const HardenedMarkdown: ReturnType<typeof hardenReactMarkdown> =
  hardenReactMarkdown(ReactMarkdown);

export type StreamdownProps = HardenReactMarkdownProps & {
  parseIncompleteMarkdown?: boolean;
  className?: string;
  shikiTheme?: [BundledTheme, BundledTheme];
  mermaidConfig?: MermaidConfig;
};

export const ShikiThemeContext = createContext<[BundledTheme, BundledTheme]>([
  "github-light" as BundledTheme,
  "github-dark" as BundledTheme,
]);

export const MermaidConfigContext = createContext<MermaidConfig | undefined>(undefined);

type BlockProps = HardenReactMarkdownProps & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
};

const remarkMathOptions: RemarkMathOptions = {
  singleDollarTextMath: false,
};

const remarkGfmOptions: RemarkGfmOptions = {};

const Block = memo(
  ({ content, shouldParseIncompleteMarkdown, ...props }: BlockProps) => {
    const parsedContent = useMemo(
      () =>
        typeof content === "string" && shouldParseIncompleteMarkdown
          ? parseIncompleteMarkdown(content.trim())
          : content,
      [content, shouldParseIncompleteMarkdown]
    );

    return <HardenedMarkdown {...props}>{parsedContent}</HardenedMarkdown>;
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

Block.displayName = "Block";

export const Streamdown = memo(
  ({
    children,
    allowedImagePrefixes = ["*"],
    allowedLinkPrefixes = ["*"],
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    components,
    rehypePlugins,
    remarkPlugins,
    className,
    shikiTheme = ["github-light", "github-dark"],
    mermaidConfig,
    ...props
  }: StreamdownProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const generatedId = useId();
    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocks(typeof children === "string" ? children : ""),
      [children]
    );
    const rehypeKatexPlugin = useMemo(
      () => () => rehypeKatex({ errorColor: "var(--color-muted-foreground)" }),
      []
    );

    return (
      <ShikiThemeContext.Provider value={shikiTheme}>
        <MermaidConfigContext.Provider value={mermaidConfig}>
          <div className={cn("space-y-4", className)} {...props}>
            {blocks.map((block, index) => (
              <Block
                allowedImagePrefixes={allowedImagePrefixes}
                allowedLinkPrefixes={allowedLinkPrefixes}
                components={{
                  ...defaultComponents,
                  ...components,
                }}
                content={block}
                defaultOrigin={defaultOrigin}
                // biome-ignore lint/suspicious/noArrayIndexKey: "required"
                key={`${generatedId}-block_${index}`}
                rehypePlugins={[rehypeKatexPlugin, ...(rehypePlugins ?? [])]}
                remarkPlugins={[
                  [remarkGfm, remarkGfmOptions],
                  [remarkMath, remarkMathOptions],
                  ...(remarkPlugins ?? []),
                ]}
                shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
              />
            ))}
          </div>
        </MermaidConfigContext.Provider>
      </ShikiThemeContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme
);
Streamdown.displayName = "Streamdown";
