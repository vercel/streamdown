---
"streamdown": patch
---

fix(mermaid): show the render error even when a last valid SVG is kept

- Surface the current render error alongside the last valid diagram instead of silently hiding it, so readers can tell a chart edit broke the diagram
- Keep showing the last valid SVG (no flicker), only the full-page error view is reserved for when there is nothing valid to fall back on
