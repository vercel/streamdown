---
"streamdown": patch
---

Fix footnote detection incorrectly matching regex character classes

The footnote reference and definition patterns were too permissive, using `[^\]\s]` which matches any character except `]` and whitespace. This caused regex negated character classes like `[^\s...]` in code blocks to be incorrectly detected as footnotes, resulting in the entire document being returned as a single block.

Updated the patterns to only match valid footnote identifiers (alphanumeric characters, underscores, and hyphens) using `[\w-]` instead.
