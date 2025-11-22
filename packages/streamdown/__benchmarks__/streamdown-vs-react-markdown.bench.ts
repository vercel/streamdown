import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { bench, describe } from "vitest";
import { Markdown } from "../lib/markdown";

// Comprehensive markdown samples for realistic benchmarking
const samples = {
  simple: `# Hello World

This is a simple paragraph with **bold** and *italic* text.`,

  medium: `# Technical Documentation

## Introduction

This document covers the **implementation details** of our new API. The API provides \`REST\` endpoints for data manipulation.

### Features

- High performance
- Scalable architecture
- Easy to use
- Well documented

> **Note**: This is still in beta.

### Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

For more information, visit [our docs](https://example.com).`,

  gfm: `# GitHub Flavored Markdown Features

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Tables  | ✓      | High     |
| Task Lists | ✓   | Medium   |
| Strikethrough | ✓ | Low    |

## Task Lists

- [x] Implement parser
- [x] Add tests
- [ ] Write documentation
- [ ] Deploy to production

## Strikethrough

This is ~~incorrect~~ correct text.

## Autolinks

Check out https://github.com for more info.`,

  math: `# Mathematical Expressions

## Inline Math

The famous equation $E = mc^2$ relates energy and mass.

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

## Block Math

$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
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
$$`,

  complex: `# AI-Powered Development Platform

## Overview

Our platform uses **advanced machine learning** models to assist developers in writing better code faster. It supports multiple programming languages and integrates seamlessly with your existing workflow.

### Key Features

1. **Intelligent Code Completion**
   - Context-aware suggestions
   - Multi-language support
   - Fast response times (<100ms)

2. **Automated Testing**
   - Unit test generation
   - Integration test scaffolding
   - Coverage analysis

3. **Code Review Assistance**
   - Security vulnerability detection
   - Performance optimization suggestions
   - Best practice recommendations

## Technical Architecture

\`\`\`typescript
interface AIModel {
  name: string;
  version: string;
  capabilities: string[];
}

class CodeAssistant {
  private model: AIModel;

  constructor(model: AIModel) {
    this.model = model;
  }

  async complete(code: string, cursor: number): Promise<string[]> {
    const context = this.extractContext(code, cursor);
    const suggestions = await this.model.generate(context);
    return this.filterRelevant(suggestions);
  }

  private extractContext(code: string, cursor: number): string {
    // Implementation details...
    return code.substring(Math.max(0, cursor - 100), cursor);
  }
}
\`\`\`

### Performance Metrics

| Metric | Value | Benchmark |
|--------|-------|-----------|
| Latency | 85ms | <100ms |
| Accuracy | 94% | >90% |
| Throughput | 1000 req/s | >500 req/s |

### Mathematical Model

The prediction confidence is calculated as:

$$
P(c|x) = \\frac{e^{\\beta_c^T x}}{\\sum_{k=1}^K e^{\\beta_k^T x}}
$$

Where:
- $P(c|x)$ is the probability of class $c$ given input $x$
- $\\beta_c$ is the weight vector for class $c$
- $K$ is the total number of classes

## Getting Started

### Installation

\`\`\`bash
npm install @company/code-assistant
\`\`\`

### Quick Start

\`\`\`javascript
import { CodeAssistant } from '@company/code-assistant';

const assistant = new CodeAssistant({
  name: 'gpt-4',
  version: '1.0',
  capabilities: ['completion', 'refactoring', 'testing']
});

const suggestions = await assistant.complete(code, cursorPosition);
\`\`\`

## Task List

- [x] Core engine implementation
- [x] API design
- [x] Client SDK
- [ ] VS Code extension
- [ ] JetBrains plugin
- [ ] CLI tool

## Important Notes

> **Warning**: This requires an API key. Visit [our portal](https://dashboard.example.com) to get yours.

> **Tip**: Enable caching for better performance.

## Links and References

- [Documentation](https://docs.example.com)
- [GitHub Repository](https://github.com/company/code-assistant)
- [Issue Tracker](https://github.com/company/code-assistant/issues)

---

**Last Updated**: 2024-01-15 | **Version**: 1.0.0`,

  huge: `# Massive Document

${"## Section %INDEX%\n\nThis is a paragraph with **bold**, *italic*, and `code`. Here's a [link](https://example.com).\n\n```javascript\nconst value = %INDEX%;\nconsole.log(value);\n```\n\n".repeat(50).replace(/%INDEX%/g, (_match, offset) => String(Math.floor(offset / 200)))}

## Final Table

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
${Array.from({ length: 20 }, (_, i) => `| Value ${i}1 | Value ${i}2 | Value ${i}3 | Value ${i}4 |`).join("\n")}`,
};

