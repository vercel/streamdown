"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { SettingsIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const defaultMarkdown = `# Streamdown Feature Showcase

This playground demonstrates every feature supported by Streamdown.

---

## Text Formatting

Regular paragraph text with **bold**, *italic*, ***bold italic***, and ~~strikethrough~~ formatting. You can also use \`inline code\` within text.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

---

## Links and Images

Visit [Streamdown on GitHub](https://github.com/haydenbleasel/streamdown) or paste a raw URL like https://streamdown.dev and it becomes a link automatically.

![Streamdown logo](https://streamdown.dev/og.png)

---

## Blockquotes

> This is a blockquote. It supports **formatting** and *emphasis* inside.
>
> > Blockquotes can also be nested.

---

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item
    - Deeply nested item
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task Lists

- [x] Completed task
- [X] Also completed
- [ ] Pending task
  - [x] Nested completed task
  - [ ] Nested pending task

---

## Tables

| Feature | Status | Notes |
|:--------|:------:|------:|
| Markdown | Supported | CommonMark compliant |
| GFM | Supported | Tables, tasks, strikethrough |
| Code highlighting | Supported | 200+ languages via Shiki |
| Math | Supported | KaTeX rendering |
| Mermaid | Supported | Flowcharts, sequences, and more |
| CJK | Supported | Chinese, Japanese, Korean |

---

## Code

Inline \`code\` renders within text. Block code gets syntax highlighting:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate the first n Fibonacci numbers."""
    sequence = [0, 1]
    for _ in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

print(fibonacci(10))
\`\`\`

\`\`\`css
:root {
  --primary: #0070f3;
  --background: #ffffff;
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}
\`\`\`

\`\`\`bash
# Install Streamdown
npm install streamdown @streamdown/code @streamdown/math @streamdown/mermaid
\`\`\`

---

## Mathematics

Inline math: $$E = mc^2$$ and $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$.

Block math for display equations:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

$$
\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}
\\begin{bmatrix}
x \\\\
y
\\end{bmatrix}
=
\\begin{bmatrix}
ax + by \\\\
cx + dy
\\end{bmatrix}
$$

$$
f(x) = \\begin{cases}
x^2 & \\text{if } x \\geq 0 \\\\
-x^2 & \\text{if } x < 0
\\end{cases}
$$

---

## Mermaid Diagrams

### Flowchart

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Ship it]
\`\`\`

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Database

    Client->>Server: POST /api/data
    Server->>Database: INSERT query
    Database-->>Server: Success
    Server-->>Client: 201 Created
\`\`\`

### State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: fetch()
    Loading --> Success: 200 OK
    Loading --> Error: 4xx/5xx
    Error --> Loading: retry()
    Success --> Idle: reset()
\`\`\`

---

## CJK Support

**Chinese:** **你好世界。** Streamdown 支持中文排版。

**Japanese:** *こんにちは。* Streamdown は日本語をサポートしています。

**Korean:** ~~안녕하세요.~~ Streamdown은 한국어를 지원합니다.

---

## Horizontal Rules

Three dashes create a horizontal rule:

---

## HTML Entities

&copy; 2025 &mdash; Streamdown &bull; Built with &hearts;
`;

