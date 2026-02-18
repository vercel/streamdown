---
"streamdown": minor
---

Add `useIsCodeFenceIncomplete` hook for detecting incomplete code fences during streaming

Custom components can now detect when the code fence in their block is still being streamed. This is useful for deferring expensive renders (syntax highlighting, Mermaid diagrams) until the code block is complete.

```tsx
import { useIsCodeFenceIncomplete } from 'streamdown';

const MyCodeBlock = ({ children }) => {
  const isIncomplete = useIsCodeFenceIncomplete();

  if (isIncomplete) {
    return <div>Loading code...</div>;
  }

  return <pre><code>{children}</code></pre>;
};
```

The hook returns `true` when:
- Streaming is active (`isAnimating={true}`)
- The component is in the last block being streamed
- That block has an unclosed code fence

The default code block component now uses this hook to set a `data-incomplete` attribute when incomplete, enabling CSS-based loading states.
