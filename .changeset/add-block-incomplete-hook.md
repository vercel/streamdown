---
"streamdown": minor
---

Add `useIsBlockIncomplete` hook for detecting incomplete streaming blocks

Custom components can now detect when the block they're rendering is still being streamed (incomplete). This is useful for showing loading states in code blocks during streaming.

```tsx
import { useIsBlockIncomplete } from 'streamdown';

const MyCodeBlock = ({ children }) => {
  const isBlockIncomplete = useIsBlockIncomplete();

  if (isBlockIncomplete) {
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
