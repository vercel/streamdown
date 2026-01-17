import { Streamdown } from "streamdown";

const markdown = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Text Formatting

This is **bold text** and this is *italic text*.

You can also use __bold__ and _italic_ with underscores.

This is ***bold and italic*** text.

This is ~~strikethrough~~ text.

## Lists

### Unordered List

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered List

1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item

### Task List

- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Links and Images

[This is a link](https://example.com)

![Alt text for image](https://via.placeholder.com/300x200)

## Code

Inline \`code\` looks like this.

### Code Block

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

const result = greet("World");
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

## Blockquotes

> This is a blockquote.
> It can span multiple lines.
>
> > This is a nested blockquote.

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |

| Left aligned | Center aligned | Right aligned |
|:-------------|:--------------:|--------------:|
| Left         | Center         | Right         |
| L            | C              | R             |

## Horizontal Rule

---

## Math (KaTeX)

Inline math: $E = mc^2$

Block math:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9
\\end{bmatrix}
$$

## HTML

<div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px;">
  <p>This is <strong>HTML</strong> content inside markdown.</p>
</div>

## Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug it]
    D --> B
    C --> E[End]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Server
    participant Database

    User->>Server: Request data
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>User: Response
\`\`\`

## Footnotes

Here's a sentence with a footnote[^1].

Here's another one[^note].

[^1]: This is the first footnote.
[^note]: This is a named footnote.

## Emojis and Special Characters

:smile: :heart: :rocket:

Copyright © 2024 | Trademark ™ | Registered ®

## CJK (Chinese, Japanese, Korean) Support

这是中文测试文本。**粗体中文**和*斜体中文*。

これは日本語のテストテキストです。**太字**と*斜体*。

이것은 한국어 테스ト 텍스트입니다. **굵게**와 *기울임꼴*.

## Auto-linking

https://www.example.com

user@example.com

## Escaping Characters

You can escape special characters: \\* \\_ \\# \\[ \\]
`;

const StaticPage = () => (
  <div className="mx-auto max-w-prose py-12">
    <Streamdown mode="static">{markdown}</Streamdown>
  </div>
);

export default StaticPage;
