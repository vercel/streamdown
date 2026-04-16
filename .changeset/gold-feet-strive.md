---
"streamdown": patch
---

Fix mermaid fullscreen overlay accessibility and add stable selector

- Add `data-streamdown="mermaid-fullscreen"` to fullscreen overlay for stable CSS targeting
- Update fullscreen overlay semantics to match table fullscreen behavior
- Change `role` from `button` to `dialog`
- Add `aria-modal="true"` for correct screen reader modal behavior
- Improve accessibility consistency between mermaid and table fullscreen overlays
