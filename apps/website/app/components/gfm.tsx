import { Renderer } from './renderer';

const markdown = `# GitHub Flavored Markdown Features

GFM extends standard Markdown with powerful features. Here's a comprehensive demo:

## Tables

| Feature | Standard MD | GFM |
|---------|------------|-----|
| Tables | ❌ | ✅ |
| Task Lists | ❌ | ✅ |
| Strikethrough | ❌ | ✅ |

## Task Lists

- [x] Implement authentication
- [x] Add database models
- [ ] Write unit tests
- [ ] Deploy to production

## Strikethrough

~~Old approach~~ → New approach with AI models

## Autolinks

Visit https://github.com for more examples
Email: contact@example.com

## Footnotes

AI models use transformers[^1] for processing text efficiently.

[^1]: Transformers are a neural network architecture introduced in 2017.
`;

export const GitHubFlavoredMarkdown = () => (
  <section className="space-y-16 pt-16">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        GitHub Flavored Markdown
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown supports GitHub Flavored Markdown (GFM) out of the box, so
        you get things like task lists, tables, and more.
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
