---
"streamdown": patch
---

Reuse the document-wide HTML ID lookup across streaming blocks to avoid quadratic ID copying and processor cache-key serialization while preserving sanitized fragment links.
