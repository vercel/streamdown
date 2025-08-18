import { Section } from './section';

const markdown = `# This is a showcase of unterminated Markdown blocks

**This is a very long bold text that keeps going and going without a clear end, so you can see how unterminated bold blocks are handled by the renderer, especially when the text wraps across multiple lines and continues even further to really test the limits of the parser**

*Here is an equally lengthy italicized sentence that stretches on and on, never quite reaching a conclusion, so you can observe how unterminated italic blocks behave in a streaming Markdown context, particularly when the content is verbose and spans several lines for demonstration purposes*

\`This is a long inline code block that should be unterminated and continues for quite a while, including some code-like content such as const foo = "bar"; and more, to see how the parser deals with it when the code block is not properly closed\`

[This is a very long link text that is unterminated and keeps going to show how unterminated links are rendered in the preview, especially when the link text is verbose and the URL is missing or incomplete](https://www.google.com)
`;

export const TerminatorParser = () => (
  <Section
    description="Streamdown comes with built-in support for parsing unterminated Markdown blocks (# headings, `inline code`, **bold**, _italic_, [links]() and more), which makes streaming Markdown content much prettier."
    markdown={markdown}
    title="Style unterminated Markdown blocks"
  />
);
