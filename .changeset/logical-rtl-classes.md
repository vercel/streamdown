---
"streamdown": patch
---

fix: use logical Tailwind classes (`ps-*`, `border-s-*`, `text-start`, `start-*`, `end-*`, `ms-*`) instead of physical left/right classes so layout mirrors in RTL text. `cn` now treats logical and physical utilities on the same axis as conflicting, so a consumer `className="pl-8"` still overrides the built-in padding. The code block keeps physical classes because it is pinned `dir="ltr"`.
