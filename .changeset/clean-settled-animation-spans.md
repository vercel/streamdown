---
"streamdown": patch
---

Fix animation spans not being removed from settled text when `isAnimating` goes false. Include `isAnimating` in block keys so React mounts fresh subtrees when the animate rehype plugin is removed from the pipeline, allowing the span-free reparse to commit.
