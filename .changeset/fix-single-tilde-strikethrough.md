---
"remend": minor
---

Escape single `~` between word characters to prevent false strikethrough rendering (e.g. `20~25°C` no longer renders as strikethrough). Adds a new `singleTilde` option (enabled by default) that can be disabled via `{ singleTilde: false }`.
