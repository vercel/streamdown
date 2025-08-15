'use client';

import type { ComponentProps } from 'react';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import hardenReactMarkdown from 'harden-react-markdown';
import { parseIncompleteMarkdown } from './lib/parse-incomplete-markdown';
import { components as defaultComponents } from './lib/components';

// Create a hardened version of ReactMarkdown
const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

export type ResponseProps = ComponentProps<typeof HardenedMarkdown> & {
  parseIncompleteMarkdown?: boolean;
}

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

    return (
      <HardenedMarkdown
        components={{
          ...defaultComponents,
          ...components,
        }}
        rehypePlugins={[rehypeKatex, ...(rehypePlugins ?? [])]}
        remarkPlugins={[remarkGfm, remarkMath, ...(remarkPlugins ?? [])]}
        allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
        allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
        defaultOrigin={defaultOrigin}
        {...props}
      >
        {parsedChildren}
      </HardenedMarkdown>

    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
Response.displayName = 'Response';
