---
"streamdown": patch
---

fix(animate): animate inline code during streaming

Skip the animate visitor on `pre` (and svg/math/annotation) only — not bare `code`. Fenced/highlighted blocks stay un-split via their `pre` ancestor; inline backtick spans now get the same per-word fade-in as surrounding prose.

Fixes #594
