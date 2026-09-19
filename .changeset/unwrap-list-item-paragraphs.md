---
"streamdown": patch
---

fix: unwrap a single paragraph child inside list items

Loose list items from the markdown pipeline are often wrapped in a `<p>`. `MemoLi` now detects that sole paragraph child (including the memoized paragraph component) and renders its contents directly, so list items stay visually tight. Also updates the list animation retrigger test to match the unwrapped markup.

Fixes #475
