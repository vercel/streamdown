---
"streamdown": minor
---

Fix Mermaid diagrams so text is readable and diagrams auto-fit container.
- Normalize SVG to remove responsive shrinking  
- Extract intrinsic size from viewBox  
- Add width-and-height auto-fit in PanZoom  
- Preserve user zoom/pan after initial fit  
- Add tests for SVG utilities and auto-fit behavior
