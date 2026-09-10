import { SiReact } from "@icons-pack/react-simple-icons";
import { geistShikiTheme } from "@vercel/geistdocs/shiki-theme";
import { codeToTokens } from "shiki";
import { CopyButton } from "./copy-button";

const exampleCode = `import { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";

export default function Chat() {
  const { messages, status } = useChat();

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, index) =>
            part.type === 'text' ? (
              <Streamdown
                key={index}
                plugins={{ code, mermaid, math, cjk }}
                isAnimating={status === 'streaming'}
              >
                {part.text}
              </Streamdown>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
}`;

export const Usage = async () => {
  const { tokens } = await codeToTokens(exampleCode, {
    lang: "tsx",
    theme: geistShikiTheme,
  });

  return (
    <div className="not-prose overflow-hidden rounded-sm border">
      <div className="flex items-center gap-2 border-b bg-sidebar py-1.5 pr-1.5 pl-4 text-muted-foreground">
        <SiReact className="size-4" />
        <span className="flex-1 font-mono font-normal text-sm tracking-tight">
          app/chat/page.tsx
        </span>
        <CopyButton code={exampleCode} />
      </div>
      <pre className="overflow-x-auto bg-background py-3 text-[13px] leading-5">
        <code className="grid min-w-max">
          {tokens.map((line, lineIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static token array from shiki
            <span className="line px-4" key={lineIndex}>
              {line.length > 0
                ? line.map((token, tokenIndex) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: static token array from shiki
                      key={tokenIndex}
                      style={{ color: token.color }}
                    >
                      {token.content}
                    </span>
                  ))
                : "\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};
