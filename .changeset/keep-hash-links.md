---
"streamdown": patch
---

Only rewrite `#` links to the `user-content-` prefix when their target id was clobbered, so hash-route and same-page links to ids the host app owns keep working.
