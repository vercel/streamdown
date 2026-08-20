---
"streamdown": patch
---

Re-render memoized markdown components when their rendered output changes. The comparators compared source position, so a replacement of the same length — occupying the same lines and columns — was treated as unchanged and the component kept rendering the previous text.
