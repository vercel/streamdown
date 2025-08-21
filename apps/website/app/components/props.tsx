const props = [
  {
    name: 'children',
    type: 'string',
    description:
      'The markdown content to render. Can be a string of markdown or React nodes.',
  },
  {
    name: 'parseIncompleteMarkdown',
    type: 'boolean',
    default: 'true',
    description:
      'Whether to parse and fix incomplete markdown syntax (e.g., unclosed code blocks or lists).',
  },
  {
    name: 'className',
    type: 'string',
    description: 'CSS class names to apply to the wrapper div element.',
  },
  {
    name: 'components',
    type: 'object',
    description:
      'Custom React components to use for rendering markdown elements (e.g., custom heading, paragraph, code block components).',
  },
  {
    name: 'allowedImagePrefixes',
    type: 'string[]',
    default: '["*"]',
    description:
      'Array of allowed URL prefixes for images. Use ["*"] to allow all images.',
  },
  {
    name: 'allowedLinkPrefixes',
    type: 'string[]',
    default: '["*"]',
    description:
      'Array of allowed URL prefixes for links. Use ["*"] to allow all links.',
  },
  {
    name: 'defaultOrigin',
    type: 'string',
    description: 'Default origin to use for relative URLs in links and images.',
  },
  {
    name: 'rehypePlugins',
    type: 'array',
    default: '[rehypeKatex]',
    description:
      'Array of rehype plugins to use for processing HTML. Includes KaTeX for math rendering by default.',
  },
  {
    name: 'remarkPlugins',
    type: 'array',
    default: '[remarkGfm, remarkMath]',
    description:
      'Array of remark plugins to use for processing markdown. Includes GitHub Flavored Markdown and math support by default.',
  },
  {
    name: 'shikiTheme',
    type: 'BundledTheme (from Shiki)',
    default: 'github-light',
    description: 'The theme to use for code blocks.',
  },
];

export const Props = () => (
  <div className="divide-y sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
    <div className="space-y-2 p-4 sm:p-8">
      <h2 className="font-semibold text-2xl tracking-tight">Props</h2>
      <p className="text-muted-foreground">
        StreamdownProps extends the react-markdown component props with
        additional properties for streaming and security features.
      </p>
      <p className="text-muted-foreground">
        All props are optional and have sensible defaults for typical use cases.
      </p>
    </div>
    <div className="divide-y sm:col-span-2">
      {props.map((prop) => (
        <div className="space-y-2 p-4 sm:p-8" key={prop.name}>
          <div className="flex items-center gap-2">
            <code className="font-semibold text-primary text-sm tracking-tight">
              {prop.name}
            </code>
            <code className="text-muted-foreground text-xs">{prop.type}</code>
          </div>
          <p className="text-muted-foreground text-sm">{prop.description}</p>
          {prop.default && (
            <p className="text-muted-foreground text-xs">
              Default:{' '}
              <code className="rounded bg-muted px-1">{prop.default}</code>
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
);
