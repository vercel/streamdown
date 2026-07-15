---
"streamdown": minor
---

- Add `codeDownload.baseFileName` to customize downloaded code filenames
- Preserve automatic language-to-extension mapping for downloaded files
- Keep existing `file.<ext>` behavior as the default when not configured
- Expose the configuration through `StreamdownContext` without prop drilling