const PlaygroundEditor = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [mode, setMode] = useState<"static" | "streaming">("static");
  const [isStreaming, setIsStreaming] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [animation, setAnimation] = useState<"fadeIn" | "blurIn" | "slideUp">(
    "fadeIn"
  );
  const [animationDuration, setAnimationDuration] = useState(150);
  const [animationEasing, setAnimationEasing] = useState("ease");
  const [animationSep, setAnimationSep] = useState<"word" | "char">("word");
  const [caret, setCaret] = useState<"block" | "circle" | "none">("block");
  const [streamSpeed, setStreamSpeed] = useState(30);
  const streamRef = useRef<ReturnType<typeof setInterval>>(null);
  const indexRef = useRef(0);
  const tokens = useMemo(
    () => defaultMarkdown.split(" ").map((token) => `${token} `),
    []
  );

  const stopStreaming = useCallback(() => {
    if (streamRef.current) {
      clearInterval(streamRef.current);
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const simulateStreaming = useCallback(() => {
    stopStreaming();
    setMarkdown("");
    setMode("streaming");
    indexRef.current = 0;
    setIsStreaming(true);

    let currentContent = "";

    streamRef.current = setInterval(() => {
      if (indexRef.current >= tokens.length) {
        setMarkdown(defaultMarkdown);
        stopStreaming();
        return;
      }

      currentContent += tokens[indexRef.current];
      indexRef.current += 1;
      setMarkdown(currentContent);
    }, streamSpeed);
  }, [stopStreaming, tokens, streamSpeed]);

  return (
    <div className="flex h-[calc(100dvh-65px-75px)] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b p-2">
        <h1 className="px-2 font-semibold text-lg tracking-tight">
          Streamdown Playground
        </h1>
        <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) => setMode(value as "static" | "streaming")}
            value={mode}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="streaming">Streaming</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button aria-label="Settings" size="sm" variant="outline">
                <SettingsIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="grid gap-4">
                <p className="font-medium text-sm">Rendering</p>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Animated
                    </span>
                    <Select
                      onValueChange={(value) => setAnimated(value === "true")}
                      value={String(animated)}
                    >
                      <SelectTrigger className="w-24" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">On</SelectItem>
                        <SelectItem value="false">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {animated && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Effect
                        </span>
                        <Select
                          onValueChange={(value) =>
                            setAnimation(
                              value as "fadeIn" | "blurIn" | "slideUp"
                            )
                          }
                          value={animation}
                        >
                          <SelectTrigger className="w-24" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fadeIn">Fade in</SelectItem>
                            <SelectItem value="blurIn">Blur in</SelectItem>
                            <SelectItem value="slideUp">Slide up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Duration (ms)
                        </span>
                        <Input
                          className="w-24"
                          max={2000}
                          min={1}
                          onChange={(e) =>
                            setAnimationDuration(
                              Math.max(1, Number(e.target.value))
                            )
                          }
                          type="number"
                          value={animationDuration}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Easing
                        </span>
                        <Select
                          onValueChange={setAnimationEasing}
                          value={animationEasing}
                        >
                          <SelectTrigger className="w-24" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ease">ease</SelectItem>
                            <SelectItem value="ease-in">ease-in</SelectItem>
                            <SelectItem value="ease-out">ease-out</SelectItem>
                            <SelectItem value="ease-in-out">
                              ease-in-out
                            </SelectItem>
                            <SelectItem value="linear">linear</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Split by
                        </span>
                        <Select
                          onValueChange={(value) =>
                            setAnimationSep(value as "word" | "char")
                          }
                          value={animationSep}
                        >
                          <SelectTrigger className="w-24" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="word">Word</SelectItem>
                            <SelectItem value="char">Character</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Caret</span>
                    <Select
                      onValueChange={(value) =>
                        setCaret(value as "block" | "circle" | "none")
                      }
                      value={caret}
                    >
                      <SelectTrigger className="w-24" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block ▋</SelectItem>
                        <SelectItem value="circle">Circle ●</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="font-medium text-sm">Streaming</p>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Speed (ms)
                    </span>
                    <Input
                      className="w-24"
                      max={500}
                      min={1}
                      onChange={(e) =>
                        setStreamSpeed(Math.max(1, Number(e.target.value)))
                      }
                      type="number"
                      value={streamSpeed}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            onClick={isStreaming ? stopStreaming : simulateStreaming}
            size="sm"
            variant={isStreaming ? "destructive" : "default"}
          >
            {isStreaming ? "Stop" : "Simulate Stream"}
          </Button>
          <Button
            onClick={() => {
              stopStreaming();
              setMarkdown("");
            }}
            size="sm"
            variant="outline"
          >
            Clear
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-1/2 flex-col border-r">
          <div className="flex shrink-0 items-center border-b bg-muted/50 px-4 py-2">
            <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Markdown Input
            </span>
          </div>
          <Conversation>
            <ConversationContent>
              <Textarea
                className="flex-1 resize-none rounded-none border-0 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0"
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type your markdown here..."
                spellCheck={false}
                value={markdown}
              />
            </ConversationContent>
          </Conversation>
        </div>

        <div className="flex w-1/2 flex-col">
          <div className="flex shrink-0 items-center border-b bg-muted/50 px-4 py-2">
            <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Streamdown Output
            </span>
          </div>
          <Conversation>
            <ConversationContent>
              <Streamdown
                animated={
                  animated
                    ? {
                        animation,
                        duration: animationDuration,
                        easing: animationEasing,
                        sep: animationSep,
                      }
                    : false
                }
                caret={caret === "none" ? undefined : caret}
                isAnimating={isStreaming}
                mode={mode}
                plugins={{ code, mermaid, math, cjk }}
              >
                {markdown}
              </Streamdown>
            </ConversationContent>
          </Conversation>
        </div>
      </div>
    </div>
  );
};

export { PlaygroundEditor };
