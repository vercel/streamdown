import { Section } from "./section";

const markdown = `# GitHub Flavored Markdown Features

GFM extends standard Markdown with powerful features[^1]. Here's a comprehensive demo:

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

~~Old approach~~ → New approach with AI models[^2]

[^1]: GitHub Flavored Markdown is a strict superset of CommonMark, maintained by GitHub.
[^2]: Modern AI models provide more intelligent and context-aware solutions.
`;

export const GitHubFlavoredMarkdown = () => (
  <Section
    description="Streamdown supports GitHub Flavored Markdown (GFM) out of the box, so you get things like task lists, tables, and more."
    markdown={markdown}
    title="GitHub Flavored Markdown"
  />
);
