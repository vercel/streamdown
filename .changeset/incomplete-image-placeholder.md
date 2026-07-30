---
"remend": patch
"streamdown": patch
---

Incomplete images during streaming now render a loading placeholder instead of being removed entirely. Incomplete images (e.g. `![alt](https://exampl`) are replaced with `![alt](streamdown:incomplete-image)` by remend, and the streamdown `ImageComponent` renders an animated skeleton for this special URL. This mirrors the existing behavior for incomplete links (`streamdown:incomplete-link`).
