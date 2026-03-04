import { SiReact } from "@icons-pack/react-simple-icons";
import type { CSSProperties } from "react";
import { codeToTokens } from "shiki";
import { cn } from "@/lib/utils";
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

const parseRootStyle = (rootStyle: string): Record<string, string> => {
  const style: Record<string, string> = {};
  for (const decl of rootStyle.split(";")) {
    const idx = decl.indexOf(":");
    if (idx > 0) {
      const prop = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (prop && val) {
        style[prop] = val;
      }
    }
  }
  return style;
};

export const Usage = async () => {
  const { tokens, rootStyle } = await codeToTokens(exampleCode, {
    lang: "tsx",
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  });

  const preStyle: Record<string, string> = {};

  if (rootStyle) {
    Object.assign(preStyle, parseRootStyle(rootStyle));
  }

  return (
    <div className="not-prose overflow-hidden rounded-sm border">
      <div className="flex items-center gap-2 border-b bg-sidebar py-1.5 pr-1.5 pl-4 text-muted-foreground">
        <SiReact className="size-4" />
        <span className="flex-1 font-mono font-normal text-sm tracking-tight">
          app/chat/page.tsx
        </span>
        <CopyButton code={exampleCode} />
      </div>
      <pre
        className={cn("overflow-x-auto bg-background py-3 text-sm")}
        style={
          {
            "--sdm-bg": "#fff",
            ...preStyle,
          } as CSSProperties
        }
      >
        <code className="grid min-w-max">
          {tokens.map((line, lineIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static token array from shiki
            <span className="line px-4" key={lineIndex}>
              {line.length > 0
                ? // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: dual-theme token style mapping
                  line.map((token, tokenIndex) => {
                    const tokenStyle: Record<string, string> = {};

                    if (token.htmlStyle) {
                      for (const [key, value] of Object.entries(
                        token.htmlStyle
                      )) {
                        if (key === "color" || key === "--shiki-light") {
                          tokenStyle["--sdm-c"] = value;
                        } else if (
                          key === "background-color" ||
                          key === "--shiki-light-bg"
                        ) {
                          tokenStyle["--sdm-tbg"] = value;
                        } else {
                          tokenStyle[key] = value;
                        }
                      }
                    }

                    const hasBg = Boolean(tokenStyle["--sdm-tbg"]);

                    return (
                      <span
                        className={cn(
                          "text-[var(--sdm-c,inherit)]",
                          "dark:text-[var(--shiki-dark,var(--sdm-c,inherit))]",
                          hasBg && "bg-[var(--sdm-tbg)]",
                          hasBg &&
                            "dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg))]"
                        )}
                        // biome-ignore lint/suspicious/noArrayIndexKey: static token array from shiki
                        key={tokenIndex}
                        style={tokenStyle as CSSProperties}
                      >
                        {token.content}
                      </span>
                    );
                  })
                : "\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};
