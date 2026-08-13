---
"streamdown": patch
---

Fix doubled `user-content-` prefix on footnote ids

Footnote list items were rendered with `id="user-content-user-content-fn-1"` because both `remark-rehype` and `rehype-sanitize` default their `clobberPrefix` to `user-content-`, so the prefix was applied twice. Disabled `clobberPrefix` on `rehype-sanitize` so `remark-rehype` remains the single, consistent prefixer of both footnote ids and backref hrefs — restoring working footnote navigation.
