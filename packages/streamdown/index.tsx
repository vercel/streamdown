'use client';

import type { ComponentProps } from 'react';
import { memo, useId, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import hardenReactMarkdown from 'harden-react-markdown';
import { components as defaultComponents } from './lib/components';
import { parseMarkdownIntoBlocks } from './lib/parse-blocks';
import { parseIncompleteMarkdown } from './lib/parse-incomplete-markdown';

// Create a hardened version of ReactMarkdown
const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

export type ResponseProps = ComponentProps<typeof HardenedMarkdown> & {
  parseIncompleteMarkdown?: boolean;
};

type BlockProps = ComponentProps<typeof HardenedMarkdown> & {
  content: string;
};

const Block = memo(
  ({ content, ...props }: BlockProps) => (
    <HardenedMarkdown {...props}>{content}</HardenedMarkdown>
  ),
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

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
    ...props
  }: ResponseProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const parsedChildren =
      typeof children === 'string' && shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children;
    const generatedId = useId();
    const blocks = useMemo(
      () => parseMarkdownIntoBlocks(parsedChildren ?? ''),
      [parsedChildren]
    );

    return (
      <>
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
            rehypePlugins={[rehypeKatex, ...(rehypePlugins ?? [])]}
            remarkPlugins={[remarkGfm, remarkMath, ...(remarkPlugins ?? [])]}
            {...props}
          />
        ))}
      </>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
Streamdown.displayName = 'Streamdown';