describe("Streamdown vs React-Markdown - Simple Content", () => {
  bench(
    "streamdown - simple",
    () => {
      Markdown({ children: samples.simple });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - simple",
    () => {
      ReactMarkdown({ children: samples.simple });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - Medium Content", () => {
  bench(
    "streamdown - medium",
    () => {
      Markdown({ children: samples.medium });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - medium",
    () => {
      ReactMarkdown({ children: samples.medium });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - GFM Features", () => {
  bench(
    "streamdown - gfm (no plugins)",
    () => {
      Markdown({ children: samples.gfm });
    },
    { iterations: 1000 }
  );

  bench(
    "streamdown - gfm (with plugin)",
    () => {
      Markdown({
        children: samples.gfm,
        remarkPlugins: [remarkGfm],
      });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - gfm (no plugins)",
    () => {
      ReactMarkdown({ children: samples.gfm });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - gfm (with plugin)",
    () => {
      ReactMarkdown({
        children: samples.gfm,
        remarkPlugins: [remarkGfm],
      });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - Math Rendering", () => {
  const mathPlugins = {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  };

  bench(
    "streamdown - math",
    () => {
      Markdown({
        children: samples.math,
        ...mathPlugins,
      });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - math",
    () => {
      ReactMarkdown({
        children: samples.math,
        ...mathPlugins,
      });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - Complex Content", () => {
  const plugins = {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeRaw, rehypeKatex],
  };

  bench(
    "streamdown - complex (no plugins)",
    () => {
      Markdown({ children: samples.complex });
    },
    { iterations: 1000 }
  );

  bench(
    "streamdown - complex (with plugins)",
    () => {
      Markdown({
        children: samples.complex,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - complex (no plugins)",
    () => {
      ReactMarkdown({ children: samples.complex });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - complex (with plugins)",
    () => {
      ReactMarkdown({
        children: samples.complex,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - Large Content", () => {
  const plugins = {
    remarkPlugins: [remarkGfm],
  };

  bench(
    "streamdown - huge document",
    () => {
      Markdown({
        children: samples.huge,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - huge document",
    () => {
      ReactMarkdown({
        children: samples.huge,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - Processor Caching", () => {
  const plugins = {
    remarkPlugins: [remarkGfm, remarkMath],
  };

  // Warm up both caches
  Markdown({ children: samples.medium, ...plugins });
  ReactMarkdown({ children: samples.medium, ...plugins });

  bench(
    "streamdown - cached processor",
    () => {
      Markdown({
        children: samples.medium,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - cached processor",
    () => {
      ReactMarkdown({
        children: samples.medium,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );

  bench(
    "streamdown - cached processor, different content",
    () => {
      Markdown({
        children: samples.gfm,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - cached processor, different content",
    () => {
      ReactMarkdown({
        children: samples.gfm,
        ...plugins,
      });
    },
    { iterations: 1000 }
  );
});

describe("Streamdown vs React-Markdown - Streaming Simulation", () => {
  // Simulate incremental content as in streaming scenarios
  const streamingSteps = Array.from({ length: 20 }, (_, i) =>
    samples.complex.substring(0, (i + 1) * (samples.complex.length / 20))
  );

  const plugins = {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  };

  bench(
    "streamdown - streaming (20 incremental parses)",
    () => {
      for (const step of streamingSteps) {
        Markdown({
          children: step,
          ...plugins,
        });
      }
    },
    { iterations: 1000 }
  );

  bench(
    "react-markdown - streaming (20 incremental parses)",
    () => {
      for (const step of streamingSteps) {
        ReactMarkdown({
          children: step,
          ...plugins,
        });
      }
    },
    { iterations: 1000 }
  );
});
