---
"streamdown": patch
---

fix: restore `user-content-` clobberPrefix on sanitize so raw HTML ids cannot clobber `window`, and strip the doubled prefix on footnote ids that remark-rehype already prefixed.
