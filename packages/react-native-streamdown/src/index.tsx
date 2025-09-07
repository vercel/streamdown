import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { parseMarkdownIntoBlocks } from './lib/parse-blocks';
import { parseIncompleteMarkdown } from './lib/parse-incomplete-markdown';
import { components } from './lib/components';

export type StreamdownProps = {
  children: string;
  parseIncompleteMarkdown?: boolean;
  style?: any;
  rules?: any;
};

const Block = memo(
  ({ content, shouldParseIncompleteMarkdown, ...props }: { content: string; shouldParseIncompleteMarkdown: boolean;[key: string]: any }) => {
    const parsedContent = useMemo(
      () =>
        typeof content === 'string' && shouldParseIncompleteMarkdown
          ? parseIncompleteMarkdown(content.trim())
          : content,
      [content, shouldParseIncompleteMarkdown]
    );

    return <Markdown {...props}>{parsedContent}</Markdown>;
  }
);

Block.displayName = 'Block';

export const Streamdown = memo(
  ({
    children,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    style,
    rules,
    ...props
  }: StreamdownProps) => {
    const blocks = useMemo(
      () =>
        parseMarkdownIntoBlocks(typeof children === 'string' ? children : ''),
      [children]
    );

    const mergedRules = useMemo(() => ({ ...components, ...rules }), [rules]);

    return (
      <View style={style}>
        {blocks.map((block, index) => (
          <Block
            key={index}
            content={block}
            shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown}
            rules={mergedRules}
            {...props}
          />
        ))}
      </View>
    );
  }
);

Streamdown.displayName = 'Streamdown';
