---
"remend": minor
---

Rework code-region detection and double-underscore counting.

A shared single-pass scanner now classifies fences and inline code spans, replacing the per-character rescans that made healing quadratic on delimiter-heavy input. Fence and span detection follows CommonMark, so `~~~` fences, list-indented fences, CRLF line endings, and multi-backtick spans are all recognized, and content inside code is never healed as prose.

Double underscores are counted per maximal run with flanking rules, so identifiers containing `__` (like `snake__case`) no longer invent or swallow emphasis closers.

Healing is now idempotent. Healed output re-heals to itself, including incomplete image removal and the trailing space it exposes.
