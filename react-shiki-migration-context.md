# Migrating Streamdown to react-shiki

This document tracks the migration of Streamdown's syntax highlighting implementation from a custom dual-highlighter shiki powered setup to using react-shiki, with significant simplification of the highlighting logic. react-shiki codebase is available locally at `../../../react-shiki`.

The goal of this migration is to handle the syntax highlighting logic in Streamdown with react-shiki rather than Streamdown's own custom implementation of Shiki.

---

## 1. Multi-Theme Highlighting Approach

### 1.1 Streamdown's Original Implementation

Streamdown maintained two separate Shiki highlighter instances - one for light theme and one for dark theme. This was implemented via a `HighlighterManager` class that:

- Created and managed separate `lightHighlighter` and `darkHighlighter` instances
- Generated two separate HTML outputs (one for each theme)
- Used Tailwind's `dark:hidden` and `dark:block` classes to show/hide the appropriate themed output

The `HighlighterManager` class handled:
- **Highlighter initialization**: Created highlighters with `createHighlighter({ themes: [theme], langs: [...], engine: jsEngine })`
- **Theme change detection**: Recreated highlighters when themes changed, clearing the language cache
- **Synchronized operations**: Used `initializationPromise` to prevent concurrent initialization

**Context-driven themes**: Themes to use for highlighting are provided via `ShikiThemeContext` from the parent application (defaults to `["github-light", "github-dark"]`). This does not control the switching mechanism.

### 1.2 Design Context & Historical PRs

📝 NOTE FOR FURTHER RESEARCH: Use gh cli to view more relevant PRs and issues for more context in an effort to understand the decisions the streamdown engineers made when architecting the syntax highlighting components of streamdown. Focus primarily on PRs/commits that changed the code-block.tsx file, or other relevant files that relate to syntax highlighting implementation 📝

**PR #40: Introduction of Dual Highlighters**

**Finding**: PR #40 ("fix: codeblock dark mode and background") introduced the dual highlighter approach.

**Observation**: The PR description and commits do not provide explicit justification for why dual highlighters were chosen over Shiki's native multi-theme support with CSS variables. Maybe it has to do with the way the streamdown is expected to be used by applications like `apps/website` and user projects.

**Hypothesis**: This decision was likely made because:
1. Tailwind's class-based dark mode (`dark:` prefix) is straightforward to implement with dual HTML outputs
2. May have predated robust multi-theme support in Shiki
3. Avoids CSS variable complexity in favor of explicit DOM-based theme switching
4. Provides predictable, isolated outputs for each theme

**Further research needed**: Review Shiki's multi-theme timeline and capabilities at the time of PR #40.

### 1.3 Current react-shiki Implementation

⚠️ NOTE FOR UPDATE: This isn't completely accurate, the react-shiki highlighter is still exporting a light and dark highlighter instance ⚠️
📝 NOTE FOR FURTHER RESEARCH: Research and review the current streamdown react-shiki implementation to better understand it's architecture with respect to the dual highlighter approach 📝

**Before**: Two separate highlighters, two HTML outputs, Tailwind class-based switching
**After**: One highlighter with both themes, single HTML output with CSS variables, automatic theme switching via `color-scheme`

```typescript
// Old approach (simplified)
const lightHighlighter = await createHighlighter({ themes: [lightTheme], ... });
const darkHighlighter = await createHighlighter({ themes: [darkTheme], ... });
const lightHtml = lightHighlighter.codeToHtml(code, { theme: lightTheme });
const darkHtml = darkHighlighter.codeToHtml(code, { theme: darkTheme });
// Render both with dark:hidden/dark:block classes

// New approach
const highlighter = await createHighlighter({
  themes: [lightTheme, darkTheme],
  engine: jsEngine
});
const html = useShikiHighlighter(code, language,
  { light: lightTheme, dark: darkTheme },
  { highlighter, defaultColor: 'light-dark()' }
);
// Single HTML with CSS variables that respond to color-scheme
```

### 1.4 Open Questions & Research Needed

