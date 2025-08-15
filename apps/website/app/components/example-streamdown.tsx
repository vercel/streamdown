'use client';

import { useEffect, useState } from 'react';
import { Streamdown } from 'streamdown';

const markdown = `# Styling the Web: A Modern CSS Journey

CSS has come a long way since its inception. From simple layout tweaks to complex responsive designs, it's become an essential tool for crafting delightful web experiences. In this article, we’ll explore various HTML elements commonly styled with modern CSS utility systems like \`tailwindcss\` and component libraries.

## Introduction

Web design today is more accessible than ever. Thanks to utility-first frameworks and component-based architectures, developers can build beautiful UIs with less effort.

### Key Benefits of Utility CSS

- Faster development
- Consistent design system
- Better collaboration between dev and design

### What You Need

1. Basic HTML/CSS knowledge
2. Code editor (e.g., VS Code)
3. Modern browser for testing

## Checklist

- Install Tailwind CSS
- Configure PostCSS
- Create base components

## Sample Image

Here's a sample image to test image styling. Make sure it scales well on all screen sizes.

![Cute kitten](https://placehold.co/600x400)

## Code Example

\`\`\`
.button {
  @apply px-4 py-2 bg-blue-600 text-white rounded;
}
\`\`\`

## Blockquote

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

## Table Example

| Framework     | Type                    | Stars  |
| ------------- | ----------------------- | ------ |
| Tailwind CSS  | Utility-First           | 70k+   |
| Bootstrap     | Component-Based         | 160k+  |
| Bulma         | Utility/Component Hybrid| 45k+   |

## Inline Elements

You can **bold** text, _italicize_ it, underline it, or even add [links](https://example.com). Here’s some \`inline code\` too.

## Superscript & Subscript

E = mc2 is Einstein's mass-energy equivalence. Water is H 2O.
`;

const tokens = markdown.split(' ').map((token) => `${token} `);

export const StreamdownExample = () => {
  const [content, setContent] = useState('');
  const SPEED = 1000;

  useEffect(() => {
    let currentContent = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < tokens.length) {
        currentContent += tokens[index];
        setContent(currentContent);
        index++;
      } else {
        clearInterval(interval);
      }
    }, SPEED);

    return () => clearInterval(interval);
  }, []);

  return <Streamdown>{content}</Streamdown>;
};
