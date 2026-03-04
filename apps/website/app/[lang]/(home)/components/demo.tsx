"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";

const markdown = `# Streamdown

Streamdown is a **streaming-optimized** Markdown renderer for React. It was designed for AI chat interfaces where content arrives token-by-token, but it works just as well for static content.

Most Markdown renderers re-parse the entire document on every update. Streamdown takes a different approach — it splits content into discrete blocks and only re-renders the block that changed. This means your UI stays fast, even when the response is hundreds of lines long.

## Getting started

Install the package from npm, then drop it into your component tree. It accepts a \`children\` string and handles the rest.

\`\`\`tsx
import { Streamdown } from "streamdown";

const Chat = ({ content }: { content: string }) => (
  <Streamdown animated caret="block">
    {content}
  </Streamdown>
);
\`\`\`

The \`animated\` prop enables a smooth fade-in on new blocks, and \`caret\` renders a blinking cursor at the end of the stream — just like the one you're watching right now.

## Plugin ecosystem

Streamdown ships with optional plugins for common use cases. Each one is a separate package, so you only bundle what you need.

| Plugin | Package | Purpose |
| --- | --- | --- |
| Syntax highlighting | \`@streamdown/code\` | Shiki-powered code blocks |
| Diagrams | \`@streamdown/mermaid\` | Mermaid diagram rendering |
| Math | \`@streamdown/math\` | KaTeX math expressions |
| CJK | \`@streamdown/cjk\` | CJK line-breaking rules |

For example, the quadratic formula renders beautifully: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

## Why Streamdown?

There are plenty of Markdown renderers out there, but most of them weren't built for streaming. Here's what makes Streamdown different:

- [x] Block-level diffing for *incremental* re-renders
- [x] First-class support for ~~incomplete~~ partial Markdown
- [x] Configurable caret styles and animations
- [ ] World domination

> Streamdown is open-source and MIT licensed. Contributions are welcome.
`;

const speed = 100;

const tokens = markdown.split(" ").map((token) => `${token} `);

export const Demo = () => {
  const [content, setContent] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setContent("");
    setIsAnimating(true);
    let currentContent = "";
    let index = 0;

    intervalRef.current = setInterval(() => {
      if (index < tokens.length) {
        currentContent += tokens[index];
        setContent(currentContent);
        index += 1;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsAnimating(false);
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInView]);

  return (
    <Conversation>
      <ConversationContent className="h-[600px] overflow-y-auto rounded-sm border bg-background">
        <div className="mx-auto w-full max-w-prose p-12" ref={ref}>
          <Streamdown
            animated
            caret="block"
            isAnimating={isAnimating}
            plugins={{ code, mermaid, math, cjk }}
          >
            {content}
          </Streamdown>
        </div>
      </ConversationContent>
    </Conversation>
  );
};
