---
"streamdown": patch
---

### Pass the original thrown value to the Mermaid `errorComponent` as an optional `cause` prop, so custom error components can read structured parser details such as the Jison `hash` without re-parsing the chart.
- Add an optional `cause?: unknown` property to `MermaidErrorComponentProps`.
- Preserve the original thrown error in the Mermaid rendering failure result.
- Forward the original error object to custom error components without losing parser-specific details.
- Maintain backward compatibility with existing custom error components.
- Enable access to structured Jison and Langium parser errors without performing an additional parse.