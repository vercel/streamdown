---
"streamdown": patch
---

Add PanZoom controls configurability for Mermaid diagrams.

- Support `controls.mermaid.panZoom` (boolean) to toggle zoom controls globally
- Support `mermaid.config.panZoom` (boolean or `{ showControls?: boolean }`) per-instance
- Keep defaults enabled; `false` explicitly hides the zoom controls

This is a non-breaking enhancement that aligns with existing control predicates.
