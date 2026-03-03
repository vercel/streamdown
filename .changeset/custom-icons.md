---
"streamdown": minor
---

Add support for customizing icons via the `icons` prop on `<Streamdown>`.

Users can override any subset of the built-in icons (copy, download, zoom, etc.) by passing a `Partial<IconMap>`:

```tsx
import { Streamdown, type IconMap } from "streamdown";

<Streamdown icons={{ CheckIcon: MyCheckIcon }}>
  {content}
</Streamdown>
```

Unspecified icons fall back to defaults.
