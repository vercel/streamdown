---
"streamdown": minor
---

feat: add image control options (`controls.image`) to disable hover overlay and download button on images

Add `image` to the `controls` prop, matching existing `code`, `table`, and `mermaid` patterns:
- `controls={{ image: false }}` hides the hover overlay and download button
- `controls={{ image: { download: false } }}` keeps the hover overlay but hides the download button
