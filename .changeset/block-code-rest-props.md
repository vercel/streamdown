---
"streamdown": patch
---

Forward rest props through block code. The `code` component spread its rest props on the inline branch and dropped them on the block branch, so an attribute a consumer put on a fenced code element never reached the DOM. `CodeBlockBody` now takes part in that comparison, so a forwarded attribute updates instead of keeping the value it first rendered with.
