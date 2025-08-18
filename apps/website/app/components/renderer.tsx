'use client';

import { useInView } from 'motion/react';
import {
  type ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { Streamdown } from 'streamdown';

const DEFAULT_SPEED = 100;

type RendererProps = {
  speed?: number;
  type: 'markdown' | 'streamdown';
  markdown: string;
  className?: string;
  streamdownProps?: ComponentProps<typeof Streamdown>;
};

export const Renderer = ({
  speed = DEFAULT_SPEED,
  type = 'markdown',
  markdown,
  streamdownProps,
}: RendererProps) => {
  const [content, setContent] = useState('');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const tokens = useMemo(
    () => markdown.split(' ').map((token) => `${token} `),
    [markdown]
  );

  useEffect(() => {
    if (!isInView) {
      return;
    }

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
  }, [speed, tokens, isInView]);

  return (
    <div ref={ref}>
      {type === 'markdown' ? (
        <ReactMarkdown>{content}</ReactMarkdown>
      ) : (
        <Streamdown {...streamdownProps}>{content}</Streamdown>
      )}
    </div>
  );
};
