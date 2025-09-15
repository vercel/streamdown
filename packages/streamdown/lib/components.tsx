import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  isValidElement,
  useContext,
} from "react";
import type { ExtraProps, Options } from "react-markdown";
import type { BundledLanguage } from "shiki";
import { ControlsContext, MermaidConfigContext } from "../index";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from "./code-block";
import { ImageComponent } from "./image";
import { Mermaid } from "./mermaid";
import { TableCopyButton, TableDownloadDropdown } from "./table";
import { cn } from "./utils";

const LANGUAGE_REGEX = /language-([^\s]+)/;

const shouldShowControls = (
  config: boolean | { table?: boolean; code?: boolean; mermaid?: boolean },
  type: "table" | "code" | "mermaid"
) => {
  if (typeof config === "boolean") {
    return config;
  }

  return config[type] !== false;
};

const CodeComponent = ({
  node,
  className,
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  ExtraProps) => {
  const inline = node?.position?.start.line === node?.position?.end.line;
  const mermaidConfig = useContext(MermaidConfigContext);
  const controlsConfig = useContext(ControlsContext);

  if (inline) {
    return (
      <code
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
          className
        )}
        data-streamdown="inline-code"
        {...props}
      >
        {children}
      </code>
    );
  }

  const match = className?.match(LANGUAGE_REGEX);
  const language = (match?.at(1) ?? "") as BundledLanguage;

  // Extract code content from children safely
  let code = "";
  if (
    isValidElement(children) &&
    children.props &&
    typeof children.props === "object" &&
    "children" in children.props &&
    typeof children.props.children === "string"
  ) {
    code = children.props.children;
  } else if (typeof children === "string") {
    code = children;
  }

  if (language === "mermaid") {
    const showMermaidControls = shouldShowControls(controlsConfig, "mermaid");

    return (
      <div
        className={cn(
          "group relative my-4 h-auto rounded-xl border p-4",
          className
        )}
        data-streamdown="mermaid-block"
      >
        {showMermaidControls && (
          <div className="flex items-center justify-end gap-2">
            <CodeBlockDownloadButton code={code} language={language} />
            <CodeBlockCopyButton code={code} />
          </div>
        )}
        <Mermaid chart={code} config={mermaidConfig} />
      </div>
    );
  }

  const showCodeControls = shouldShowControls(controlsConfig, "code");

  return (
    <CodeBlock
      className={cn("overflow-x-auto border-t", className)}
      code={code}
      data-language={language}
      data-streamdown="code-block"
      language={language}
      preClassName="overflow-x-auto font-mono text-xs p-4 bg-muted/40"
    >
      {showCodeControls && (
        <>
          <CodeBlockDownloadButton code={code} language={language} />
          <CodeBlockCopyButton />
        </>
      )}
    </CodeBlock>
  );
};

const TableComponent = ({ node, children, className, ...props }: any) => {
  const controlsConfig = useContext(ControlsContext);
  const showTableControls = shouldShowControls(controlsConfig, "table");

  return (
    <div
      className="my-4 flex flex-col space-y-2"
      data-streamdown="table-wrapper"
    >
      {showTableControls && (
        <div className="flex items-center justify-end gap-1">
          <TableCopyButton />
          <TableDownloadDropdown />
        </div>
      )}
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse border border-border",
            className
          )}
          data-streamdown="table"
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};

export const components: Options["components"] = {
  ol: ({ node, children, className, ...props }) => (
    <ol
      className={cn(
        "ml-4 list-outside list-decimal whitespace-normal",
        className
      )}
      data-streamdown="ordered-list"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ node, children, className, ...props }) => (
    <li
      className={cn("py-1", className)}
      data-streamdown="list-item"
      {...props}
    >
      {children}
    </li>
  ),
  ul: ({ node, children, className, ...props }) => (
    <ul
      className={cn("ml-4 list-outside list-disc whitespace-normal", className)}
      data-streamdown="unordered-list"
      {...props}
    >
      {children}
    </ul>
  ),
  hr: ({ node, className, ...props }) => (
    <hr
      className={cn("my-6 border-border", className)}
      data-streamdown="horizontal-rule"
      {...props}
    />
  ),
  strong: ({ node, children, className, ...props }) => (
    <span
      className={cn("font-semibold", className)}
      data-streamdown="strong"
      {...props}
    >
      {children}
    </span>
  ),
  a: ({ node, children, className, href, ...props }) => {
    const isIncomplete = href === "streamdown:incomplete-link";

    return (
      <a
        className={cn(
          "wrap-anywhere font-medium text-primary underline",
          className
        )}
        data-incomplete={isIncomplete}
        data-streamdown="link"
        href={href}
        rel="noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    );
  },
  h1: ({ node, children, className, ...props }) => (
    <h1
      className={cn("mt-6 mb-2 font-semibold text-3xl", className)}
      data-streamdown="heading-1"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, className, ...props }) => (
    <h2
      className={cn("mt-6 mb-2 font-semibold text-2xl", className)}
      data-streamdown="heading-2"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ node, children, className, ...props }) => (
    <h3
      className={cn("mt-6 mb-2 font-semibold text-xl", className)}
      data-streamdown="heading-3"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ node, children, className, ...props }) => (
    <h4
      className={cn("mt-6 mb-2 font-semibold text-lg", className)}
      data-streamdown="heading-4"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ node, children, className, ...props }) => (
    <h5
      className={cn("mt-6 mb-2 font-semibold text-base", className)}
      data-streamdown="heading-5"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ node, children, className, ...props }) => (
    <h6
      className={cn("mt-6 mb-2 font-semibold text-sm", className)}
      data-streamdown="heading-6"
      {...props}
    >
      {children}
    </h6>
  ),
  table: TableComponent,
  thead: ({ node, children, className, ...props }) => (
    <thead
      className={cn("bg-muted/80", className)}
      data-streamdown="table-header"
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ node, children, className, ...props }) => (
    <tbody
      className={cn("divide-y divide-border bg-muted/40", className)}
      data-streamdown="table-body"
      {...props}
    >
      {children}
    </tbody>
  ),
  tr: ({ node, children, className, ...props }) => (
    <tr
      className={cn("border-border border-b", className)}
      data-streamdown="table-row"
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ node, children, className, ...props }) => (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-2 text-left font-semibold text-sm",
        className
      )}
      data-streamdown="table-header-cell"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, children, className, ...props }) => (
    <td
      className={cn("px-4 py-2 text-sm", className)}
      data-streamdown="table-cell"
      {...props}
    >
      {children}
    </td>
  ),
  blockquote: ({ node, children, className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic",
        className
      )}
      data-streamdown="blockquote"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: CodeComponent,
  img: ImageComponent,
  pre: ({ children }) => children,
  sup: ({ node, children, className, ...props }) => (
    <sup
      className={cn("text-sm", className)}
      data-streamdown="superscript"
      {...props}
    >
      {children}
    </sup>
  ),
  sub: ({ node, children, className, ...props }) => (
    <sub
      className={cn("text-sm", className)}
      data-streamdown="subscript"
      {...props}
    >
      {children}
    </sub>
  ),
};
