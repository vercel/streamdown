# Comprehensive Markdown Document

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Advanced Features](#advanced-features)
4. [API Reference](#api-reference)
5. [Examples](#examples)

## Introduction

This is a **comprehensive** markdown document designed to test _performance_ with various features. It includes ~~deprecated~~ content, modern syntax, and complex structures.

### Background

In the realm of technical documentation, markdown has become the de facto standard for creating readable, maintainable content. Its simplicity combined with extensibility makes it perfect for:

- Documentation
- README files
- Blog posts
- Technical articles
- Knowledge bases

## Getting Started

### Installation

```bash
npm install streamdown
# or
yarn add streamdown
# or
pnpm add streamdown
```

### Basic Usage

```typescript
import { Streamdown } from 'streamdown';
import 'streamdown/dist/index.css';

export default function App() {
  const [markdown, setMarkdown] = useState('# Hello World');

  return (
    <Streamdown
      mode="streaming"
      parseIncompleteMarkdown
    >
      {markdown}
    </Streamdown>
  );
}
```

## Advanced Features

### Code Highlighting

Streamdown supports syntax highlighting for numerous languages:

```python
def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```

```javascript
// Async/await example
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Usage
fetchData('https://api.example.com/data')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

```rust
// Rust example
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);

    // Pattern matching
    match sum {
        0..=10 => println!("Small sum"),
        11..=50 => println!("Medium sum"),
        _ => println!("Large sum"),
    }
}
```

### Tables

Complex tables with various data types:

| Feature | Streamdown | React Markdown | Marked | Remark |
|---------|-----------|----------------|--------|--------|
| Streaming Support | ✅ | ❌ | ❌ | ❌ |
| GFM Support | ✅ | ✅ | ✅ | ✅ |
| Math Support | ✅ | ⚠️ | ❌ | ⚠️ |
| Mermaid Support | ✅ | ❌ | ❌ | ❌ |
| Syntax Highlighting | ✅ (Shiki) | ⚠️ | ❌ | ⚠️ |
| Bundle Size | ~50KB | ~35KB | ~20KB | ~40KB |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

### Mathematical Expressions

Inline math: $E = mc^2$, $\alpha + \beta = \gamma$

Block math expressions:

$$
\begin{aligned}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} &= 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} &= \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} &= 0
\end{aligned}
$$

Matrix example:

$$
\begin{pmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{pmatrix}
\times
\begin{pmatrix}
x \\
y \\
z
\end{pmatrix}
=
\begin{pmatrix}
ax + by + cz \\
dx + ey + fz \\
gx + hy + iz
\end{pmatrix}
$$

### Lists

#### Deeply Nested Lists

1. First level
   - Second level item 1
   - Second level item 2
     - Third level item 1
       - Fourth level item 1
       - Fourth level item 2
     - Third level item 2
   - Second level item 3
2. Back to first level
   1. Ordered nested list
   2. Another ordered item
      - Mixed with unordered
      - More items
3. Final first-level item

#### Task Lists

- [x] Setup project
- [x] Install dependencies
- [x] Configure TypeScript
- [ ] Write tests
  - [x] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
- [ ] Deploy to production
- [ ] Monitor performance

## API Reference

### Core Components

#### `<Streamdown>`

The main component for rendering markdown.

**Props:**

```typescript
interface StreamdownProps {
  children: string;
  mode?: 'static' | 'streaming';
  parseIncompleteMarkdown?: boolean;
  shikiTheme?: BundledTheme;
  mermaid?: MermaidConfig;
  controls?: ControlsConfig;
  // ... more props
}
```

**Example:**

```tsx
<Streamdown
  mode="streaming"
  parseIncompleteMarkdown
  shikiTheme="github-dark"
  mermaid={{ theme: 'dark' }}
>
  {markdownContent}
</Streamdown>
```

### Utility Functions

#### `parseMarkdownIntoBlocks()`

Splits markdown into renderable blocks.

```typescript
function parseMarkdownIntoBlocks(markdown: string): string[];
```

#### `parseIncompleteMarkdown()`

Completes unterminated markdown formatting.

```typescript
function parseIncompleteMarkdown(markdown: string): string;
```

## Examples

### Streaming from an API

```typescript
import { Streamdown } from 'streamdown';
import { useState, useEffect } from 'react';

export function StreamingMarkdown() {
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchStream = async () => {
      const response = await fetch('/api/stream');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setContent(prev => prev + chunk);
      }
    };

    fetchStream();
  }, []);

  return (
    <Streamdown mode="streaming" parseIncompleteMarkdown>
      {content}
    </Streamdown>
  );
}
```

### Custom Components

```typescript
import { Streamdown } from 'streamdown';

const CustomCode = ({ node, ...props }) => {
  return (
    <code className="custom-code" {...props}>
      {props.children}
    </code>
  );
};

export function CustomizedStreamdown({ children }) {
  return (
    <Streamdown
      components={{
        code: CustomCode,
      }}
    >
      {children}
    </Streamdown>
  );
}
```

## Blockquotes

> ### Important Note
>
> Streamdown is designed specifically for AI streaming scenarios where markdown
> may arrive incomplete or malformed. It gracefully handles:
>
> - Unterminated code blocks
> - Incomplete formatting tokens
> - Partial tables
> - Broken links
>
> This makes it perfect for real-time AI applications!

## Horizontal Rules

---

***

___

## Links and References

Here are some useful links:
- [Official Documentation](https://streamdown.ai)
- [GitHub Repository](https://github.com/vercel/streamdown)
- [NPM Package](https://www.npmjs.com/package/streamdown)
- [Examples](https://streamdown.ai/examples)

### Footnotes

Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Performance Considerations

When working with large markdown documents or streaming scenarios, consider:

1. **Chunking**: Break large documents into smaller blocks
2. **Memoization**: Use React's memoization features
3. **Lazy Loading**: Defer rendering of off-screen content
4. **Throttling**: Control update frequency during streaming
5. **Virtual Scrolling**: For very long documents

### Code Example: Optimized Rendering

```typescript
import { Streamdown } from 'streamdown';
import { memo, useMemo } from 'react';

const OptimizedMarkdown = memo(({ content }: { content: string }) => {
  const blocks = useMemo(
    () => parseMarkdownIntoBlocks(content),
    [content]
  );

  return (
    <div className="markdown-container">
      {blocks.map((block, index) => (
        <Streamdown key={index} mode="static">
          {block}
        </Streamdown>
      ))}
    </div>
  );
});
```

## Conclusion

This comprehensive document demonstrates the various features and capabilities of markdown rendering. It includes:

- ✅ Text formatting (bold, italic, strikethrough)
- ✅ Headers (all levels)
- ✅ Lists (ordered, unordered, nested, tasks)
- ✅ Code blocks with syntax highlighting
- ✅ Tables
- ✅ Math expressions (inline and block)
- ✅ Blockquotes
- ✅ Links and references
- ✅ Horizontal rules
- ✅ Complex nesting and structure

Use this as a reference for testing rendering performance and feature completeness.
