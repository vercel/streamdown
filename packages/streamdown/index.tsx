'use client';

import { createContext, memo, useEffect, useId, useMemo } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { BundledTheme } from 'shiki';
import 'katex/dist/katex.min.css';
import hardenReactMarkdownImport from 'harden-react-markdown';
import { components as defaultComponents } from './lib/components';
import { parseMarkdownIntoBlocks } from './lib/parse-blocks';
import { parseIncompleteMarkdown } from './lib/parse-incomplete-markdown';
import { cn } from './lib/utils';

// Animation CSS - injected only when animate=true
const animationCSS = `
@keyframes streamdownFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.streamdown-animate > * {
  animation: streamdownFadeIn var(--streamdown-duration, 300ms) ease-out both;
  opacity: 0;
}
.streamdown-animate > *:nth-child(1) { animation-delay: 0ms; }
.streamdown-animate > *:nth-child(2) { animation-delay: 60ms; }
.streamdown-animate > *:nth-child(3) { animation-delay: 120ms; }
.streamdown-animate > *:nth-child(4) { animation-delay: 180ms; }
.streamdown-animate > *:nth-child(n+5) { animation-delay: 240ms; }
@media (prefers-reduced-motion: reduce) {
  .streamdown-animate > * {
    animation: none !important;
    opacity: 1 !important;
  }
}
`;

let animationStylesInjected = false;
function injectAnimationStyles() {
  if (animationStylesInjected || typeof document === 'undefined') return;
  const styleId = 'streamdown-animation';
  if (document.getElementById(styleId)) {
    animationStylesInjected = true;
    return;
  }
  const el = document.createElement('style');
  el.id = styleId;
  el.textContent = animationCSS;
  document.head.appendChild(el);
  animationStylesInjected = true;
}

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
  /** Enable simple fade-in on blocks */
  animate?: boolean;
  /** Fade-in duration in ms */
  animationDuration?: number;
};

export const ShikiThemeContext = createContext<[BundledTheme, BundledTheme]>([
  'github-light' as BundledTheme,
  'github-dark' as BundledTheme,
]);

type BlockProps = HardenReactMarkdownProps & {
  content: string;
  shouldParseIncompleteMarkdown: boolean;
};

const Block = memo(
  ({ content, shouldParseIncompleteMarkdown, ...props }: BlockProps) => {
    const parsedContent = useMemo(
      () =>
        typeof content === 'string' && shouldParseIncompleteMarkdown
          ? parseIncompleteMarkdown(content.trim())
          : content,
      [content, shouldParseIncompleteMarkdown]
    );

    return <HardenedMarkdown {...props}>{parsedContent}</HardenedMarkdown>;
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

Block.displayName = 'Block';

export const Streamdown = memo(
  ({
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    components,
    rehypePlugins,
    remarkPlugins,
    className,
    shikiTheme = ['github-light', 'github-dark'],
    animate = false,
    animationDuration = 300,
    ...props
  }: StreamdownProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const generatedId = useId();
    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocks(typeof children === 'string' ? children : ''),
      [children]
    );
    const rehypeKatexPlugin = useMemo(
      () => () => rehypeKatex({ errorColor: 'var(--color-muted-foreground)' }),
      []
    );

    // Inject animation CSS when animate is enabled
    useEffect(() => {
      if (animate) injectAnimationStyles();
    }, [animate]);

    return (
      <ShikiThemeContext.Provider value={shikiTheme}>
        <div
          className={cn('space-y-4', animate && 'streamdown-animate', className)}
          style={
            animate
              ? ({ '--streamdown-duration': `${animationDuration}ms` } as React.CSSProperties)
              : undefined
          }
          {...props}
        >
          {blocks.map((block, index) => (
            <Block
              allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
              allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
              components={{
                ...defaultComponents,
                ...components,
              }}
              content={block}
              defaultOrigin={defaultOrigin}
              // biome-ignore lint/suspicious/noArrayIndexKey: "required"
              key={`${generatedId}-block_${index}`}
              rehypePlugins={[rehypeKatexPlugin, ...(rehypePlugins ?? [])]}
              remarkPlugins={[remarkGfm, remarkMath, ...(remarkPlugins ?? [])]}
              shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
            />
          ))}
        </div>
      </ShikiThemeContext.Provider>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.shikiTheme === nextProps.shikiTheme &&
    prevProps.animate === nextProps.animate &&
    prevProps.animationDuration === nextProps.animationDuration
);
Streamdown.displayName = 'Streamdown';
