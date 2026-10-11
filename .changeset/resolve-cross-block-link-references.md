---
"streamdown": patch
---

fix: resolve reference links whose definition is in another block

Documents with link reference definitions (`[label]: url`) are now kept in a single block, the same way documents with footnotes are, so `[text][label]` resolves instead of rendering as raw text.
