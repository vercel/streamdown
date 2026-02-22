"use client";

import type { MermaidConfig } from "mermaid";
import {
  type CSSProperties,
  createContext,
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remend, { type RemendOptions } from "remend";
import type { BundledTheme } from "shiki";
import type { Pluggable } from "unified";
import {
  type AnimateOptions,
  type AnimatePlugin,
  createAnimatePlugin,
} from "./lib/animate";
import { BlockIncompleteContext } from "./lib/block-incomplete-context";
import { components as defaultComponents } from "./lib/components";
import { hasIncompleteCodeFence, hasTable } from "./lib/incomplete-code-utils";
import { Markdown, type Options } from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import { PluginContext } from "./lib/plugin-context";
import type { PluginConfig } from "./lib/plugin-types";
import { preprocessCustomTags } from "./lib/preprocess-custom-tags";
import { cn } from "./lib/utils";

export type { BundledLanguage, BundledTheme } from "shiki";
export type { AnimateOptions } from "./lib/animate";
// biome-ignore lint/performance/noBarrelFile: "required"
export { createAnimatePlugin } from "./lib/animate";
export { useIsCodeFenceIncomplete } from "./lib/block-incomplete-context";
export type {
  AllowElement,
  Components,
  ExtraProps,
  UrlTransform,
} from "./lib/markdown";
export { defaultUrlTransform } from "./lib/markdown";
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
export type {
  CjkPlugin,
  CodeHighlighterPlugin,
  DiagramPlugin,
  HighlightOptions,
  MathPlugin,
  PluginConfig,
} from "./lib/plugin-types";

// Patterns for HTML indentation normalization
// Matches if content starts with an HTML tag (possibly with leading whitespace)
const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
// Matches 4+ spaces/tabs before HTML tags at line starts
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

/**
 * Normalizes indentation in HTML blocks to prevent Markdown parsers from
 * treating indented HTML tags as code blocks (4+ spaces = code in Markdown).
 *
 * Useful when rendering AI-generated HTML content with nested tags that
 * are indented for readability.
 *
 * @param content - The raw HTML/Markdown string to normalize
 * @returns The normalized string with reduced indentation before HTML tags
 */
export const normalizeHtmlIndentation = (content: string): string => {
  if (typeof content !== "string" || content.length === 0) {
    return content;
  }
  // Only process if content starts with an HTML-like tag (possibly indented)
  if (!HTML_BLOCK_START_PATTERN.test(content)) {
    return content;
  }
  // Remove 4+ spaces/tabs before HTML tags at line starts
  return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};

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

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: (url: string) => Promise<boolean> | boolean;
  renderModal?: (props: LinkSafetyModalProps) => React.ReactNode;
}

export interface MermaidErrorComponentProps {
  chart: string;
  error: string;
  retry: () => void;
}

export interface MermaidOptions {
  config?: MermaidConfig;
  errorComponent?: React.ComponentType<MermaidErrorComponentProps>;
}

export type AllowedTags = Record<string, string[]>;

export type StreamdownProps = Options & {
  mode?: "static" | "streaming";
  BlockComponent?: React.ComponentType<BlockProps>;
  parseMarkdownIntoBlocksFn?: (markdown: string) => string[];
  parseIncompleteMarkdown?: boolean;
  /** Normalize HTML block indentation to prevent 4+ spaces being treated as code blocks. @default false */
  normalizeHtmlIndentation?: boolean;
  className?: string;
  shikiTheme?: [BundledTheme, BundledTheme];
  mermaid?: MermaidOptions;
  controls?: ControlsConfig;
  isAnimating?: boolean;
  animated?: boolean | AnimateOptions;
  caret?: keyof typeof carets;
  plugins?: PluginConfig;
  remend?: RemendOptions;
  linkSafety?: LinkSafetyConfig;
  /** Custom tags to allow through sanitization with their permitted attributes */
  allowedTags?: AllowedTags;
};

const defaultSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "tel"],
  },
};

