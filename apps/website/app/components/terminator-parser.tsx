import { Renderer } from './renderer';

const markdown = `# Markdown Elements Showcase

This paragraph demonstrates **bold**, *italic*, and \`inline code\` elements.
`;

export const TerminatorParser = () => (
  <section className="space-y-16 pt-16">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Style unterminated Markdown blocks
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown comes with built-in support for parsing unterminated Markdown
        blocks (# headings, `inline code`, **bold**, _italic_, [links]() and
        more), which makes streaming Markdown content much prettier.
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
  </section>
);
