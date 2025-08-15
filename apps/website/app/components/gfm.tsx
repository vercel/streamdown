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
  <section className="space-y-16 px-4">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        GitHub Flavored Markdown
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown supports GitHub Flavored Markdown (GFM) out of the box, so
        you get things like task lists, tables, and more.
      </p>
    </div>
    <div className="grid grid-cols-2 divide-x overflow-hidden rounded-3xl border">
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With react-markdown
        </div>
        <div className="h-[400px] overflow-y-auto p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With Streamdown
        </div>
        <div className="h-[400px] overflow-y-auto p-4">
          <Renderer markdown={markdown} type="streamdown" />
        </div>
      </div>
    </div>
  </section>
);
