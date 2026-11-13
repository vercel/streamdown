---
"streamdown": patch
---

fix(animate): keep the animate spans after `isAnimating` turns false until the last scheduled word has finished fading, so words still waiting on their stagger delay no longer pop in all at once. Also document the `stagger` and `maxBacklogMs` animation options.
