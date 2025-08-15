'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Streamdown } from 'streamdown';

const DEFAULT_SPEED = 50;

type RendererProps = {
  speed?: number;
  type: 'markdown' | 'streamdown';
  markdown: string;
  className?: string;
};

export const Renderer = ({
  speed = DEFAULT_SPEED,
  type = 'markdown',
  markdown,
}: RendererProps) => {
  const [content, setContent] = useState('');
  const tokens = useMemo(
    () => markdown.split(' ').map((token) => `${token} `),
    [markdown]
  );

  useEffect(() => {
    let currentContent = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < tokens.length) {
        currentContent += tokens[index];
        setContent(currentContent);
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [speed, tokens]);

  return type === 'markdown' ? (
    <ReactMarkdown>{content}</ReactMarkdown>
  ) : (
    <Streamdown>{content}</Streamdown>
  );
};
