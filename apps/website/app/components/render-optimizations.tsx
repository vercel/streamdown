'use client';

import { useEffect } from 'react';
import { scan } from 'react-scan';
import { ReactScan } from './react-scan';
import { Renderer } from './renderer';

const markdown = `# Understanding Render Optimizations in Modern React

When building applications with streaming content, one of the most critical performance considerations is how your components handle re-renders. Traditional markdown renderers often re-process the entire document with each update, leading to unnecessary computational overhead and potential UI jank. This becomes especially problematic when dealing with large documents or real-time streaming scenarios where content is continuously being appended.

## The Challenge with Traditional Approaches

Most React markdown libraries follow a simple pattern: they receive markdown as a prop, parse it, and render the resulting HTML. While this works well for static content, it becomes inefficient when the markdown is being streamed or frequently updated. Every time new content arrives, the entire markdown string is re-parsed and the entire component tree is re-rendered, even though most of the content hasn't changed.

### Performance Impact

Consider a scenario where you're streaming a response from an AI model that generates markdown content. As each token or chunk arrives, your markdown renderer needs to:

1. Parse the entire accumulated markdown string
2. Generate a new React component tree
3. Reconcile this tree with the previous render
4. Update the DOM for any changes

This process happens potentially dozens of times per second, creating a significant performance bottleneck. Users might experience laggy scrolling, delayed interactions, or high CPU usage, especially on lower-powered devices.

## How Streamdown Solves This

Streamdown takes a fundamentally different approach by treating markdown blocks as discrete, memoizable units. Instead of re-rendering the entire document when new content arrives, Streamdown intelligently identifies which blocks have been completed and prevents them from re-rendering. This optimization is particularly powerful for streaming scenarios where content is appended incrementally.

### Block-Level Memoization

Each markdown block (paragraphs, headings, code blocks, lists, etc.) is rendered as an independent component that can be memoized. Once a block is complete and hasn't changed, React can skip re-rendering it entirely, focusing computational resources only on the blocks that are actively being updated or newly added.

This approach provides several benefits:

- **Reduced CPU usage**: Only modified blocks are re-processed
- **Smoother scrolling**: Completed content remains stable during updates
- **Better memory efficiency**: Less garbage collection from recreating identical components
- **Improved perceived performance**: Users see content appear more quickly and smoothly

## Real-World Applications

This optimization strategy is particularly valuable in several common use cases:

**AI-Powered Applications**: When streaming responses from language models, users can read and interact with the already-rendered content while new content continues to stream in without disruption.

**Live Documentation**: Technical documentation that updates in real-time can maintain smooth performance even with frequent updates to specific sections.

**Collaborative Editing**: Multiple users can edit different parts of a document simultaneously without causing performance degradation for readers.

**Data Dashboards**: Markdown-based reports that update with live data can refresh specific sections without re-rendering the entire document.

## Implementation Details

Under the hood, Streamdown leverages React's built-in optimization features like \`React.memo\` and careful prop management to achieve these performance gains. The library automatically detects block boundaries and manages the rendering lifecycle to ensure optimal performance without requiring any special configuration from developers.

The beauty of this approach is that it's completely transparent to the developer. You simply use Streamdown like any other markdown renderer, and the optimizations happen automatically behind the scenes. This means you get enterprise-grade performance without the complexity typically associated with such optimizations.`;

export const RenderOptimizations = () => (
  <section className="space-y-16 pt-16">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Render optimizations
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown optimizes the streaming of Markdown by preventing re-renders
        on completed blocks.
      </p>
    </div>
    <div className="grid grid-cols-2 divide-x overflow-hidden border-t">
      <div className="divide-y">
        <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
          With react-markdown
        </div>
        <div className="h-[400px] overflow-y-auto bg-background p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div className="divide-y">
        <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
          With Streamdown
        </div>
        <div className="h-[400px] overflow-y-auto bg-background p-4">
          <Renderer markdown={markdown} type="streamdown" />
        </div>
      </div>
    </div>
    <ReactScan />
  </section>
);
