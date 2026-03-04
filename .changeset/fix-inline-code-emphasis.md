---
"remend": patch
---

Fix emphasis completion handlers incorrectly closing bold/italic/strikethrough markers that appear inside complete inline code spans (e.g. `` `**bold` `` no longer gets a stray `**` appended outside the backticks).
