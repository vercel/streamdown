# Streamdown Performance Benchmarks

This directory contains comprehensive performance benchmarks comparing Streamdown against React Markdown across various scenarios.

## Quick Start

Run all benchmarks:
```bash
pnpm benchmark
```

Run specific benchmark suites:
```bash
pnpm benchmark:parse      # Parse time benchmarks
pnpm benchmark:render     # Render time benchmarks
pnpm benchmark:memory     # Memory usage benchmarks
pnpm benchmark:streaming  # Streaming performance benchmarks
```

## Benchmark Suites

### 1. Parse Time Benchmarks (`parse.bench.ts`)

Tests the speed of markdown parsing operations:

- **parseMarkdownIntoBlocks**: Streamdown's block parsing vs Marked's Lexer
- **parseIncompleteMarkdown**: Performance of completing incomplete markdown tokens
- **Combined Pipeline**: Full Streamdown parsing pipeline vs Marked only

Tested across:
- Small documents (~100 chars)
- Medium documents (~2KB)
- Large documents (~15KB)
- Code-heavy documents
- Streaming documents with incomplete tokens

### 2. Render Time Benchmarks (`render.bench.tsx`)

Compares React component rendering performance:

- **Static vs Streaming modes**: Streamdown's different rendering modes
- **Initial render**: First render performance
- **Re-renders**: Update performance (simulates streaming)
- **Incremental updates**: Progressive content updates

Features tested:
- Basic markdown
- GFM features (tables, task lists, strikethrough)
- Math expressions (KaTeX)
- Code blocks
- Incomplete markdown handling

### 3. Memory Usage Benchmarks (`memory.bench.tsx`)

Measures memory consumption:

- **Parse operations**: Memory used during parsing
- **Component rendering**: Heap usage during React rendering
- **Streaming simulation**: Memory during incremental updates

Metrics tracked:
- Heap usage per operation
- External memory allocation
- Memory efficiency across document sizes

### 4. Streaming Performance Benchmarks (`streaming.bench.tsx`)

Simulates real-world AI streaming scenarios:

- **Character-by-character streaming**: Small, frequent updates (50-100 chars)
- **Chunk-based streaming**: Larger, less frequent updates (10-25 chunks)
- **Code streaming**: Performance with code-heavy content
- **Incomplete token handling**: Parsing incomplete markdown during streaming
- **AI simulation**: Realistic variable-length streaming

## Test Fixtures

Located in `fixtures/` directory:

- `small.md`: Simple markdown (~100 chars)
- `medium.md`: Moderate complexity with code, tables, math (~2KB)
- `large.md`: Comprehensive document with all features (~15KB)
- `code-heavy.md`: Multiple large code blocks in various languages
- `streaming.md`: Markdown with intentionally incomplete tokens

## Understanding Results

Vitest benchmark output shows:

```
✓ Parse Time: Streamdown vs Marked > Small Document
  name                                  hz     min      max     mean      p75      p99     p995     p999     rme  samples
· Streamdown: parseMarkdownIntoBlocks  10000  0.05ms   0.10ms  0.06ms   0.06ms   0.09ms  0.10ms   0.10ms   ±2%   5000
· Marked: Lexer.lex                    12000  0.04ms   0.08ms  0.05ms   0.05ms   0.07ms  0.08ms   0.08ms   ±1%   6000
```

Key metrics:
- **hz**: Operations per second (higher is better)
- **mean**: Average time per operation (lower is better)
- **rme**: Relative margin of error (lower is more consistent)

## Performance Optimization Tips

Based on benchmark results:

1. **Static vs Streaming**: Use `mode="static"` when content is complete
2. **parseIncompleteMarkdown**: Only enable during active streaming
3. **Memoization**: Streamdown's built-in memoization helps with re-renders
4. **Block parsing**: Improves streaming performance with large documents
5. **Chunking**: Balance update frequency with performance needs

## Running with Memory Profiling

For detailed memory profiling, run with garbage collection exposed:

```bash
node --expose-gc node_modules/.bin/vitest bench --config vitest.bench.config.ts benchmarks/memory.bench.tsx
```

## CI/CD Integration

To add benchmarks to CI:

```yaml
- name: Run benchmarks
  run: pnpm benchmark
```

Consider setting up performance regression tracking to catch performance degradation.

## Contributing

When adding new benchmarks:

1. Use consistent fixture data from `fixtures/`
2. Include cleanup for React components (`afterEach: cleanupRender`)
3. Test both libraries with equivalent configurations
4. Add appropriate descriptions for each benchmark
5. Group related benchmarks using `describe()` blocks

## Troubleshooting

### Benchmarks timing out

Reduce iterations or simplify test cases:

```typescript
bench("test name", () => { /* ... */ }, { iterations: 100 })
```

### Inconsistent results

- Close other applications
- Run multiple times and average results
- Check for thermal throttling on laptops
- Use `rme` (relative margin of error) to assess consistency

### Memory benchmarks not working

Ensure Node.js has garbage collection exposed:

```bash
node --expose-gc node_modules/.bin/vitest bench
```

## Further Reading

- [Vitest Benchmarking Guide](https://vitest.dev/guide/features.html#benchmarking-experimental)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Streamdown Documentation](https://streamdown.ai)
