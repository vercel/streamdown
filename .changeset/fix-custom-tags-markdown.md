---
"streamdown": patch
---

fix(custom-tags): render Markdown inside custom tags with multiline content

Adds a new rehype plugin (rehypeMarkdownInCustomTags) that re-parses raw text
content of custom tag elements as Markdown. Previously, when a custom tag
contained multiline content (e.g. `<ai-thinking>
**bold**</ai-thinking>`),
CommonMark treated the block as raw HTML, stripping Markdown formatting.
Tags listed in `literalTagContent` are excluded from re-parsing.

Closes #478
