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

Then, update your Tailwind `globals.css` to include the following.

```css
@source "../node_modules/streamdown/dist/*.js";
```

Make sure the path matches the location of the `node_modules` folder in your project. This will ensure that the Streamdown styles are applied to your project.

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
}
```

For more info, see the [documentation](https://streamdown.ai/docs).
