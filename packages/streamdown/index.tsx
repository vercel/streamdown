"use client";

import type { MermaidConfig } from "mermaid";
import {
  type CSSProperties,
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
import rehypeSanitize from "rehype-sanitize";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remend, { type RemendOptions } from "remend";
import type { BundledTheme } from "shiki";
import type { Pluggable } from "unified";
import { components as defaultComponents } from "./lib/components";
import { Markdown, type Options } from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { remarkCjkAutolinkBoundary } from "./lib/remark/cjk-autolink";
import { cn } from "./lib/utils";
import packageJson from "./package.json";

// Regex patterns defined at top level for performance
const MIDDLE_DOLLAR_PATTERN = /[^$]\$[^$]/;
const START_DOLLAR_PATTERN = /^\$[^$]/;
const END_DOLLAR_PATTERN = /[^$]\$$/;

export type { MermaidConfig } from "mermaid";
export type { RemendOptions } from "remend";
export type { BundledLanguageName } from "./lib/code-block/bundled-languages";

// biome-ignore lint/performance/noBarrelFile: "required"
export {
  bundledLanguages,
  isBundledLanguage,
} from "./lib/code-block/bundled-languages";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";

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
  caret?: keyof typeof carets;
  cdnUrl?: string | null;
  remend?: RemendOptions;
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
  raw: rehypeRaw,
  sanitize: [rehypeSanitize, {}],
  katex: [rehypeKatex, { errorColor: "var(--color-muted-foreground)" }],
  harden: [
    harden,
    {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      allowedProtocols: ["*"],
      defaultOrigin: undefined,
      allowDataImages: true,
    },
  ],
} as const;

export const defaultRemarkPlugins: Record<string, Pluggable> = {
  gfm: [remarkGfm, {}],
  cjkAutolinkBoundary: [remarkCjkAutolinkBoundary, {}],
  math: [remarkMath, { singleDollarTextMath: false }],
  cjkFriendly: [remarkCjkFriendly, {}],
  cjkFriendlyGfmStrikethrough: [remarkCjkFriendlyGfmStrikethrough, {}],
} as const;

// Stable plugin arrays for cache efficiency - created once at module level
const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

const carets = {
  block: " ▋",
  circle: " ●",
};

// Combined context for better performance - reduces React tree depth from 5 nested providers to 1
export type StreamdownContextType = {
  shikiTheme: [BundledTheme, BundledTheme];
  controls: ControlsConfig;
  isAnimating: boolean;
  mode: "static" | "streaming";
  mermaid?: MermaidOptions;
  cdnUrl?: string | null;
};

const defaultCdnUrl = "https://www.streamdown.ai/cdn";

