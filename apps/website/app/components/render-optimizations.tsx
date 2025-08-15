import { Renderer } from './renderer';

const markdown = `\`\`\`
.button {
  @apply px-4 py-2 bg-blue-600 text-white rounded;
}
\`\`\``;

export const RenderOptimizations = () => (
  <section className="space-y-16 px-4">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Render optimizations
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown optimizes the streaming of Markdown by preventing re-renders
        on completed blocks.
      </p>
    </div>
    <div className="grid grid-cols-2 divide-x overflow-hidden rounded-3xl border">
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With react-markdown
        </div>
        <div className="p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With Streamdown
        </div>
        <div className="p-4">
          <Renderer markdown={markdown} type="streamdown" />
        </div>
      </div>
    </div>
  </section>
);
