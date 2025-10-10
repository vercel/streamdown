"use client";

import { createContext, memo, useId, useMemo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { BundledTheme } from "shiki";
import "katex/dist/katex.min.css";
import type { MermaidConfig } from "mermaid";
import { harden } from "rehype-harden";
import type { Options as RemarkGfmOptions } from "remark-gfm";
import type { Options as RemarkMathOptions } from "remark-math";
import { components as defaultComponents } from "./lib/components";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { parseIncompleteMarkdown } from "./lib/parse-incomplete-markdown";
import { cn } from "./lib/utils";

export type { MermaidConfig } from "mermaid";
export type { Options as RemarkGfmOptions } from "remark-gfm";
export type { Options as RemarkMathOptions } from "remark-math";

export type HardenOptions = Parameters<typeof harden>[0];

export type ControlsConfig =
  | boolean
  | {
      table?: boolean;
      code?: boolean;
      mermaid?: boolean;
    };

export type StreamdownProps = Options & {
  hardenOptions?: HardenOptions;
  parseIncompleteMarkdown?: boolean;
  className?: string;
  shikiTheme?: [BundledTheme, BundledTheme];
  mermaidConfig?: MermaidConfig;
  controls?: ControlsConfig;
  remarkMathOptions?: RemarkMathOptions;
  remarkGfmOptions?: RemarkGfmOptions;
};

export const ShikiThemeContext = createContext<[BundledTheme, BundledTheme]>([
  "github-light" as BundledTheme,
  "github-dark" as BundledTheme,
]);

export const MermaidConfigContext = createContext<MermaidConfig | undefined>(
  undefined
);

export const ControlsContext = createContext<ControlsConfig>(true);

type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
};

const Block = memo(
  ({ content, shouldParseIncompleteMarkdown, ...props }: BlockProps) => {
    const parsedContent = useMemo(
      () =>
        typeof content === "string" && shouldParseIncompleteMarkdown
          ? parseIncompleteMarkdown(content.trim())
          : content,
      [content, shouldParseIncompleteMarkdown]
    );

    return <ReactMarkdown {...props}>{parsedContent}</ReactMarkdown>;
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

Block.displayName = "Block";

export const Streamdown = memo(
  ({
    children,
    hardenOptions = {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      defaultOrigin: undefined,
    },
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    components,
    rehypePlugins,
    remarkPlugins,
    remarkRehypeOptions,
    className,
    shikiTheme = ["github-light", "github-dark"],
    mermaidConfig,
    controls = true,
    remarkMathOptions = { singleDollarTextMath: false },
    remarkGfmOptions = {},
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
          <ControlsContext.Provider value={controls}>
            <div className={cn("space-y-4", className)} {...props}>
              {blocks.map((block, index) => (
                <Block
                  components={{
                    ...defaultComponents,
                    ...components,
                  }}
                  content={block}
                  // biome-ignore lint/suspicious/noArrayIndexKey: "required"
                  key={`${generatedId}-block_${index}`}
                  rehypePlugins={[
                    rehypeRaw,
                    rehypeKatexPlugin,
                    [harden, hardenOptions],
                    ...(rehypePlugins ?? []),
                  ]}
                  remarkPlugins={[
                    [remarkGfm, remarkGfmOptions],
                    [remarkMath, remarkMathOptions],
                    ...(remarkPlugins ?? []),
                  ]}
                  remarkRehypeOptions={remarkRehypeOptions}
                  shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
                />
              ))}
            </div>
          </ControlsContext.Provider>
        </MermaidConfigContext.Provider>
      </ShikiThemeContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme
);
Streamdown.displayName = "Streamdown";
