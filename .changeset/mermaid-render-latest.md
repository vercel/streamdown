---
"streamdown": patch
---

Render Mermaid diagrams one at a time while their code fence streams, pausing after each render for as long as it took, so a growing diagram no longer holds up the stream. Once the fence closes or the stream stops, the final diagram renders without a pause.
