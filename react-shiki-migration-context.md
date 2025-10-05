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

## 4. Testing

**All 253 package tests passing**: Multi-language rendering, concurrent blocks, component functionality, data attributes, language fallback.

**Website verified**: Theme toggle, system preferences, SSR, syntax highlighting all working with `next-themes` (sets both `.dark` class and `color-scheme`).

---

## Architecture

| Aspect | Original | Migrated |
|--------|----------|----------|
| Highlighters | Dual instances | Singleton |
| HTML output | Two (light/dark) | One + CSS variables |
| Theme switching | DOM visibility | `color-scheme` / `light-dark()` |
| Languages | Manual `Set` + sync | Shiki Registry |
| Code | ~100 lines | ~30 lines |
