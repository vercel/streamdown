"use client";

import { createContext, memo, useEffect, useId, useMemo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { BundledTheme } from "shiki";
import type { MermaidConfig } from "mermaid";
import { harden } from "rehype-harden";
import type { Pluggable } from "unified";
import { components as defaultComponents } from "./lib/components";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { parseIncompleteMarkdown } from "./lib/parse-incomplete-markdown";
import { cn } from "./lib/utils";

export { defaultUrlTransform } from "react-markdown";

export type { MermaidConfig } from "mermaid";

export {
  CodeBlockReactShiki,
  CodeBlockReactShikiCopyButton,
  CodeBlockReactShikiDownloadButton,
} from "./lib/code-block-react-shiki";
export {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from "./lib/code-block";

export type ControlsConfig =
  | boolean
  | {
      table?: boolean;
      code?: boolean;
      mermaid?: boolean;
    };

export type CodeHighlighter = "shiki" | "react-shiki";

export type ShikiConfig = {
  /** Enable line numbers in code blocks */
  showLineNumbers?: boolean;
  /** Starting line number (default: 1) */
  startingLineNumber?: number;
  /** Default color mode for multi-theme setup. Use "light-dark()" for reactive theme switching */
  defaultColor?: "light" | "dark" | "light-dark()" | false;
  /** Delay between highlights in milliseconds (default: 200) */
  delay?: number;
};

export type StreamdownProps = Options & {
  parseIncompleteMarkdown?: boolean;
  className?: string;
  shikiTheme?: [BundledTheme, BundledTheme];
  mermaidConfig?: MermaidConfig;
  controls?: ControlsConfig;
  isAnimating?: boolean;
  codeHighlighter?: CodeHighlighter;
  /** Configuration options for react-shiki code highlighter */
  shikiConfig?: ShikiConfig;
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
} as const;

export const ShikiThemeContext = createContext<[BundledTheme, BundledTheme]>([
  "github-light" as BundledTheme,
  "github-dark" as BundledTheme,
]);

export const MermaidConfigContext = createContext<MermaidConfig | undefined>(
  undefined
);

export const ControlsContext = createContext<ControlsConfig>(true);

export const CodeHighlighterContext = createContext<CodeHighlighter>("shiki");

export const ShikiConfigContext = createContext<ShikiConfig>({
  showLineNumbers: false,
  startingLineNumber: 1,
  defaultColor: "light-dark()",
  delay: 200,
});

export type StreamdownRuntimeContextType = {
  isAnimating: boolean;
};

export const StreamdownRuntimeContext =
  createContext<StreamdownRuntimeContextType>({
    isAnimating: false,
  });

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
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    components,
    rehypePlugins = Object.values(defaultRehypePlugins),
    remarkPlugins = Object.values(defaultRemarkPlugins),
    className,
    shikiTheme = ["github-light", "github-dark"],
    mermaidConfig,
    controls = true,
    isAnimating = false,
    codeHighlighter = "shiki",
    shikiConfig = {},
    urlTransform = (value) => value,
    ...props
  }: StreamdownProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const generatedId = useId();
    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocks(typeof children === "string" ? children : ""),
      [children]
    );

    // Merge default config with user config
    const mergedShikiConfig: ShikiConfig = useMemo(
      () => ({
        showLineNumbers: false,
        startingLineNumber: 1,
        defaultColor: "light-dark()",
        delay: 200,
        ...shikiConfig,
      }),
      [shikiConfig]
    );

    useEffect(() => {
      if (Array.isArray(rehypePlugins) && rehypePlugins.some(plugin => Array.isArray(plugin) ? plugin[0] === rehypeKatex : plugin === rehypeKatex)) {
        // @ts-ignore
        import("katex/dist/katex.min.css");
      }

      if (codeHighlighter === "react-shiki" && mergedShikiConfig.showLineNumbers) {
        // @ts-ignore
        import("react-shiki/css");
      }
    }, [codeHighlighter, mergedShikiConfig.showLineNumbers]);

    return (
      <ShikiThemeContext.Provider value={shikiTheme}>
        <MermaidConfigContext.Provider value={mermaidConfig}>
          <ControlsContext.Provider value={controls}>
            <CodeHighlighterContext.Provider value={codeHighlighter}>
              <ShikiConfigContext.Provider value={mergedShikiConfig}>
                <StreamdownRuntimeContext.Provider value={{ isAnimating }}>
                  <div className={cn("space-y-4", className)}>
                    {blocks.map((block, index) => (
                      <Block
                        components={{
                          ...defaultComponents,
                          ...components,
                        }}
                        content={block}
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
              </ShikiConfigContext.Provider>
            </CodeHighlighterContext.Provider>
          </ControlsContext.Provider>
        </MermaidConfigContext.Provider>
      </ShikiThemeContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme &&
    prevProps.isAnimating === nextProps.isAnimating
);
Streamdown.displayName = "Streamdown";