export const defaultRehypePlugins: Record<string, Pluggable> = {
  raw: rehypeRaw,
  sanitize: [rehypeSanitize, defaultSanitizeSchema],
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
} as const;

// Stable plugin arrays for cache efficiency - created once at module level
const defaultRehypePluginsArray = Object.values(defaultRehypePlugins);
const defaultRemarkPluginsArray = Object.values(defaultRemarkPlugins);

const carets = {
  block: " ▋",
  circle: " ●",
};

// Combined context for better performance - reduces React tree depth from 5 nested providers to 1
export interface StreamdownContextType {
  controls: ControlsConfig;
  isAnimating: boolean;
  linkSafety?: LinkSafetyConfig;
  mermaid?: MermaidOptions;
  mode: "static" | "streaming";
  shikiTheme: [BundledTheme, BundledTheme];
}

const defaultStreamdownContext: StreamdownContextType = {
  shikiTheme: ["github-light", "github-dark"],
  controls: true,
  isAnimating: false,
  mode: "streaming",
  mermaid: undefined,
  linkSafety: { enabled: true },
};

export const StreamdownContext = createContext<StreamdownContextType>(
  defaultStreamdownContext
);

export type BlockProps = Options & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
  shouldNormalizeHtmlIndentation: boolean;
  index: number;
  /** Whether this block is incomplete (still being streamed) */
  isIncomplete: boolean;
  /** Animate plugin instance for tracking previous content length */
  animatePlugin?: AnimatePlugin | null;
};

