export const SAMPLE_MARKDOWN = `# Streamdown comparison

This is **bold**, *italic*, ~~strikethrough~~ and \`inline code\`. Here is a [link](https://streamdown.ai) and an autolink: https://vercel.com

## Lists

- Item one
- Item two
  - Nested item
- [x] Completed task
- [ ] Incomplete task

1. First
2. Second

> A blockquote with **formatting** inside.

## Table

| Feature | Released | Local |
|:--------|:--------:|------:|
| Code    | yes      | yes   |
| Math    | yes      | yes   |
| Mermaid | yes      | yes   |

## Code

\`\`\`tsx
import { Streamdown } from "streamdown";

export const Message = ({ text }: { text: string }) => (
  <Streamdown isAnimating>{text}</Streamdown>
);
\`\`\`

## Math

Inline math: $E = mc^2$

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Mermaid

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug it]
    D --> B
\`\`\`

## CJK

这是中文测试文本。**粗体中文**和*斜体中文*。

これは日本語のテストテキストです。**太字**と*斜体*。

## Footnotes

Here's a sentence with a footnote[^1].

[^1]: This is the footnote.
`;
