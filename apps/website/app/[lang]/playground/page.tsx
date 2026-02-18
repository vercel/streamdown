"use client";

import { useState } from "react";
import { Streamdown } from "streamdown";

const defaultMarkdown = `# Hello, world

Some **bold**, *italic*, and ~~strikethrough~~ text.

## A list

- First item
- Second item
  - Nested
- Third item

## A table

| Name | Flavor |
|------|--------|
| Apple | Sweet |
| Lemon | Sour |

## Some code

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> A blockquote for good measure.
`;

const Playground = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [mode, setMode] = useState<"static" | "streaming">("static");

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          Streamdown Playground
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm" htmlFor="mode">
            <span className="text-muted-foreground">Mode:</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              id="mode"
              onChange={(e) =>
                setMode(e.target.value as "static" | "streaming")
              }
              value={mode}
            >
              <option value="static">Static</option>
              <option value="streaming">Streaming</option>
            </select>
          </label>
          <button
            className="rounded-md border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMarkdown("")}
            type="button"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Input Panel */}
        <div className="flex w-1/2 flex-col border-r">
          <div className="flex shrink-0 items-center border-b bg-muted/50 px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Markdown Input
            </span>
          </div>
          <textarea
            className="flex-1 resize-none bg-background p-4 font-mono text-sm leading-relaxed focus:outline-none"
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type your markdown here..."
            spellCheck={false}
            value={markdown}
          />
        </div>

        {/* Output Panel */}
        <div className="flex w-1/2 flex-col">
          <div className="flex shrink-0 items-center border-b bg-muted/50 px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Streamdown Output
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-prose">
              <Streamdown mode={mode}>{markdown}</Streamdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
