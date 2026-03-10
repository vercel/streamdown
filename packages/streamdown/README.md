# Streamdown

A drop-in replacement for react-markdown, designed for AI-powered streaming.

[![npm version](https://img.shields.io/npm/v/streamdown)](https://www.npmjs.com/package/streamdown)

## Overview

Formatting Markdown is easy, but when you tokenize and stream it, new challenges arise. Streamdown is built specifically to handle the unique requirements of streaming Markdown content from AI models, providing seamless formatting even with incomplete or unterminated Markdown blocks.

Streamdown powers the [AI Elements Message](https://ai-sdk.dev/elements/components/message) component but can be installed as a standalone package for your own streaming needs.

## Features

- 🚀 **Drop-in replacement** for `react-markdown`
- 🔄 **Streaming-optimized** - Handles incomplete Markdown gracefully
- 🎨 **Unterminated block parsing** - Build with `remend` for better streaming quality
- 📊 **GitHub Flavored Markdown** - Tables, task lists, and strikethrough support
- 🔢 **Math rendering** - LaTeX equations via KaTeX
- 📈 **Mermaid diagrams** - Render Mermaid diagrams as code blocks with a button to render them
- 🎯 **Code syntax highlighting** - Beautiful code blocks with Shiki
- 🛡️ **Security-first** - Built with `rehype-harden` for safe rendering
- ⚡ **Performance optimized** - Memoized rendering for efficient updates

## Installation

```bash
npm i streamdown
```

Then, update your Tailwind `globals.css` to include the following so that Tailwind can detect the utility classes used by Streamdown.

```css
@source "../node_modules/streamdown/dist/*.js";
```

The path must be relative from your CSS file to the `node_modules` folder containing `streamdown`. In a standard Next.js project where `globals.css` lives in `app/`, the default path above should work.

If you install optional Streamdown plugins, add their matching `@source` lines from the relevant plugin docs (`/docs/plugins/code`, `/docs/plugins/cjk`, `/docs/plugins/math`, `/docs/plugins/mermaid`). Only include plugin `@source` entries for packages that are actually installed.

Example:

```css
@source "../node_modules/@streamdown/code/dist/*.js";
```


### Monorepo setup

In a monorepo (npm workspaces, Turbo, pnpm, etc.), dependencies are typically hoisted to the root `node_modules`. You need to adjust the relative path to point there:

```
monorepo/
├── node_modules/streamdown/  ← hoisted here
├── apps/
│   └── web/
│       └── app/
│           └── globals.css   ← your CSS file
```

```css
/* apps/web/app/globals.css → 3 levels up to reach root node_modules */
@source "../../../node_modules/streamdown/dist/*.js";
```

Adjust the number of `../` segments based on where your CSS file lives relative to the root `node_modules`. If you install Streamdown plugins, add their respective `@source` entries only when those packages are installed.

### CSS Custom Properties (Design Tokens)

Streamdown components are built using shadcn/ui's design system and rely on CSS custom properties for colors, border radius, and spacing. Without these variables defined, components may render with missing backgrounds, borders, or incorrect spacing.

If you are already using shadcn/ui, these variables are set up automatically. If not, add the following minimal set to your global CSS:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --radius: 0.625rem;
}
```

You can also use the shadcn/ui [theme generator](https://ui.shadcn.com/themes) to create a custom palette and copy the generated CSS variables directly into your project.

## Usage

Here's how you can use Streamdown in your React application with the AI SDK:

```tsx
import { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";

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
                animated
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
}
```

For more info, see the [documentation](https://streamdown.ai/docs).
