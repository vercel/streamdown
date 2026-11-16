---
"streamdown": patch
---

Distinguish remark and rehype plugins by function identity when caching processors, so same-name plugins with different closures do not reuse each other's behavior. Apps that create plugin functions during render now get a new processor on each render. This is slower for that pattern but does not grow memory; create plugins once (module scope or `useMemo`) to keep cache hits.
