---
"streamdown": patch
---

Optimize Mermaid rendering performance with viewport-based lazy loading

- Add useDeferredRender hook for lazy loading components when entering viewport
- Use Intersection Observer + debounce + requestIdleCallback for optimal performance
- Only render Mermaid charts when they are visible or about to enter viewport
- Prevents page freezing when loading chat history with many Mermaid diagrams
- Fixes white screen issue when scrolling through chat messages with multiple diagrams
