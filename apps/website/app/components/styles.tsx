import { Renderer } from './renderer';

const markdown = `# AI Models Overview

Modern AI models have revolutionized how we interact with technology. From **language models** to _computer vision_, these systems demonstrate remarkable capabilities.

## Key Features

### Benefits
- Natural language understanding
- Multi-modal processing
- Real-time inference

### Requirements
1. GPU acceleration
2. Model weights
3. API access

## Architecture

![Model Architecture](https://placehold.co/600x400)

## Insights

> "The development of full artificial intelligence could spell the end of the human race." — Stephen Hawking

Learn more about [AI safety](https://example.com) and \`transformer\` architectures.
`;

export const Styles = () => (
  <section className="space-y-16 pt-16">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Built-in typography styles
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown comes with built-in Tailwind classes for common Markdown
        components &mdash; headings, lists, code blocks, and more.
      </p>
    </div>
    <div className="grid grid-cols-12 divide-x overflow-hidden border-t">
      <div />
      <div className="col-span-5 bg-background">
        <div className="w-full bg-secondary p-4 text-center">
          With react-markdown
        </div>
        <div className="h-[400px] overflow-y-auto p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div className="col-span-5 bg-background">
        <div className="w-full bg-secondary p-4 text-center">
          With Streamdown
        </div>
        <div className="h-[400px] overflow-y-auto p-4">
          <Renderer markdown={markdown} type="streamdown" />
        </div>
      </div>
      <div />
    </div>
  </section>
);
