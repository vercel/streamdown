# React-Shiki Migration

Migration from custom dual-highlighter implementation to react-shiki with Shiki singleton. Reduces ~100 lines of custom highlighter management to ~30 lines while improving language persistence and eliminating race conditions.

---

## 1. Multi-Theme Highlighting

**Original (PR #40, Aug 2025)**: Two highlighter instances (light/dark), generated two HTML outputs, used `dark:hidden`/`dark:block` for theme switching.

**Migrated**: Single `getSingletonHighlighter` with both themes, one HTML output with CSS variables, `light-dark()` function for theme switching.

**Breaking change**: Requires `color-scheme` property (not just `.dark` class). `next-themes` sets both automatically, but standard Tailwind dark mode users must add `color-scheme` management.

**Solutions**:
1. Document `color-scheme` requirement
2. Add MutationObserver to sync `.dark` class → `color-scheme`

---

## 2. HTML Transformations

**Original**: Regex-based string manipulation for `preClassName` injection and background removal.

**Migrated**: HAST transformers (`preClassTransformer`, `removeBackgroundTransformer`) operating on abstract syntax tree.

---

## 3. Language Loading

**Original (Issue #78, PR #80)**: `HighlighterManager` class (~100 lines) with manual `Set<BundledLanguage>` tracking, synchronized loading across dual highlighters, `initializationPromise` for race conditions. Theme changes cleared languages, recreated highlighters, pre-loaded all languages. Used `createJavaScriptRegexEngine` per PR #77.

**Migrated**: `getSingletonHighlighter` with manual language loading (required when passing custom highlighter to react-shiki).

```typescript
async function getStreamdownHighlighter(themes, lang) {
  const highlighter = await getSingletonHighlighter({
    themes,
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true })
  });

  if (lang !== "text" && Object.hasOwn(bundledLanguages, lang)) {
    if (!highlighter.getLoadedLanguages().includes(lang)) {
      await highlighter.loadLanguage(lang);
    }
  }

  return highlighter;
}
```

**Why manual loading**: React-shiki's `highlighterFactory` auto-loads languages, but skips when custom highlighter provided. Falls back to `plaintext` if language not loaded.

**Improvements**: Languages persist in Registry (never cleared), no manual tracking, no synchronization, no race conditions. ~100 lines → ~8 lines.

---

## 4. Further Simplification (react-shiki 0.9.0)

**Migration to react-shiki 0.9.0**: Upgraded from 0.8.0 to leverage new `engine` parameter support, eliminating custom highlighter creation.

**Before (0.8.0)**:
```typescript
// Create custom highlighter to use JS engine
const highlighter = await getSingletonHighlighter({
  themes: [lightTheme, darkTheme],
  langs: [],
  engine: createJavaScriptRegexEngine({ forgiving: true }),
});

// Manually load language
if (!highlighter.getLoadedLanguages().includes(lang)) {
  await highlighter.loadLanguage(lang);
}

// Pass custom highlighter
useShikiHighlighter(code, lang, themes, { highlighter });
```

**After (0.9.0)**:
```typescript
// Just pass engine as an option - react-shiki handles the rest!
useShikiHighlighter(code, lang, themes, {
  engine: createJavaScriptRegexEngine({ forgiving: true }),
  transformers: [...],
});
```

**Improvements**: No highlighter state management, no manual language loading, no custom highlighter creation. React-shiki's internal factory handles everything. ~30 lines → ~15 lines of highlighter-related code.

---

## 5. Testing

**All 253 package tests passing**: Multi-language rendering, concurrent blocks, component functionality, data attributes, language fallback.

**Website verified**: Theme toggle, system preferences, SSR, syntax highlighting all working with `next-themes` (sets both `.dark` class and `color-scheme`).

---

## 6. v1.4 Integration (October 2025)

**Integrated Features**:
- `isAnimating` prop to disable copy/download buttons during streaming
- rehype-harden plugin system (replaced harden-react-markdown wrapper)
- Exported `defaultRehypePlugins` and `defaultRemarkPlugins` for customization
- Proper timeout cleanup with `useRef` in button components
- StreamdownRuntimeContext for runtime state management

**Breaking Changes from v1.3**:
- `allowedImagePrefixes`, `allowedLinkPrefixes`, `defaultOrigin` props removed → use `rehypePlugins` with harden config
- Props now passed directly to ReactMarkdown instead of through wrapper

**Migration Path**:
```typescript
// v1.3 (deprecated)
<Streamdown
  allowedImagePrefixes={["https://cdn.example.com"]}
  allowedLinkPrefixes={["https://example.com"]}
/>

// v1.4+ (recommended)
import { defaultRehypePlugins } from 'streamdown';
import { harden } from 'rehype-harden';

<Streamdown
  rehypePlugins={[
    [harden, {
      allowedImagePrefixes: ["https://cdn.example.com"],
      allowedLinkPrefixes: ["https://example.com"],
      defaultOrigin: undefined,
      allowDataImages: true,
    }],
    ...Object.values(defaultRehypePlugins).filter(p => p[0] !== harden),
  ]}
/>
```

**Testing**: All 258 package tests passing ✅

---

## Architecture

| Aspect | Original | Migrated (0.8.0) | Optimized (0.9.0) | Integrated (v1.4) |
|--------|----------|------------------|-------------------|-------------------|
| Highlighters | Dual instances | Singleton (custom) | Singleton (react-shiki managed) | Singleton (react-shiki managed) |
| HTML output | Two (light/dark) | One + CSS variables | One + CSS variables | One + CSS variables |
| Theme switching | DOM visibility | `color-scheme` / `light-dark()` | `color-scheme` / `light-dark()` | `color-scheme` / `light-dark()` |
| Language loading | Manual `Set` + sync | Manual on-demand | Automatic (react-shiki) | Automatic (react-shiki) |
| Highlighter creation | Manual dual | Manual singleton | react-shiki factory | react-shiki factory |
| Streaming UX | N/A | N/A | N/A | Disabled buttons during streaming |
| Plugin System | harden-react-markdown | harden-react-markdown | harden-react-markdown | rehype-harden + exports |
| Code complexity | ~100 lines | ~30 lines | ~15 lines | ~20 lines (w/ runtime context) |
