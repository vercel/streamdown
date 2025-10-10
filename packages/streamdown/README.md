# Streamdown

A drop-in replacement for react-markdown, designed for AI-powered streaming.

[![npm version](https://img.shields.io/npm/v/streamdown)](https://www.npmjs.com/package/streamdown)

## Overview

Formatting Markdown is easy, but when you tokenize and stream it, new challenges arise. Streamdown is built specifically to handle the unique requirements of streaming Markdown content from AI models, providing seamless formatting even with incomplete or unterminated Markdown blocks.

Streamdown powers the [AI Elements Response](https://ai-sdk.dev/elements/components/response) component but can be installed as a standalone package for your own streaming needs.

## Features

- 🚀 **Drop-in replacement** for `react-markdown`
- 🔄 **Streaming-optimized** - Handles incomplete Markdown gracefully
- 🎨 **Unterminated block parsing** - Styles incomplete bold, italic, code, links, and headings
- 📊 **GitHub Flavored Markdown** - Tables, task lists, and strikethrough support
- 🔢 **Math rendering** - LaTeX equations via KaTeX
- 📈 **Mermaid diagrams** - Render Mermaid diagrams as code blocks with a button to render them
- 🎯 **Code syntax highlighting** - Beautiful code blocks with Shiki
- 🛡️ **Security-first** - Built with rehype-harden for safe rendering
- ⚡ **Performance optimized** - Memoized rendering for efficient updates

## Installation

```bash
npm i streamdown
```

Then, update your Tailwind `globals.css` to include the following.

```css
@source "../node_modules/streamdown/dist/index.js";
```

Make sure the path matches the location of the `node_modules` folder in your project. This will ensure that the Streamdown styles are applied to your project.

## Usage

### Basic Example

```tsx
import { Streamdown } from 'streamdown';

export default function Page() {
  const markdown = "# Hello World\n\nThis is **streaming** markdown!";

  return <Streamdown>{markdown}</Streamdown>;
}
```

### Mermaid Diagrams

Streamdown supports Mermaid diagrams using the `mermaid` language identifier:

```tsx
import { Streamdown } from 'streamdown';
import type { MermaidConfig } from 'mermaid';

export default function Page() {
  const markdown = `
# Flowchart Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
\`\`\`

# Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant API
    participant Database

    User->>API: Request data
    API->>Database: Query
    Database-->>API: Results
    API-->>User: Response
\`\`\`
  `;

  // Optional: Customize Mermaid theme and colors
  const mermaidConfig: MermaidConfig = {
    theme: 'dark',
    themeVariables: {
      primaryColor: '#ff0000',
      primaryTextColor: '#fff'
    }
  };

  return (
    <Streamdown mermaidConfig={mermaidConfig}>
      {markdown}
    </Streamdown>
  );
}
```

### With AI SDK

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Streamdown } from 'streamdown';

export default function Page() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.parts.filter(part => part.type === 'text').map((part, index) => (
            <Streamdown isAnimating={status === 'streaming'} key={index}>{part.text}</Streamdown>
          ))}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}
          placeholder="Say something..."
        />
        <button type="submit" disabled={status !== 'ready'}>
          Submit
        </button>
      </form>
    </>
  );
}
```

### Customizing Plugins

When you need to override the default plugins (e.g., to configure security settings), you can import the default plugin configurations and selectively modify them:

```tsx
import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { harden } from 'rehype-harden';

export default function Page() {
  const markdown = `
[Safe link](https://example.com)
[Unsafe link](https://malicious-site.com)
  `;

  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.katex,
        [
          harden,
          {
            defaultOrigin: 'https://example.com',
            allowedLinkPrefixes: ['https://example.com'],
          },
        ],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

The `defaultRehypePlugins` and `defaultRemarkPlugins` exports provide access to:

**defaultRehypePlugins:**
- `harden` - Security hardening with rehype-harden (configured with wildcard permissions by default)
- `raw` - HTML support
- `katex` - Math rendering with KaTeX

**defaultRemarkPlugins:**
- `gfm` - GitHub Flavored Markdown support
- `math` - Math syntax support

## Props

Streamdown accepts all the same props as react-markdown, plus additional streaming-specific options:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | - | The Markdown content to render |
| `parseIncompleteMarkdown` | `boolean` | `true` | Parse and style unterminated Markdown blocks |
| `className` | `string` | - | CSS class for the container |
| `components` | `object` | - | Custom component overrides |
| `rehypePlugins` | `array` | `[[harden, { allowedImagePrefixes: ["*"], allowedLinkPrefixes: ["*"], defaultOrigin: undefined }], rehypeRaw, [rehypeKatex, { errorColor: "var(--color-muted-foreground)" }]]` | Rehype plugins to use. Includes rehype-harden for security, rehype-raw for HTML support, and rehype-katex for math rendering by default |
| `remarkPlugins` | `array` | `[[remarkGfm, {}], [remarkMath, { singleDollarTextMath: false }]]` | Remark plugins to use. Includes GitHub Flavored Markdown and math support by default |
| `shikiTheme` | `[BundledTheme, BundledTheme]` | `['github-light', 'github-dark']` | The light and dark themes to use for code blocks |
| `mermaidConfig` | `MermaidConfig` | - | Custom configuration for Mermaid diagrams (theme, colors, etc.) |
| `controls` | `boolean \| { table?: boolean, code?: boolean, mermaid?: boolean }` | `true` | Control visibility of copy/download buttons |
| `isAnimating` | `boolean` | `false` | Whether the component is currently animating. This is used to disable the copy and download buttons when the component is animating. |

## Architecture

Streamdown is built as a monorepo with:

- **`packages/streamdown`** - The core React component library
- **`apps/website`** - Documentation and demo site

## Development

```bash
# Install dependencies
pnpm install

# Build the streamdown package
pnpm --filter streamdown build

# Run development server
pnpm dev

# Run tests
pnpm test

# Build packages
pnpm build
```

## Requirements

- Node.js >= 18
- React >= 19.1.1

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
