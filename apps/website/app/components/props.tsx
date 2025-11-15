const props = [
  {
    name: "children",
    type: "string",
    description:
      "The markdown content to render. Can be a string of markdown or React nodes.",
  },
  {
    name: "parseIncompleteMarkdown",
    type: "boolean",
    default: "true",
    description:
      "Whether to parse and fix incomplete markdown syntax (e.g., unclosed code blocks or lists).",
  },
  {
    name: "className",
    type: "string",
    description: "CSS class names to apply to the wrapper div element.",
  },
  {
    name: "components",
    type: "object",
    description:
      "Custom React components to use for rendering markdown elements (e.g., custom heading, paragraph, code block components).",
  },
  {
    name: "rehypePlugins",
    type: "array",
    default:
      '[[harden, { allowedImagePrefixes: ["*"], allowedLinkPrefixes: ["*"], defaultOrigin: undefined }], rehypeRaw, [rehypeKatex, { errorColor: "var(--color-muted-foreground)" }]]',
    description:
      "Array of rehype plugins to use for processing HTML. Includes rehype-harden for security, rehype-raw for HTML support, and rehype-katex for math rendering by default. You can import defaultRehypePlugins to access individual default plugins when overriding.",
  },
  {
    name: "remarkPlugins",
    type: "array",
    default: "[[remarkGfm, {}], [remarkMath, { singleDollarTextMath: false }]]",
    description:
      "Array of remark plugins to use for processing markdown. Includes GitHub Flavored Markdown and math support by default. You can import defaultRemarkPlugins to access individual default plugins when overriding.",
  },
  {
    name: "shikiTheme",
    type: "[BundledTheme, BundledTheme] (from Shiki)",
    default: '["github-light", "github-dark"]',
    description:
      'The themes to use for code blocks. Defaults to ["github-light", "github-dark"].',
  },
  {
    name: "mermaidConfig",
    type: "MermaidConfig",
    description:
      "Custom configuration for Mermaid diagrams including theme, colors, fonts, and other rendering options. See Mermaid documentation for all available options.",
  },
  {
    name: "mermaidLoader",
    type: "MermaidLoader",
    description:
      "Provide a function that dynamically imports Mermaid when diagrams are present. Leaving this undefined renders Mermaid code blocks as plain text, which is useful in restricted environments like Chrome extensions.",
  },
  {
    name: "controls",
    type: "boolean | { table?: boolean, code?: boolean, mermaid?: boolean }",
    default: "true",
    description:
      "Control the visibility of copy and download buttons. Can be a boolean to show/hide all controls, or an object to selectively control buttons for tables, code blocks, and Mermaid diagrams.",
  },
  {
    name: "isAnimating",
    type: "boolean",
    default: "false",
    description:
      "Whether the component is currently animating. This is used to disable the copy and download buttons when the component is animating.",
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
              Default:{" "}
              <code className="rounded bg-muted px-1">{prop.default}</code>
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
);
