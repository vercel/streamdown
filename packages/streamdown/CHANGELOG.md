# streamdown

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
