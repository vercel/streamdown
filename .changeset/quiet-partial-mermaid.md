---
"streamdown": patch
---

fix(mermaid): stop showing "Mermaid Error" for a partial chart while its fence streams

- Keep the loader while a Mermaid fence is still streaming instead of showing the error for a partial chart
- Show the error once the fence closes, including when the final chart text is unchanged from the last partial render
