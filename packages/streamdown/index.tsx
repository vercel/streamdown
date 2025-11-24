"use client";

import type { MermaidConfig } from "mermaid";
import {
  createContext,
  memo,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react";
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
import { Markdown, type Options } from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { parseIncompleteMarkdown } from "./lib/parse-incomplete-markdown";
import { cn } from "./lib/utils";

export type { MermaidConfig } from "mermaid";
// biome-ignore lint/performance/noBarrelFile: "required"
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
            panZoom?: boolean;
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

// Stable plugin arrays for cache efficiency - created once at module level
const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

// Combined context for better performance - reduces React tree depth from 5 nested providers to 1
export type StreamdownContextType = {
  shikiTheme: [BundledTheme, BundledTheme];
  controls: ControlsConfig;
  isAnimating: boolean;
  mode: "static" | "streaming";
  mermaid?: MermaidOptions;
};

const defaultStreamdownContext: StreamdownContextType = {
  shikiTheme: ["github-light" as BundledTheme, "github-dark" as BundledTheme],
  controls: true,
  isAnimating: false,
  mode: "streaming",
  mermaid: undefined,
};

export const StreamdownContext = createContext<StreamdownContextType>(
  defaultStreamdownContext
);

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

    return <Markdown {...props}>{parsedContent}</Markdown>;
  },
  (prevProps, nextProps) => {
    // Deep comparison for better memoization
    if (prevProps.content !== nextProps.content) {
      return false;
    }
    if (
      prevProps.shouldParseIncompleteMarkdown !==
      nextProps.shouldParseIncompleteMarkdown
    ) {
      return false;
    }
    if (prevProps.index !== nextProps.index) {
      return false;
    }

    // Check if components object changed (shallow comparison)
    if (prevProps.components !== nextProps.components) {
      // If references differ, check if keys are the same
      const prevKeys = Object.keys(prevProps.components || {});
      const nextKeys = Object.keys(nextProps.components || {});

      if (prevKeys.length !== nextKeys.length) {
        return false;
      }
      if (
        prevKeys.some(
          // @ts-expect-error - key is a string
          (key) => prevProps.components?.[key] !== nextProps.components?.[key]
        )
      ) {
        return false;
      }
    }

    // Check if rehypePlugins changed (reference comparison)
    if (prevProps.rehypePlugins !== nextProps.rehypePlugins) {
      return false;
    }

    // Check if remarkPlugins changed (reference comparison)
    if (prevProps.remarkPlugins !== nextProps.remarkPlugins) {
      return false;
    }

    return true;
  }
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
    rehypePlugins = defaultRehypePluginsArray,
    remarkPlugins = defaultRemarkPluginsArray,
    className,
    shikiTheme = defaultShikiTheme,
    mermaid,
    controls = true,
    isAnimating = false,
    BlockComponent = Block,
    parseMarkdownIntoBlocksFn = parseMarkdownIntoBlocks,
    ...props
  }: StreamdownProps) => {
    // All hooks must be called before any conditional returns
    const generatedId = useId();
    const [_isPending, startTransition] = useTransition();
    const [displayBlocks, setDisplayBlocks] = useState<string[]>([]);

    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocksFn(typeof children === "string" ? children : ""),
      [children, parseMarkdownIntoBlocksFn]
    );

    // Use transition for block updates in streaming mode to avoid blocking UI
    useEffect(() => {
      if (mode === "streaming") {
        startTransition(() => {
          setDisplayBlocks(blocks);
        });
      } else {
        setDisplayBlocks(blocks);
      }
    }, [blocks, mode]);

    // Use displayBlocks for rendering to leverage useTransition
    const blocksToRender = mode === "streaming" ? displayBlocks : blocks;

    // Generate stable keys based on index only
    // Don't use content hash - that causes unmount/remount when content changes
    // React will handle content updates via props changes and memo comparison
    // biome-ignore lint/correctness/useExhaustiveDependencies: "we're using the blocksToRender length"
    const blockKeys = useMemo(
      () => blocksToRender.map((_block, idx) => `${generatedId}-${idx}`),
      [blocksToRender.length, generatedId]
    );

    // Combined context value - single object reduces React tree overhead
    const contextValue = useMemo<StreamdownContextType>(
      () => ({
        shikiTheme,
        controls,
        isAnimating,
        mode,
        mermaid,
      }),
      [shikiTheme, controls, isAnimating, mode, mermaid]
    );

    // Memoize merged components to avoid recreating on every render
    const mergedComponents = useMemo(
      () => ({
        ...defaultComponents,
        ...components,
      }),
      [components]
    );

    // Only load KaTeX CSS when math syntax is detected in content
    useEffect(() => {
      // Check if katex plugin is included
      const hasKatexPlugin =
        Array.isArray(rehypePlugins) &&
        rehypePlugins.some((plugin) =>
          Array.isArray(plugin)
            ? plugin[0] === rehypeKatex
            : plugin === rehypeKatex
        );

      if (!hasKatexPlugin) {
        return;
      }

      // Check if single dollar math is enabled in remarkMath config
      let singleDollarEnabled = false;
      if (Array.isArray(remarkPlugins)) {
        const mathPlugin = remarkPlugins.find((plugin) =>
          Array.isArray(plugin) ? plugin[0] === remarkMath : plugin === remarkMath
        );
        if (mathPlugin && Array.isArray(mathPlugin) && mathPlugin[1]) {
          const config = mathPlugin[1] as { singleDollarTextMath?: boolean };
          singleDollarEnabled = config.singleDollarTextMath === true;
        }
      }

      // Only load CSS if content contains math syntax
      const content = typeof children === "string" ? children : "";
      const hasDoubleDollar = content.includes("$$");
      const hasSingleDollar = singleDollarEnabled && (
        /[^$]\$[^$]/.test(content) ||
        /^\$[^$]/.test(content) ||
        /[^$]\$$/.test(content)
      );
      const hasMathSyntax = hasDoubleDollar || hasSingleDollar;

      if (hasMathSyntax) {
        // @ts-expect-error - dynamic import for CSS
        import("katex/dist/katex.min.css");
      }
    }, [rehypePlugins, remarkPlugins, children]);

    // Static mode: simple rendering without streaming features
    if (mode === "static") {
      return (
        <StreamdownContext.Provider value={contextValue}>
          <div className={cn("space-y-4", className)}>
            <Markdown
              components={mergedComponents}
              rehypePlugins={rehypePlugins}
              remarkPlugins={remarkPlugins}
              {...props}
            >
              {children}
            </Markdown>
          </div>
        </StreamdownContext.Provider>
      );
    }

    // Streaming mode: parse into blocks with memoization and incomplete markdown handling
    return (
      <StreamdownContext.Provider value={contextValue}>
        <div className={cn("space-y-4", className)}>
          {blocksToRender.map((block, index) => (
            <BlockComponent
              components={mergedComponents}
              content={block}
              index={index}
              key={blockKeys[index]}
              rehypePlugins={rehypePlugins}
              remarkPlugins={remarkPlugins}
              shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
              {...props}
            />
          ))}
        </div>
      </StreamdownContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.mode === nextProps.mode
);
Streamdown.displayName = "Streamdown";
