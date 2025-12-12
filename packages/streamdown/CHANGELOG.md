# streamdown

## 2.0.0

### Major Changes

- 75faa2e: Reduce bundle size by 98%, create Streamdown CDN

### Minor Changes

- 13b91d8: Add support for carets

### Patch Changes

- 104798e: Make remend configurable
- 133c6c8: Load KaTeX CSS from CDN
- 0c830f5: Fix Mermaid pan/zoom controls layout issues in fullscreen and non-fullscreen modes
- 68109f2: Fix setext heading issues
- ee12ec8: Add support for CDN offline mode
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
