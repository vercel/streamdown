import { Renderer } from './renderer';

const markdown = `# Markdown Elements Showcase

**This is a very long bold text that keeps going and going without a clear end, so you can see how unterminated bold blocks are handled by the renderer, especially when the text wraps across multiple lines and continues even further to really test the limits of the parser**

*Here is an equally lengthy italicized sentence that stretches on and on, never quite reaching a conclusion, so you can observe how unterminated italic blocks behave in a streaming Markdown context, particularly when the content is verbose and spans several lines for demonstration purposes*

\`This is a long inline code block that should be unterminated and continues for quite a while, including some code-like content such as const foo = "bar"; and more, to see how the parser deals with it when the code block is not properly closed\`

[This is a very long link text that is unterminated and keeps going to show how unterminated links are rendered in the preview, especially when the link text is verbose and the URL is missing or incomplete](https://www.google.com)
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
