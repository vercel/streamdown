---
"streamdown": patch
---

Render the link safety modal through a portal to `document.body` so it is no longer nested inside the paragraph's `<p>` element. This fixes the React hydration error "In HTML, `<div>` cannot be a descendant of `<p>`" that occurred when a link with link safety enabled appeared inside a paragraph.
