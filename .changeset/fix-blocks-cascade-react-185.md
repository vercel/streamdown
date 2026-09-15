---
"streamdown": patch
---

Fix React #185 (`Maximum update depth exceeded`) cascade under rapid streaming token bursts.

Replaces the internal `useState` + `useEffect`-to-sync + manual `startTransition`
dance that mirrored `blocks` into `displayBlocks` with `useDeferredValue`. The
previous pattern fired `setDisplayBlocks(blocks)` on every render where `blocks`
was a new reference; under SSE bursts that delivered tokens faster than React
committed, those setStates stacked inside one commit cycle and exceeded React's
50-nested-update limit. `useDeferredValue` performs the same semantic role
(low-priority blocks-state update during streaming) without producing setStates
that can cascade.

No behavior change: SSR/hydration still initializes with the current `blocks`,
`animatePlugin` path still uses synchronous (non-deferred) blocks, all 982
existing tests pass.

Closes the cluster of issues tracked in #140; addresses the React #185 reports
in downstream consumers when `experimental_throttle` alone is insufficient.
