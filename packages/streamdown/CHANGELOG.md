# streamdown

## 2.5.0

### Minor Changes

- d6666b6: Add `lineNumbers` prop to disable line numbers in code blocks
- d4ec6c0: Add `meta` prop to `CustomRendererProps`. Custom renderers now receive the raw metastring from the code fence (everything after the language identifier, e.g. ` ```rust {1} title="foo" ` → `meta = '{1} title="foo"'`). The prop is optional (`meta?: string`) and is `undefined` when no metastring is present. Existing custom renderers are unaffected.

### Patch Changes

- ac8d839: Add staggered `animation-delay` to streaming word/character animations so new content cascades in sequentially instead of all animating simultaneously. Configurable via the new `stagger` option (default 40ms). Set `stagger: 0` to restore the previous behavior.
- add5374: Enable horizontal scrolling on code blocks so long lines are accessible instead of being clipped by `overflow-hidden`.
- 75845c0: Fix unnecessary re-renders of code blocks during streaming updates.

  **Problem:** In streaming mode, when new content arrives (e.g. a paragraph is appended), completed code blocks that haven't changed were still re-rendering. This happened because the `Streamdown` component used inline object literals as default parameter values for `linkSafety` (`{ enabled: true }`). Every time `children` changed and `Streamdown` re-rendered, these inline defaults created new references, which caused the `contextValue` useMemo to recompute a new `StreamdownContext` object. Since React propagates context changes through `memo` boundaries, any context consumer inside a memoized `Block` (such as `CodeBlock`) would re-render even though the block's own props were unchanged.

  **Fix:** Extract the inline default values for `linkSafety` into module-level constants (`defaultLinkSafetyConfig`). This ensures referential stability across renders, so `contextValue` only recomputes when the actual values change — not just because `children` updated.

- 8b1c262: fix: prepend UTF-8 BOM to CSV downloads for Excel compatibility

  - `save()` now prepends `\uFEFF` for `text/csv` string content so Excel on
    Windows detects UTF-8 encoding instead of falling back to ANSI.
  - `TableDownloadButton` refactored to use `save()` instead of inline Blob
    creation, ensuring the public API also gets the BOM fix.

- b105c64: Fix custom tag content being prematurely split when content follows the opening tag on the same line and contains double newlines (`\n\n`). The preprocessor now ensures proper HTML block structure so the parser treats the entire tag as a single unit.
- 9e6f991: Increase dropdown z-index for table copy and download menus to prevent clipping by surrounding elements.
- 9c18748: docs: document required CSS custom properties (shadcn/ui design tokens) in README
- 7b62e9a: Replace Tailwind v4-only `*:last:` and `*:first:` variant syntax with `[&>*:last-child]:` and `[&>*:first-child]:` arbitrary variants for compatibility with both Tailwind CSS v3 and v4. Fixes caret rendering on every line instead of only the last child in v3.
- Updated dependencies [e50b0c4]
- Updated dependencies [716a5f0]
  - remend@1.3.0

## 2.4.0

### Minor Changes

- 5edff75: Clarified Tailwind `@source` configuration for Streamdown and optional plugins.
  Updated documentation to keep the global `@source` for core `streamdown` only, move plugin `@source` guidance to plugin docs with examples, and add a caveat to include plugin entries only if installed.
- 57cd3b5: Add support for custom starting line numbers in code blocks via the `startLine` meta option.

  Code blocks can now specify a starting line number in the meta string:

  ````md
  ```js startLine=10
  const x = 1;
  ```
  ````

  This renders line numbers beginning at 10 instead of the default 1. The feature works by parsing the `startLine=N` value from the fenced-code meta string and applying `counter-reset: line N-1` to the `<code>` element.

- 57cd3b5: Add support for customizing icons via the `icons` prop on `<Streamdown>`.

  Users can override any subset of the built-in icons (copy, download, zoom, etc.) by passing a `Partial<IconMap>`:

  ```tsx
  import { Streamdown, type IconMap } from "streamdown";

  <Streamdown icons={{ CheckIcon: MyCheckIcon }}>{content}</Streamdown>;
  ```

  Unspecified icons fall back to defaults.

- 01d27e9: Add support for custom Shiki themes via a `themes` option on `createCodePlugin`, accepting a `[light, dark]` pair of bundled theme names or full theme registration objects.
- 2cf559d: Add a virtual `inlineCode` key to the `components` prop, allowing inline code spans to be styled independently from fenced code blocks without manually detecting block vs. inline context.
- 27c7b03: Export table action components (`TableCopyDropdown`, `TableDownloadButton`, `TableDownloadDropdown`) and utilities (`extractTableDataFromElement`, `tableDataToCSV`, `tableDataToTSV`, `tableDataToMarkdown`, `escapeMarkdownTableCell`, `TableData`), enabling custom table overrides to preserve copy/download interactivity.
- fb76275: Add a fullscreen overlay for tables with Escape/backdrop-click to close and scroll locking, controlled via `controls.table.fullscreen`. Copy and download controls remain available in the fullscreen view.
- b392fbe: Add `literalTagContent` prop that accepts an array of custom HTML tag names (e.g. `['mention']`) whose children should be treated as plain text, escaping markdown metacharacters so user-supplied labels aren't interpreted as formatting.
- c4c86fa: Add a `dir` prop that accepts `"ltr"`, `"rtl"`, or `"auto"`. When set to `"auto"`, each block's text direction is detected by scanning for the first strong Unicode character (Arabic, Hebrew, Thaana, etc.).
- 00872f0: Add a `prefix` prop that prepends a namespace to all generated Tailwind utility classes (e.g. `flex` becomes `tw:flex`), enabling Tailwind v4's `prefix()` feature for projects that need to avoid class name collisions.
- 401b901: Add support for custom renderers via `plugins.renderers`, allowing fenced code blocks with specific languages to be rendered by a custom component instead of the default `CodeBlock`.

### Patch Changes

- f398611: Add `onAnimationStart` and `onAnimationEnd` callback props that fire when streaming animation begins and completes, useful for coordinating UI state with the animation lifecycle.
- f2a7e51: Fix empty lines in syntax-highlighted code blocks collapsing into nothing by rendering a newline character for empty token rows, preserving whitespace when copying.
- 9ba8511: fix: prevent ordered list animation retrigger during streaming

  When streaming content contains multiple ordered (or unordered) lists,
  the Marked lexer merges them into a single block. As each new item appears
  the block is re-processed through the rehype pipeline, re-creating all
  `data-sd-animate` spans. This caused already-visible characters to re-run
  their CSS entry animation.

  Two changes address the root cause:

  1. **Per-block `prevContentLength` tracking** – each `Block` component
     now keeps a `useRef` with the content length from its previous render.
     Before each render the `animatePlugin.setPrevContentLength(n)` method is
     called so the rehype plugin can detect which text-node positions were
     already rendered. Characters whose cumulative hast-text offset falls below
     the previous raw-content length receive `--sd-duration:0ms`, making them
     appear in their final state instantly rather than re-animating.

  2. **Stable `animatePlugin` reference** – the `animatePlugin` `useMemo`
     now uses value-based dependency comparison instead of reference equality
     for the `animated` option object. This prevents the plugin from being
     recreated on every parent re-render when the user passes an inline object
     literal (e.g. `animated={{ animation: 'fadeIn' }}`). A stable reference
     is required because the rehype processor cache uses the function name as
     its key and always returns the first cached closure; only the original
     `config` object is ever read by the processor.

- 781178b: Add a granular `controls` prop that accepts a boolean to toggle all controls or an object with per-feature flags (`code`, `table`, `mermaid`) for fine-grained control over copy, download, fullscreen, and pan/zoom buttons.
- e129f09: Add a `translations` prop for overriding all user-facing UI strings (copy/download button labels, modal text, image alt text, etc.), enabling full i18n support.
- Updated dependencies [a725579]
  - remend@1.2.2

## 2.3.0

### Minor Changes

- 3657e42: Add `useIsCodeFenceIncomplete` hook for detecting incomplete code fences during streaming

  Custom components can now detect when the code fence in their block is still being streamed. This is useful for deferring expensive renders (syntax highlighting, Mermaid diagrams) until the code block is complete.

  ```tsx
  import { useIsCodeFenceIncomplete } from "streamdown";

  const MyCodeBlock = ({ children }) => {
    const isIncomplete = useIsCodeFenceIncomplete();

    if (isIncomplete) {
      return <div>Loading code...</div>;
    }

    return (
      <pre>
        <code>{children}</code>
      </pre>
    );
  };
  ```

  The hook returns `true` when:

  - Streaming is active (`isAnimating={true}`)
  - The component is in the last block being streamed
  - That block has an unclosed code fence

  The default code block component now uses this hook to set a `data-incomplete` attribute when incomplete, enabling CSS-based loading states.

- 32fb079: fix: hide download button on broken images and display a custom "Image not available" message instead
- d73d7bb: Make the action buttons in code block header sticky.
  Ensures copy buttons remain accessible for long code blocks.
  Improves usability when viewing large snippets.
- 15645da: Move code block lazy loading to the highlighting layer so block shells render immediately with plain text content before syntax colors resolve. This improves visual stability and removes the spinner fallback for standard code blocks.

### Patch Changes

- 0987479: fix: codeblock highlight flicker while streaming
- 5d438ca: Add support for copying table data as Markdown in TableCopyDropdown.
  Introduces a Markdown copy option alongside existing formats.
  Allows users to quickly copy tables in valid Markdown format.
- ce9b4c2: Fix syntax highlighting
- ba03332: Redesign Mermaid diagram
- 6e91867: fix nested same-tag HTML block parsing in parseMarkdownIntoBlocks
- 7f9127b: Add `normalizeHtmlIndentation` prop to prevent indented HTML tags from being treated as code blocks
- fdef60d: Bump rehype-harden to fix "can't access property "type", node is undefined"
- 1abbf1e: Redesign table
- fb9f97c: handle custom tags with blank lines in content
- Updated dependencies [6374fbf]
  - remend@1.2.1

## 2.2.0

### Minor Changes

- c1e1e66: Bake animate into streamdown as built-in `animated` prop

### Patch Changes

- d5fe6d6: fix: properly handle HTML void elements in parse-blocks
- 6bb03ca: fix: escape HTML when rehype-raw is omitted (#330)
- a12de57: Custom tags in components
- 83f043c: Fix: certain LaTeX syntaxes e.g. \(...\) are not rendering
- aabb9ab: Fix $$ inside code blocks being treated as math delimiters

  Code blocks can contain `$$` as shell syntax (e.g., `pstree -p $$` for current process ID). The math block merging logic was incorrectly counting `$$` inside code blocks, causing subsequent content to be merged as if it were part of a math block.

  Added tracking of previous token type to skip math merging when the previous block was a code block.

- 9f72224: Fix footnote detection incorrectly matching regex character classes

  The footnote reference and definition patterns were too permissive, using `[^\]\s]` which matches any character except `]` and whitespace. This caused regex negated character classes like `[^\s...]` in code blocks to be incorrectly detected as footnotes, resulting in the entire document being returned as a single block.

  Updated the patterns to only match valid footnote identifiers (alphanumeric characters, underscores, and hyphens) using `[\w-]` instead.

- 6b42a85: Remove CJS builds
- aeadcd6: Fix single-line indented code blocks
- 82bc4a6: Fix tel links being blocked by default
- fd5533c: fix: Tables cause vertical scroll trap
- e633ff7: Strip trailing newlines in code blocks
- 6be5da8: Fix carets and dark code blocks on Tailwind v3
- 573ece6: Add documentation for monorepos
- 48756b5: Extend ReactMarkdown props
- Updated dependencies [c347b53]
- Updated dependencies [6b42a85]
- Updated dependencies [4fffb9f]
- Updated dependencies [3e6a77d]
  - remend@1.2.0

## 2.1.0

### Minor Changes

- 0b80aed: Plugins
- 5a06a01: Add built-in link safety

### Patch Changes

- 32bcb5d: Fix: className styles not applied during active streaming
- e45f2a2: fix: table element receives incorrect data-streamdown attribute (table-wrapper instead of table)
- 8e24a9e: Add fallback for downloading images CORS issue
- e7e5390: Improve caret rendering
- 900d726: Code blocks render inside <p> tags causing hydration errors
- f0641f4: fix: initialize displayBlocks with blocks value
- Updated dependencies [3376255]
- Updated dependencies [add8eda]
- Updated dependencies [19dae64]
- Updated dependencies [1d4a3c7]
  - remend@1.1.0

## 2.0.1

### Patch Changes

- 61b3685: Fix Streamdown URL

## 2.0.0

### Major Changes

- 75faa2e: Reduce bundle size by 98%, create Streamdown CDN

### Minor Changes

- 13b91d8: Add support for carets

### Patch Changes

- 104798e: Make remend configurable
- 23f2a40: Attempt to fallback to raw to prevent cdn-loader blocking
- 133c6c8: Load KaTeX CSS from CDN
- 0c830f5: Fix Mermaid pan/zoom controls layout issues in fullscreen and non-fullscreen modes
- 68109f2: Fix setext heading issues
- 2c32b2e: Fix shouldParseIncompleteMarkdown leaking to DOM
- ee12ec8: Add support for self-hosted CDN
- 5653400: Fix loading langs dynamically
- 1b898b0: Fix dynamic module imports
- 6a7dc7c: Optimize Mermaid rendering performance with viewport-based lazy loading

  - Add useDeferredRender hook for lazy loading components when entering viewport
  - Use Intersection Observer + debounce + requestIdleCallback for optimal performance
  - Only render Mermaid charts when they are visible or about to enter viewport
  - Prevents page freezing when loading chat history with many Mermaid diagrams
  - Fixes white screen issue when scrolling through chat messages with multiple diagrams

- 8d8d67f: Add rehype sanitize
- 271265c: Fix list indentation
- 8157e80: Fix fullscreen mermaid
- 91b425f: Refactor click outside handler for Shadow DOM compatibility
- 16df4a4: Fix KaTeX parsing
- 6bd211d: Update rehype-harden to fix relative URLs
- 48c9c51: Fix autolink parsing to stop at CJK punctuation boundaries.
- d1635f0: Fix bug: Code block line numbers over 100 wrap and start new line
- Updated dependencies [104798e]
- Updated dependencies [6769e7a]
- Updated dependencies [217b128]
- Updated dependencies [68109f2]
- Updated dependencies [e0ee74e]
- Updated dependencies [45f0f4d]
- Updated dependencies [b8c8c79]
- Updated dependencies [68f29c0]
- Updated dependencies [e7eca51]
- Updated dependencies [d708864]
  - remend@1.0.2

## 2.0.0-canary.3

### Patch Changes

- 23f2a40: Attempt to fallback to raw to prevent cdn-loader blocking
- 91b425f: Refactor click outside handler for Shadow DOM compatibility

## 2.0.0-canary.2

### Patch Changes

- Fix loading langs dynamically

## 2.0.0-canary.1

### Patch Changes

- 1b898b0: Fix dynamic module imports

## 2.0.0-canary.0

### Major Changes

- 75faa2e: Reduce bundle size by 98%, create Streamdown CDN

### Minor Changes

- 13b91d8: Add support for carets

### Patch Changes

- 104798e: Make remend configurable
- 133c6c8: Load KaTeX CSS from CDN
- 0c830f5: Fix Mermaid pan/zoom controls layout issues in fullscreen and non-fullscreen modes
- 68109f2: Fix setext heading issues
- ee12ec8: Add support for self-hosting CDN
- 6a7dc7c: Optimize Mermaid rendering performance with viewport-based lazy loading

  - Add useDeferredRender hook for lazy loading components when entering viewport
  - Use Intersection Observer + debounce + requestIdleCallback for optimal performance
  - Only render Mermaid charts when they are visible or about to enter viewport
  - Prevents page freezing when loading chat history with many Mermaid diagrams
  - Fixes white screen issue when scrolling through chat messages with multiple diagrams

- 8d8d67f: Add rehype sanitize
- 271265c: Fix list indentation
- 8157e80: Fix fullscreen mermaid
- 16df4a4: Fix KaTeX parsing
- 6bd211d: Update rehype-harden to fix relative URLs
- 48c9c51: Fix autolink parsing to stop at CJK punctuation boundaries.
- d1635f0: Fix bug: Code block line numbers over 100 wrap and start new line
- Updated dependencies [104798e]
- Updated dependencies [6769e7a]
- Updated dependencies [217b128]
- Updated dependencies [68109f2]
- Updated dependencies [e0ee74e]
- Updated dependencies [45f0f4d]
- Updated dependencies [b8c8c79]
- Updated dependencies [68f29c0]
- Updated dependencies [e7eca51]
- Updated dependencies [d708864]
  - remend@1.0.2-canary.0

## 1.6.11

### Patch Changes

- 0b7fe77: Add rehype sanitize

## 1.6.10

### Patch Changes

- d3ed120: Split out Remend
- Updated dependencies [d3ed120]
  - remend@1.0.1

## 1.6.9

### Patch Changes

- 57dec2a: Restores pan-zoom component to normal size when mermaid component is maximized
- a954419: Bump rehype-harden
- 99797c2: chore: move unified from devDependencies to dependencies

## 1.6.8

### Patch Changes

- 6fc3fa0: fix excessive spacing above tables
- b2e832f: fix: validate languages in code blocks

## 1.6.7

### Patch Changes

- cfc8c37: Fix p tags inside list items
- e4e5bb5: Fix unit tests
- 00ca9a9: Add PanZoom controls configurability for Mermaid diagrams.

  - Support `controls.mermaid.panZoom` (boolean) to toggle zoom controls globally
  - Support `mermaid.config.panZoom` (boolean or `{ showControls?: boolean }`) per-instance
  - Keep defaults enabled; `false` explicitly hides the zoom controls

  This is a non-breaking enhancement that aligns with existing control predicates.

- a489949: fix: add missing tooltip support to action buttons

## 1.6.6

### Patch Changes

- 74cac00: Fix code block data attributes

## 1.6.5

### Patch Changes

- 1e547d4: Fix code blocks in dark mode

## 1.6.4

### Patch Changes

- dbd198f: Restore original lucide imports

## 1.6.3

### Patch Changes

- 49b6692: build for browser only (fixes ts-router)

## 1.6.2

### Patch Changes

- 476167e: Conditional KaTeX CSS loading based on content detection
- 476167e: Bundle optimization through lazy loading and code splitting

## 1.6.1

### Patch Changes

- bdca13b: Fix markdown parsing bug

## 1.6.0

### Minor Changes

- 6f19ee0: Remove dependency on react-markdown
- 52db013: Implement Static mode

### Patch Changes

- 4e12df6: Performance optimizations
- 606209d: Rebuild syntax highlighting
- 093cd5c: Remove urlTransform and defaultUrlTransform
- 28ab339: Fix incomplete link termination in code blocks
- b55cbdc: Fix security issues, improve performance
- 872da1a: Allow for custom error components for Mermaid diagrams
- 090c82e: Fix list CSS
- 22cbaeb: Added the ability to export mermaid diagrams to svg and png alongside mmd
- 936af5b: Add PanZoom component and tests for zoom and pan functionality

## 1.5.1

### Patch Changes

- 40fe4c6: Fix documents and some test cases for CJK Friendly Emphasis
- 19da935: fix pnpm version mismatch

## 1.5.0

### Minor Changes

- 5c4ad8b: Add fullscreen view button for Mermaid diagrams
- 2ebd886: Fix performance issues with large code streaming blocks

### Patch Changes

- f7568e5: Export parseIncompleteMarkdown function to public API
- 5363a51: Stabilize Streamdown contexts
- f941fd6: Improved CJK support with remark-cjk-friendly and remark-cjk-friendly-gfm-strikethrough
- f4c9c1e: Add block-level customization hooks
- 171a824: fix base64 images
- e17bf80: fix: add `overflow-hidden` to `TableDownloadDropdown`
- ed0154a: Add TSV copy support to tables
- 75e9d40: Add documentation
- 75e9d40: Fix linting and formatting issues
- 7041497: Fix in-word asterisks
- fbdec4d: fix: add `border-border` to code block
- 75e9d40: Document styling
- 8a3fc5a: Dynamically load `katex.min.css` only when `rehypeKatex` is included in the `rehypePlugins`

## 1.4.0

### Minor Changes

- 6c6f507: migrate from harden-react-markdown to rehype-harden

### Patch Changes

- d0444a3: Add support for isAnimating
- 7a7464f: Correctly passes through remark rehype options into react-markdown. Previously this was ignored
- c68ebd6: Support incomplete URL parsing for links
- 0bfca42: 1.4 fixes and cleanup
- 6c0672b: Fix footnotes parsing
- 239e41d: fix: Block-level Markdown escapes <details> containers when paragraphs/blank lines are present
- 7cd5048: Add support for remarkMathOptions and remarkGfmOptions props
- f5d6cd6: Remove options props, make plugins fully customizable
- 699622f: Allow base64 images
- 38ad1ed: Fix node="[object Object]" HTML attribute bug. Fixed AST node objects being passed as HTML attributes by explicitly filtering out the node prop from component props before spreading to HTML elements.
- 21a7031: Fix themed backgrounds for code blocks
- 04f6f3a: Extract images from paragraph tags
- 3c780b4: Fit footnotes rendering
- 20ca02d: fixed email addresses being rendered as blocked link

## 1.3.0

### Minor Changes

- 73b17a4: Add controls prop to control copy/download button visibility.
- 64b5afa: feat: memoize components to prevent child re-renders
- d2edc90: feat: add custom Mermaid configuration support

### Patch Changes

- f34c039: fix: <br> in markdown tables from gpt-oss seem encoded or printed to output
- 11b347e: `fix: fallback to plain text when unsupported language is passed to Shiki, preventing runtime errors`
- 266fa2b: Fix word-internal underscores being incorrectly treated as incomplete markdown

  Previously, underscores used as word separators (e.g., `hello_world`, `snake_case`) were incorrectly identified as incomplete italic markdown, causing an extra underscore to be appended. This fix:

  - Detects when underscores are between word characters and treats them as literals
  - Preserves the streaming markdown completion for genuine incomplete italics (e.g., `_italic text`)
  - Correctly handles trailing newlines when completing italic formatting

  Fixes the issue where `hello_world` would become `hello_world_` when `parseIncompleteMarkdown` was enabled.

- 0ebf67d: misc 1.3 fixes and cleanup
- d29281e: Fix the background color of `TableDropDownMenu` from `bg-white` to `bg-background`
- 333df85: Update moduleResolution in tsconfig.json to bundler
- d583b1f: import `Lexer` only for possible tree-shaking
- 20330ba: add table text/html copy so that it can be recognized as table format in applications like Excel
- 7ae9881: fix: long link text overflows (#139)

## 1.2.0

### Minor Changes

- fa7733c: 1.2 cleanup

### Patch Changes

- bc3f423: handle lists with emphasis character blocks
- 3fab433: feat: add table markdown copy and csv/markdown download options
- c3a2eaa: misc fixes and improvements
- 435a2c6: feat: add download functionality to code blocks
- a4a10fc: feat: add image download functionality with hover controls

## 1.1.10

### Patch Changes

- 4459b14: apply whitespace-nowrap to th and match table colors with CodeBlock
- 426c897: fix: parseIncompleteMarkdown Emphasis Character Block Issue

## 1.1.9

### Patch Changes

- 5a50f22: bump deps
- 23d8efe: prevent copy event occurs too frequently
- 4737c99: fix: long list items break to a new line

## 1.1.8

### Patch Changes

- 76b68bf: add more code block data attributes
- faba69f: Support multiple simultaneous code blocks with different languages
- bda3134: add rtl unit tests
- f45ea6d: fix: links invisible while streaming

## 1.1.7

### Patch Changes

- e7f0402: Redesign CodeBlock for improved UX
- 6e0f722: use javascript regex engine for shiki
- 6751cbb: fix katex post-processing

## 1.1.6

### Patch Changes

- e01669b: add test app, fix code block incomplete parsing
- 69fb1e0: fix single dollar sign text rendering as math

## 1.1.5

### Patch Changes

- 593e49e: fix multiple renders of the same mermaid diagram
- bf8c798: update props in readme

## 1.1.4

### Patch Changes

- 5fbad80: fix asterisk list termination
- 13898aa: Add data-streamdown attributes to components
- 390bbc7: temporary fix for error color in rehype katex
- 5f4ed3d: chore: remove package-lock.json
- 9b5b56d: enable release-based web deploys

## 1.1.2

### Patch Changes

- 045907f: fix: handleIncompleteSingleUnderscoreItalic is not accounting for the usage inside math equations
- dc9ab5f: fix unit tests, run on release and PR
- 01e5eb0: Add Publishing CI Pipeline
- f834892: fix: codeblock dark mode and background
