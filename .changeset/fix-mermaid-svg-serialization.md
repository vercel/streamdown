---
"streamdown": patch
---

fix(mermaid): use XMLSerializer to produce valid SVG/XML on download

Mermaid renders diagrams via `innerHTML`, which allows the browser to
normalize elements like `<br />` to their HTML void form (`<br>`).
Saving that raw string as an SVG file (or converting it to PNG via a
canvas) fails because SVG/XML parsers reject the non-self-closing element.

Add `sanitizeSvgForExport` which re-parses the SVG string through a
temporary DOM node and re-serializes it with `XMLSerializer.serializeToString`,
producing a valid XML document.  Both the SVG download path and the PNG
conversion path now sanitize the SVG before use.

Fixes #516
