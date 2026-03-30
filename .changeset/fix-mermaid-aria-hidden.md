---
'streamdown': patch
---

fix(mermaid): add aria-hidden to decorative SVG icons in mermaid toolbar buttons

Mermaid toolbar buttons (download, fullscreen, pan/zoom controls) already have
accessible titles/labels, but the inline SVG icons were exposed to the accessibility
tree causing "Content with images must be labeled" warnings. Added aria-hidden={true}
to all decorative icon elements in download-button, fullscreen-button, and pan-zoom
components.

Fixes #485
