---
"streamdown": patch
---

fix: set `data-*` and `aria-*` props on the root element. They were only forwarded to the Markdown renderer and the blocks, so with the default renderer attributes such as `data-testid` or `aria-busy` reached no element.
