---
"streamdown": patch
---

Fix accessibility warnings for Mermaid toolbar icon buttons:

- Add `aria-hidden="true"` to all decorative SVG icons to hide them from screen readers
- Add `aria-label` attributes to all icon-only buttons for proper screen reader announcements
- Add translation keys (`zoomIn`, `zoomOut`, `resetView`) for zoom controls