export const Block = memo(
  // Destructure internal props to prevent them from leaking to the DOM
  ({
    content,
    shouldParseIncompleteMarkdown: _,
    shouldNormalizeHtmlIndentation,
    index: __,
    isIncomplete,
    animatePlugin: animatePluginProp,
    ...props
  }: BlockProps) => {
    // Track previous content length to prevent re-animation of already-visible content.
    // When a block's content grows during streaming, only new characters get animated.
    const prevContentLengthRef = useRef(0);

    // Set prevContentLength on the animate plugin before the synchronous rehype render.
    // This is safe because React renders synchronously — the rehype pipeline will read
    // this value during the same synchronous render pass.
    if (animatePluginProp) {
      animatePluginProp.setPrevContentLength(prevContentLengthRef.current);
    }

    // Note: remend is already applied to the entire markdown before parsing into blocks
    // in the Streamdown component, so we don't need to apply it again here
    const normalizedContent =
      typeof content === "string" && shouldNormalizeHtmlIndentation
        ? normalizeHtmlIndentation(content)
        : content;

    const result = (
      <BlockIncompleteContext.Provider value={isIncomplete}>
        <Markdown {...props}>{normalizedContent}</Markdown>
      </BlockIncompleteContext.Provider>
    );

    // Update prev content length after this render using the HAST character count
    // (not raw markdown length) to match the units used by charCounter in the animate plugin.
    prevContentLengthRef.current = animatePluginProp
      ? animatePluginProp.getLastRenderCharCount()
      : 0;

    // Reset so other blocks don't inherit this block's prevContentLength
    if (animatePluginProp) {
      animatePluginProp.resetPrevContentLength();
    }

    return result;
  },
  (prevProps, nextProps) => {
    // Deep comparison for better memoization
    if (prevProps.content !== nextProps.content) {
      return false;
    }
    if (
      prevProps.shouldNormalizeHtmlIndentation !==
      nextProps.shouldNormalizeHtmlIndentation
    ) {
      return false;
    }
    if (prevProps.index !== nextProps.index) {
      return false;
    }

    if (prevProps.isIncomplete !== nextProps.isIncomplete) {
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
    normalizeHtmlIndentation: shouldNormalizeHtmlIndentation = false,
    components,
    rehypePlugins = defaultRehypePluginsArray,
    remarkPlugins = defaultRemarkPluginsArray,
    className,
    shikiTheme = defaultShikiTheme,
    mermaid,
    controls = true,
    isAnimating = false,
    animated,
    BlockComponent = Block,
    parseMarkdownIntoBlocksFn = parseMarkdownIntoBlocks,
    caret,
    plugins,
    remend: remendOptions,
    linkSafety = {
      enabled: true,
    },
    allowedTags,
    ...props
  }: StreamdownProps) => {
    // All hooks must be called before any conditional returns
    const generatedId = useId();
    const [_isPending, startTransition] = useTransition();

    const allowedTagNames = useMemo(
      () => (allowedTags ? Object.keys(allowedTags) : []),
      [allowedTags]
    );

    // Apply remend to fix incomplete markdown BEFORE parsing into blocks
    // This prevents partial list items from being interpreted as setext headings
    const processedChildren = useMemo(() => {
      if (typeof children !== "string") {
        return "";
      }
      let result =
        mode === "streaming" && shouldParseIncompleteMarkdown
          ? remend(children, remendOptions)
          : children;

      // Preprocess custom tags to prevent blank lines from splitting HTML blocks
      if (allowedTagNames.length > 0) {
        result = preprocessCustomTags(result, allowedTagNames);
      }

      return result;
    }, [
      children,
      mode,
      shouldParseIncompleteMarkdown,
      remendOptions,
      allowedTagNames,
    ]);

    const blocks = useMemo(
      () => parseMarkdownIntoBlocksFn(processedChildren),
      [processedChildren, parseMarkdownIntoBlocksFn]
    );

    // Initialize displayBlocks with blocks to avoid hydration mismatch
    // Previously initialized as [] which caused content to flicker on hydration
    const [displayBlocks, setDisplayBlocks] = useState<string[]>(blocks);

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

    // Use value-based deps so animatePlugin stays stable when the user passes an
    // inline object literal for `animated` (e.g. animated={{ animation: 'fadeIn' }}).
    // A stable plugin reference is required for the prevContentLength tracking in
    // Block to work: the rehype processor is cached by plugin name, so it always
    // uses the first closure created. If the plugin is recreated the mutation of
    // config.prevContentLength would target a new config object that the cached
    // processor never reads.
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional value-based comparison
    const animatePlugin = useMemo(() => {
      if (!animated) {
        return null;
      }
      if (animated === true) {
        return createAnimatePlugin();
      }
      return createAnimatePlugin(animated);
    }, [
      animated === true,
      typeof animated === "object" && animated !== null
        ? animated.animation
        : undefined,
      typeof animated === "object" && animated !== null
        ? animated.duration
        : undefined,
      typeof animated === "object" && animated !== null
        ? animated.easing
        : undefined,
      typeof animated === "object" && animated !== null
        ? animated.sep
        : undefined,
    ]);

    // Combined context value - single object reduces React tree overhead
    const contextValue = useMemo<StreamdownContextType>(
      () => ({
        shikiTheme: plugins?.code?.getThemes() ?? shikiTheme,
        controls,
        isAnimating,
        mode,
        mermaid,
        linkSafety,
      }),
      [
        shikiTheme,
        controls,
        isAnimating,
        mode,
        mermaid,
        linkSafety,
        plugins?.code,
      ]
    );

    // Memoize merged components to avoid recreating on every render
    const mergedComponents = useMemo(
      () => ({
        ...defaultComponents,
        ...components,
      }),
      [components]
    );

    // Merge plugin remark plugins (math, cjk)
    // Order: CJK before -> default (remarkGfm) -> CJK after -> math
    const mergedRemarkPlugins = useMemo(() => {
      let result: Pluggable[] = [];
      // CJK plugins that must run BEFORE remarkGfm (e.g., remark-cjk-friendly)
      if (plugins?.cjk) {
        result = [...result, ...plugins.cjk.remarkPluginsBefore];
      }
      // Default plugins (includes remarkGfm)
      result = [...result, ...remarkPlugins];
      // CJK plugins that must run AFTER remarkGfm (e.g., autolink boundary)
      if (plugins?.cjk) {
        result = [...result, ...plugins.cjk.remarkPluginsAfter];
      }
      // Math plugins
      if (plugins?.math) {
        result = [...result, plugins.math.remarkPlugin];
      }
      return result;
    }, [remarkPlugins, plugins?.math, plugins?.cjk]);

    const mergedRehypePlugins = useMemo(() => {
      let result = rehypePlugins;

      // extend sanitization schema with allowedTags. only works with default plugins. if user provides a custom sanitize plugin, they can pass in the custom allowed tags via the plugins object.
      if (
        allowedTags &&
        Object.keys(allowedTags).length > 0 &&
        rehypePlugins === defaultRehypePluginsArray
      ) {
        const extendedSchema = {
          ...defaultSanitizeSchema,
          tagNames: [
            ...(defaultSanitizeSchema.tagNames ?? []),
            ...Object.keys(allowedTags),
          ],
          attributes: {
            ...defaultSanitizeSchema.attributes,
            ...allowedTags,
          },
        };

        result = [
          defaultRehypePlugins.raw,
          [rehypeSanitize, extendedSchema],
          defaultRehypePlugins.harden,
        ];
      }

      if (plugins?.math) {
        result = [...result, plugins.math.rehypePlugin];
      }

      if (animatePlugin && isAnimating) {
        result = [...result, animatePlugin.rehypePlugin];
      }

      return result;
    }, [rehypePlugins, plugins?.math, animatePlugin, isAnimating, allowedTags]);

    const shouldHideCaret = useMemo(() => {
      if (!isAnimating || blocksToRender.length === 0) {
        return false;
      }
      const lastBlock = blocksToRender.at(-1) as string;
      return hasIncompleteCodeFence(lastBlock) || hasTable(lastBlock);
    }, [isAnimating, blocksToRender]);

    const style = useMemo(
      () =>
        caret && isAnimating && !shouldHideCaret
          ? ({
              "--streamdown-caret": `"${carets[caret]}"`,
            } as CSSProperties)
          : undefined,
      [caret, isAnimating, shouldHideCaret]
    );

    // Static mode: simple rendering without streaming features
    if (mode === "static") {
      return (
        <PluginContext.Provider value={plugins ?? null}>
          <StreamdownContext.Provider value={contextValue}>
            <div
              className={cn(
                "space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0",
                className
              )}
            >
              <Markdown
                components={mergedComponents}
                rehypePlugins={mergedRehypePlugins}
                remarkPlugins={mergedRemarkPlugins}
                {...props}
              >
                {processedChildren}
              </Markdown>
            </div>
          </StreamdownContext.Provider>
        </PluginContext.Provider>
      );
    }

    // Streaming mode: parse into blocks with memoization and incomplete markdown handling
    return (
      <PluginContext.Provider value={plugins ?? null}>
        <StreamdownContext.Provider value={contextValue}>
          <div
            className={cn(
              "space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0",
              caret && !shouldHideCaret
                ? "*:last:after:inline *:last:after:align-baseline *:last:after:content-[var(--streamdown-caret)]"
                : null,
              className
            )}
            style={style}
          >
            {blocksToRender.length === 0 && caret && isAnimating && <span />}
            {blocksToRender.map((block, index) => {
              const isLastBlock = index === blocksToRender.length - 1;
              const isIncomplete =
                isAnimating && isLastBlock && hasIncompleteCodeFence(block);
              return (
                <BlockComponent
                  animatePlugin={animatePlugin}
                  components={mergedComponents}
                  content={block}
                  index={index}
                  isIncomplete={isIncomplete}
                  key={blockKeys[index]}
                  rehypePlugins={mergedRehypePlugins}
                  remarkPlugins={mergedRemarkPlugins}
                  shouldNormalizeHtmlIndentation={
                    shouldNormalizeHtmlIndentation
                  }
                  shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
                  {...props}
                />
              );
            })}
          </div>
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.animated === nextProps.animated &&
    prevProps.mode === nextProps.mode &&
    prevProps.plugins === nextProps.plugins &&
    prevProps.className === nextProps.className &&
    prevProps.linkSafety === nextProps.linkSafety &&
    prevProps.normalizeHtmlIndentation === nextProps.normalizeHtmlIndentation
);
Streamdown.displayName = "Streamdown";
