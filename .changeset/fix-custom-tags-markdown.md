---
"streamdown": patch
---

fix(custom-tags): render Markdown inside custom tags with multiline content

Adds a preprocessing step (`preprocessCustomTags`) that normalizes multiline
custom tags into a blank-line-sandwiched HTML block so CommonMark interrupts
the raw-HTML block and parses the nested content as Markdown, with
`parseMarkdownIntoBlocks` re-merging the interrupted open/content/close tokens
so streaming still treats the whole custom tag as one block. Previously, when a
custom tag contained multiline content (e.g. `<ai-thinking>
**bold**</ai-thinking>`), CommonMark treated the block as raw HTML, stripping
Markdown formatting. Tags listed in `literalTagContent` are excluded from
re-parsing.

Closes #478
