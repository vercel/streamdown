import { Section } from './section';

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
`;

export const GitHubFlavoredMarkdown = () => (
  <Section
    description="Streamdown supports GitHub Flavored Markdown (GFM) out of the box, so you get things like task lists, tables, and more."
    markdown={markdown}
    title="GitHub Flavored Markdown"
  />
);
