"use client";

import type { MermaidConfig } from "mermaid";
import { createContext, memo, useEffect, useId, useMemo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import { harden } from "rehype-harden";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { BundledTheme } from "shiki";
import type { Pluggable } from "unified";
import { components as defaultComponents } from "./lib/components";
import { MermaidContext } from "./lib/mermaid";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { parseIncompleteMarkdown } from "./lib/parse-incomplete-markdown";
import { cn } from "./lib/utils";

export type { MermaidConfig } from "mermaid";
// biome-ignore lint/performance/noBarrelFile: "required"
export { defaultUrlTransform } from "react-markdown";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
export { parseIncompleteMarkdown } from "./lib/parse-incomplete-markdown";

export type ControlsConfig =
  | boolean
  | {
      table?: boolean;
      code?: boolean;
      mermaid?:
        | boolean
        | {
            download?: boolean;
            copy?: boolean;
            fullscreen?: boolean;
          };
    };

export type MermaidErrorComponentProps = {
  error: string;
  chart: string;
  retry: () => void;
};

export type MermaidOptions = {
  config?: MermaidConfig;
  errorComponent?: React.ComponentType<MermaidErrorComponentProps>;
};

export type StreamdownProps = Options & {
  mode?: "static" | "streaming";
  BlockComponent?: React.ComponentType<BlockProps>;
  parseMarkdownIntoBlocksFn?: (markdown: string) => string[];
  parseIncompleteMarkdown?: boolean;
  className?: string;
  shikiTheme?: [BundledTheme, BundledTheme];
  mermaid?: MermaidOptions;
  controls?: ControlsConfig;
  isAnimating?: boolean;
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
  harden: [
    harden,
    {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      defaultOrigin: undefined,
      allowDataImages: true,
    },
  ],
  raw: rehypeRaw,
  katex: [rehypeKatex, { errorColor: "var(--color-muted-foreground)" }],
} as const;

export const defaultRemarkPlugins: Record<string, Pluggable> = {
  gfm: [remarkGfm, {}],
  math: [remarkMath, { singleDollarTextMath: false }],
  cjkFriendly: [remarkCjkFriendly, {}],
  cjkFriendlyGfmStrikethrough: [remarkCjkFriendlyGfmStrikethrough, {}],
} as const;

export const ShikiThemeContext = createContext<[BundledTheme, BundledTheme]>([
  "github-light" as BundledTheme,
  "github-dark" as BundledTheme,
]);

// Export the unified context (imported from ./lib/mermaid above)
export { MermaidContext };

export const ControlsContext = createContext<ControlsConfig>(true);

export type StreamdownRuntimeContextType = {
  isAnimating: boolean;
};

export const StreamdownRuntimeContext =
  createContext<StreamdownRuntimeContextType>({
    isAnimating: false,
  });

export const ModeContext = createContext<"static" | "streaming">("streaming");

type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
  index: number;
};

export const Block = memo(
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

const defaultShikiTheme: [BundledTheme, BundledTheme] = [
  "github-light",
  "github-dark",
];

export const Streamdown = memo(
  ({
    children,
    mode = "streaming",
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    components,
    rehypePlugins = Object.values(defaultRehypePlugins),
    remarkPlugins = Object.values(defaultRemarkPlugins),
    className,
    shikiTheme = defaultShikiTheme,
    mermaid,
    controls = true,
    isAnimating = false,
    urlTransform = (value) => value,
    BlockComponent = Block,
    parseMarkdownIntoBlocksFn = parseMarkdownIntoBlocks,
    ...props
  }: StreamdownProps) => {
    // All hooks must be called before any conditional returns
    const generatedId = useId();
    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocksFn(typeof children === "string" ? children : ""),
      [children, parseMarkdownIntoBlocksFn]
    );
    const runtimeContext = useMemo(() => ({ isAnimating }), [isAnimating]);

    useEffect(() => {
      if (
        Array.isArray(rehypePlugins) &&
        rehypePlugins.some((plugin) =>
          Array.isArray(plugin)
            ? plugin[0] === rehypeKatex
            : plugin === rehypeKatex
        )
      ) {
        // @ts-expect-error
        import("katex/dist/katex.min.css");
      }
    }, [rehypePlugins]);

    // Static mode: simple rendering without streaming features
    if (mode === "static") {
      return (
        <ModeContext.Provider value={mode}>
          <ShikiThemeContext.Provider value={shikiTheme}>
            <MermaidContext.Provider value={mermaid}>
              <ControlsContext.Provider value={controls}>
                <div className={cn("space-y-4", className)}>
                  <ReactMarkdown
                    components={{
                      ...defaultComponents,
                      ...components,
                    }}
                    rehypePlugins={rehypePlugins}
                    remarkPlugins={remarkPlugins}
                    urlTransform={urlTransform}
                    {...props}
                  >
                    {children}
                  </ReactMarkdown>
                </div>
              </ControlsContext.Provider>
            </MermaidContext.Provider>
          </ShikiThemeContext.Provider>
        </ModeContext.Provider>
      );
    }

    // Streaming mode: parse into blocks with memoization and incomplete markdown handling
    return (
      <ModeContext.Provider value={mode}>
        <ShikiThemeContext.Provider value={shikiTheme}>
          <MermaidContext.Provider value={mermaid}>
            <ControlsContext.Provider value={controls}>
              <StreamdownRuntimeContext.Provider value={runtimeContext}>
                <div className={cn("space-y-4", className)}>
                  {blocks.map((block, index) => (
                    <BlockComponent
                      components={{
                        ...defaultComponents,
                        ...components,
                      }}
                      content={block}
                      index={index}
                      // biome-ignore lint/suspicious/noArrayIndexKey: "required"
                      key={`${generatedId}-block-${index}`}
                      rehypePlugins={rehypePlugins}
                      remarkPlugins={remarkPlugins}
                      shouldParseIncompleteMarkdown={
                        shouldParseIncompleteMarkdown
                      }
                      urlTransform={urlTransform}
                      {...props}
                    />
                  ))}
                </div>
              </StreamdownRuntimeContext.Provider>
            </ControlsContext.Provider>
          </MermaidContext.Provider>
        </ShikiThemeContext.Provider>
      </ModeContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.mode === nextProps.mode
);
Streamdown.displayName = "Streamdown";