📝 NOTE FOR FURTHER RESEARCH: Find out how the apps/website project uses streamdown's highlighting, and how they manage dark mode 📝
📝 NOTE FOR FURTHER RESEARCH: How does using `dark:hidden`/`dark:block` coincide with the rest of the light/dark theme switching approach? Particularly the dual highlighter approach. If dual highlighters are still both being run, then there isn't a performance benefit to it and it seems redundant 📝

**Questions to answer**:
1. Is the current implementation actually using a single highlighter or still dual highlighters?
2. Why do we still export a light and dark highlighter instance?
3. Why do we still use `dark:hidden`/`dark:block` Tailwind classes / How does using `dark:hidden`/`dark:block` coincide with the rest of the light/dark theme switching approach?
4. Does Shiki's CSS variable approach (`defaultColor: 'light-dark()'`) work seamlessly with Streamdown's Tailwind setup?
5. Do we need to set `color-scheme: light dark` in the CSS?
6. Is there any JavaScript theme management that needs updating?
7. How does `apps/website` currently implement theme switching? Uses `color-scheme` property? JavaScript toggle?
8. Investigation into how `apps/website` handles theme switching on the client
10. Review of any performance considerations that influenced the dual highlighter decision
11. Timeline of Shiki's multi-theme CSS variable support relative to Streamdown's implementation

### 1.5 Testing Requirements

- `apps/website` theme switching should work as expected
- System preference changes (prefers-color-scheme media query)
- Manual theme toggle (if applicable)
- SSR/initial render in both light and dark modes
- Visual regression testing compared to dual highlighter approach

---

## 2. HTML Transformations (preClassName & Background Removal)

### 2.1 Streamdown's Original Implementation

- **preClassName injection**: Used regex to inject custom classes into the `<pre>` tag: `html.replace(PRE_TAG_REGEX, '<pre class="${preClassName}"$1')`
- **Background removal**: Stripped background styles from generated HTML using regex: `html.replace(/(<pre[^>]*)(style="[^"]*background[^";]*;?[^"]*")([^>]*>)/g, '$1$3')`

### 2.2 Design Context & Historical PRs

**PR #69**: Major UX redesign that introduced:
- `preClassName` parameter for custom styling injection
- `removePreBackground` function to strip theme backgrounds
- Enhanced header structure with language labels and action buttons

### 2.3 Current react-shiki Implementation

Created two transformers to replicate Streamdown's original HTML transformations using Shiki's transformer API:

**1. preClassTransformer**: Injects custom classes into the `<pre>` tag via the `pre(node)` hook
**2. removeBackgroundTransformer**: Strips background styles from the `<pre>` element, handling both string and object style properties

**Improvement over original**: Both transformers operate on the HAST (Hypertext Abstract Syntax Tree) rather than regex-based string manipulation.

### 2.4 Testing Requirements

- Verify custom classes applied correctly
- Verify backgrounds removed
- **Testing**: Passed all tests in packages/streamdown/__tests__/

---

## 3. Language Resolution & Dynamic Loading

### 3.1 Streamdown's Original Implementation

**Issue #78 → PR #80: Multi-Language Rendering Bug**

Version 1.1.7 failed when rendering multiple code blocks with different languages simultaneously. Only the first language loaded; subsequent blocks threw Shiki errors and failed to render.

**Root cause**: Global cache had race conditions and didn't properly track loaded languages across concurrent component instances.

**Solution**: `HighlighterManager` singleton with centralized language tracking (`Set<BundledLanguage>`), synchronized initialization (`initializationPromise`), and language preservation during theme changes (pre-loads all previously loaded languages when recreating highlighters).

---

