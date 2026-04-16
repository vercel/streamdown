---
"streamdown": patch
---

fix(mermaid): add data-streamdown, aria-modal, and correct role to fullscreen overlay

The Mermaid fullscreen overlay was missing the `data-streamdown="mermaid-fullscreen"` attribute and using `role="button"` instead of `role="dialog"`, and was missing `aria-modal="true"`. This matches the table fullscreen overlay pattern and enables stable CSS targeting and correct accessibility semantics.