const defaultStreamdownContext: StreamdownContextType = {
  shikiTheme: ["github-light" as BundledTheme, "github-dark" as BundledTheme],
  controls: true,
  isAnimating: false,
  mode: "streaming",
  mermaid: undefined,
  cdnUrl: defaultCdnUrl,
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
  // Destructure shouldParseIncompleteMarkdown and index to prevent them from leaking to the DOM
  ({
    content,
    shouldParseIncompleteMarkdown: _,
    index: __,
    ...props
  }: BlockProps) => {
    // Note: remend is already applied to the entire markdown before parsing into blocks
    // in the Streamdown component, so we don't need to apply it again here
    return <Markdown {...props}>{content}</Markdown>;
  },
  (prevProps, nextProps) => {
    // Deep comparison for better memoization
    if (prevProps.content !== nextProps.content) {
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

// Helper functions to reduce complexity
const checkKatexPlugin = (
  rehypePlugins: Pluggable[] | null | undefined
): boolean =>
  Array.isArray(rehypePlugins) &&
  rehypePlugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === rehypeKatex : plugin === rehypeKatex
  );

const checkSingleDollarEnabled = (
  remarkPlugins: Pluggable[] | null | undefined
): boolean => {
  if (!Array.isArray(remarkPlugins)) {
    return false;
  }

  const mathPlugin = remarkPlugins.find((plugin) =>
    Array.isArray(plugin) ? plugin[0] === remarkMath : plugin === remarkMath
  );

  if (mathPlugin && Array.isArray(mathPlugin) && mathPlugin[1]) {
    const config = mathPlugin[1] as { singleDollarTextMath?: boolean };
    return config.singleDollarTextMath === true;
  }

  return false;
};

const checkMathSyntax = (
  content: string,
  singleDollarEnabled: boolean
): boolean => {
  const hasDoubleDollar = content.includes("$$");
  const hasSingleDollar =
    singleDollarEnabled &&
    (MIDDLE_DOLLAR_PATTERN.test(content) ||
      START_DOLLAR_PATTERN.test(content) ||
      END_DOLLAR_PATTERN.test(content));
  return hasDoubleDollar || hasSingleDollar;
};

const versionRegex = /^\^/;

const loadKatexCSS = (cdnBaseUrl: string): void => {
  // Extract KaTeX version from package.json dependencies
  const katexVersion = packageJson.dependencies["rehype-katex"]
    .replace(versionRegex, "")
    .split(".")[0]; // Get major version (e.g., "7" from "^7.0.1")

  // Map rehype-katex major version to KaTeX version
  // rehype-katex v7 uses KaTeX v0.16
  const katexVersionMap: Record<string, string> = {
    "7": "0.16.22",
  };

  const katexCssVersion = katexVersionMap[katexVersion] || "0.16.22";

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${cdnBaseUrl}/katex/${katexCssVersion}/katex.min.css`;
  document.head.appendChild(link);
};

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
    caret,
    cdnUrl = defaultCdnUrl,
    remend: remendOptions,
    ...props
  }: StreamdownProps) => {
    // All hooks must be called before any conditional returns
    const generatedId = useId();
    const [_isPending, startTransition] = useTransition();
    const [displayBlocks, setDisplayBlocks] = useState<string[]>([]);

    // Apply remend to fix incomplete markdown BEFORE parsing into blocks
    // This prevents partial list items from being interpreted as setext headings
    const processedChildren = useMemo(() => {
      if (typeof children !== "string") {
        return "";
      }
      return mode === "streaming" && shouldParseIncompleteMarkdown
        ? remend(children, remendOptions)
        : children;
    }, [children, mode, shouldParseIncompleteMarkdown, remendOptions]);

    const blocks = useMemo(
      () => parseMarkdownIntoBlocksFn(processedChildren),
      [processedChildren, parseMarkdownIntoBlocksFn]
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
        cdnUrl,
      }),
      [shikiTheme, controls, isAnimating, mode, mermaid, cdnUrl]
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
      // Skip if CDN is disabled
      if (cdnUrl === null) {
        return;
      }

      const hasKatexPlugin = checkKatexPlugin(rehypePlugins);
      if (!hasKatexPlugin) {
        return;
      }

      const singleDollarEnabled = checkSingleDollarEnabled(remarkPlugins);
      const content = typeof children === "string" ? children : "";
      const hasMathSyntax = checkMathSyntax(content, singleDollarEnabled);

      if (hasMathSyntax) {
        loadKatexCSS(cdnUrl);
      }
    }, [rehypePlugins, remarkPlugins, children, cdnUrl]);

    const style = useMemo(
      () =>
        caret && isAnimating
          ? ({
              "--streamdown-caret": `"${carets[caret]}"`,
            } as CSSProperties)
          : undefined,
      [caret, isAnimating]
    );

    // Static mode: simple rendering without streaming features
    if (mode === "static") {
      return (
        <StreamdownContext.Provider value={contextValue}>
          <div
            className={cn(
              "space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0",
              className
            )}
          >
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
        <div
          className={cn(
            "space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0",
            caret
              ? "*:last:after:inline *:last:after:align-baseline *:last:after:content-(--streamdown-caret)"
              : null,
            className
          )}
          style={style}
        >
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