The `HighlighterManager` class (~100 lines) handled:
- **Fallback handling**: Defaulted to "text" language for unsupported languages
- **Language loading**: Tracked loaded languages in a `Set<BundledLanguage>` to avoid redundant loading
- **Synchronized language loading**: Synchronized language loading across both highlighters
- **Language pre-loading on theme change**: When themes changed and highlighters were recreated, all previously loaded languages were pre-loaded into the new highlighters
- **JavaScript engine for CSP compliance**: Used `createJavaScriptRegexEngine({ forgiving: true })` to avoid CSP violations from WASM (PR #77: "fix: rendering code blocks throws csp errors using vite build"). This avoids WASM while providing best-effort results for unsupported grammars.

**Data attributes**: Rich data attributes on elements (`data-code-block-container`, `data-code-block-header`, `data-language`) for testing and styling.

### 3.2 Current react-shiki Implementation

Retained Streamdown's explicit language validation with fallback to "text" for unsupported languages. While react-shiki handles language resolution internally, this preserves exact compatibility during migration and can potentially be removed if react-shiki's built-in handling proves sufficient.

**Highlighter creation**:

```typescript
import { createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

async function createStreamdownHighlighter(themes: [BundledTheme, BundledTheme]) {
  return await createHighlighter({
    themes: themes,
    langs: [],  // Languages loaded dynamically as needed
    engine: createJavaScriptRegexEngine({ forgiving: true })
  });
}
```

**Key architectural insight**: Using `createHighlighter` from the main "shiki" bundle (not `react-shiki/core`) provides access to all bundled languages while still allowing engine customization. This custom highlighter is then passed to react-shiki's `useShikiHighlighter` hook via the `highlighter` option.

**New behavior**:
- Single highlighter instance persists across theme changes
- Shiki's default dynamic language loading should handle loading languages as needed
- No explicit language tracking required

### 3.3 Open Questions & Research Needed


**Potential blindspots to investigate**:

1. **Can we remove explicit fallback?** Does react-shiki's built-in language handling sufficiently cover Streamdown's explicit fallback behavior?

2. **Theme changes**: When `lightTheme` or `darkTheme` context values change, we recreate the highlighter. Does this lose loaded languages?
   - **Current implementation**: Yes, we recreate the highlighter in `useEffect([lightTheme, darkTheme])`
   - **Question**: Does this cause languages to be re-downloaded/re-parsed?
   - **Mitigation needed?**: Consider caching the highlighter at a higher level or implementing theme loading without recreation

3. **Multiple code blocks**: Do languages get shared across different `CodeBlock` component instances?
   - **Current implementation**: Each component creates its own highlighter instance
   - **Question**: Is this inefficient? Should we use a singleton pattern?
   - **Note**: Original Streamdown used a singleton `HighlighterManager`

4. **Language loading errors**: How does the new setup handle languages that fail to load?
   - **Original**: Explicit fallback to "text"
   - **New**: Relies on Shiki's internal error handling
   - **Verification needed**: Test with invalid language identifiers

### 3.4 Action Items

1. Review how react-shiki handles language caching across re-renders
2. Consider implementing a module-level highlighter singleton (like original Streamdown)
3. Add comprehensive logging to track language loading behavior during development
4. Performance testing with multiple code blocks and frequent theme changes
5. Test with various language identifiers to ensure compatibility

---

## 4. Code Reduction & Simplification

- **Removed**: ~100 lines of `HighlighterManager` class
- **Added**: ~30 lines of transformer and highlighter creation logic
- **Net result**: Simpler, more maintainable code
- **Testing**: Passed all tests in packages/streamdown/__tests__/

---

## 5. Testing in apps/website

**Priority**: High
**Status**: Not yet tested

**Required actions**:
1. Build and run the `apps/website` project with the migrated code
2. Verify syntax highlighting works correctly
3. Test theme switching behavior (light/dark mode transitions)
4. Confirm no visual regressions compared to dual highlighter approach
5. Verify no CSP violations in apps/website build

---

## 6. Summary

The migration from Streamdown's dual highlighter approach to react-shiki simplifies the codebase. The key remaining work involves:

1. **Verification**: Testing in the actual website application
2. **Theme switching**: Ensuring the CSS variable approach works with Streamdown's existing theme management
3. **Performance**: Confirming that Shiki's dynamic language loading handles all edge cases previously covered by manual language tracking
4. **Optimization**: Evaluating whether a highlighter singleton would be more efficient than per-component instances

The migration reduces complexity while leveraging react-shiki's well-tested multi-theme support.
