import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  isValidElement,
  type JSX,
  memo,
  useContext,
} from "react";
import type { ExtraProps, Options } from "react-markdown";
import type { BundledLanguage } from "shiki";
import {
  ControlsContext,
  MermaidConfigContext,
  MermaidLoaderContext,
} from "../index";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from "./code-block";
import { ImageComponent } from "./image";
import { Mermaid, MermaidFullscreenButton } from "./mermaid";
import { TableCopyButton, TableDownloadDropdown } from "./table";
import { cn } from "./utils";

const LANGUAGE_REGEX = /language-([^\s]+)/;

type MarkdownPoint = { line?: number; column?: number };
type MarkdownPosition = { start?: MarkdownPoint; end?: MarkdownPoint };
type MarkdownNode = {
  position?: MarkdownPosition;
  properties?: { className?: string };
};

type WithNode<T> = T & {
  node?: MarkdownNode;
  children?: React.ReactNode;
  className?: string;
};

function sameNodePosition(prev?: MarkdownNode, next?: MarkdownNode): boolean {
  if (!(prev?.position || next?.position)) {
    return true;
  }
  if (!(prev?.position && next?.position)) {
    return false;
  }

  const prevStart = prev.position.start;
  const nextStart = next.position.start;
  const prevEnd = prev.position.end;
  const nextEnd = next.position.end;

  return (
    prevStart?.line === nextStart?.line &&
    prevStart?.column === nextStart?.column &&
    prevEnd?.line === nextEnd?.line &&
    prevEnd?.column === nextEnd?.column
  );
}

// Shared comparators
function sameClassAndNode(
  prev: { className?: string; node?: MarkdownNode },
  next: { className?: string; node?: MarkdownNode }
) {
  return (
    prev.className === next.className && sameNodePosition(prev.node, next.node)
  );
}

const shouldShowControls = (
  config: boolean | { table?: boolean; code?: boolean; mermaid?: boolean | { download?: boolean; copy?: boolean; fullscreen?: boolean } },
  type: "table" | "code" | "mermaid"
) => {
  if (typeof config === "boolean") {
    return config;
  }

  return config[type] !== false;
};

const shouldShowMermaidControl = (
  config: boolean | { table?: boolean; code?: boolean; mermaid?: boolean | { download?: boolean; copy?: boolean; fullscreen?: boolean } },
  controlType: "download" | "copy" | "fullscreen"
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const mermaidConfig = config.mermaid;
  
  if (mermaidConfig === false) {
    return false;
  }
  
  if (mermaidConfig === true || mermaidConfig === undefined) {
    return true;
  }
  
  return mermaidConfig[controlType] !== false;
};

type OlProps = WithNode<JSX.IntrinsicElements["ol"]>;
const MemoOl = memo<OlProps>(
  ({ children, className, node, ...props }: OlProps) => (
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
  (p, n) => sameClassAndNode(p, n)
);
MemoOl.displayName = "MarkdownOl";

type LiProps = WithNode<JSX.IntrinsicElements["li"]>;

const MemoLi = memo<LiProps>(
  ({ children, className, node, ...props }: LiProps) => (
    <li
      className={cn("py-1", className)}
      data-streamdown="list-item"
      {...props}
    >
      {children}
    </li>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node)
);
MemoLi.displayName = "MarkdownLi";

type UlProps = WithNode<JSX.IntrinsicElements["ul"]>;
const MemoUl = memo<UlProps>(
  ({ children, className, node, ...props }: UlProps) => (
    <ul
      className={cn("ml-4 list-outside list-disc whitespace-normal", className)}
      data-streamdown="unordered-list"
      {...props}
    >
      {children}
    </ul>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoUl.displayName = "MarkdownUl";

type HrProps = WithNode<JSX.IntrinsicElements["hr"]>;
const MemoHr = memo<HrProps>(
  ({ className, node, ...props }: HrProps) => (
    <hr
      className={cn("my-6 border-border", className)}
      data-streamdown="horizontal-rule"
      {...props}
    />
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoHr.displayName = "MarkdownHr";

type StrongProps = WithNode<JSX.IntrinsicElements["span"]>;
const MemoStrong = memo<StrongProps>(
  ({ children, className, node, ...props }: StrongProps) => (
    <span
      className={cn("font-semibold", className)}
      data-streamdown="strong"
      {...props}
    >
      {children}
    </span>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoStrong.displayName = "MarkdownStrong";

type AProps = WithNode<JSX.IntrinsicElements["a"]> & { href?: string };
const MemoA = memo<AProps>(
  ({ children, className, href, node, ...props }: AProps) => {
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
  (p, n) => sameClassAndNode(p, n) && p.href === n.href
);
MemoA.displayName = "MarkdownA";

type HeadingProps<TTag extends keyof JSX.IntrinsicElements> = WithNode<
  JSX.IntrinsicElements[TTag]
>;

const MemoH1 = memo<HeadingProps<"h1">>(
  ({ children, className, node, ...props }) => (
    <h1
      className={cn("mt-6 mb-2 font-semibold text-3xl", className)}
      data-streamdown="heading-1"
      {...props}
    >
      {children}
    </h1>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH1.displayName = "MarkdownH1";

const MemoH2 = memo<HeadingProps<"h2">>(
  ({ children, className, node, ...props }) => (
    <h2
      className={cn("mt-6 mb-2 font-semibold text-2xl", className)}
      data-streamdown="heading-2"
      {...props}
    >
      {children}
    </h2>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH2.displayName = "MarkdownH2";

const MemoH3 = memo<HeadingProps<"h3">>(
  ({ children, className, node, ...props }) => (
    <h3
      className={cn("mt-6 mb-2 font-semibold text-xl", className)}
      data-streamdown="heading-3"
      {...props}
    >
      {children}
    </h3>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH3.displayName = "MarkdownH3";

const MemoH4 = memo<HeadingProps<"h4">>(
  ({ children, className, node, ...props }) => (
    <h4
      className={cn("mt-6 mb-2 font-semibold text-lg", className)}
      data-streamdown="heading-4"
      {...props}
    >
      {children}
    </h4>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH4.displayName = "MarkdownH4";

const MemoH5 = memo<HeadingProps<"h5">>(
  ({ children, className, node, ...props }) => (
    <h5
      className={cn("mt-6 mb-2 font-semibold text-base", className)}
      data-streamdown="heading-5"
      {...props}
    >
      {children}
    </h5>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH5.displayName = "MarkdownH5";

const MemoH6 = memo<HeadingProps<"h6">>(
  ({ children, className, node, ...props }) => (
    <h6
      className={cn("mt-6 mb-2 font-semibold text-sm", className)}
      data-streamdown="heading-6"
      {...props}
    >
      {children}
    </h6>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH6.displayName = "MarkdownH6";

type TableProps = WithNode<JSX.IntrinsicElements["table"]>;
const MemoTable = memo<TableProps>(
  ({ children, className, node, ...props }: TableProps) => {
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
  },
  (p, n) => sameClassAndNode(p, n)
);
MemoTable.displayName = "MarkdownTable";

type TheadProps = WithNode<JSX.IntrinsicElements["thead"]>;
const MemoThead = memo<TheadProps>(
  ({ children, className, node, ...props }: TheadProps) => (
    <thead
      className={cn("bg-muted/80", className)}
      data-streamdown="table-header"
      {...props}
    >
      {children}
    </thead>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoThead.displayName = "MarkdownThead";

type TbodyProps = WithNode<JSX.IntrinsicElements["tbody"]>;
const MemoTbody = memo<TbodyProps>(
  ({ children, className, node, ...props }: TbodyProps) => (
    <tbody
      className={cn("divide-y divide-border bg-muted/40", className)}
      data-streamdown="table-body"
      {...props}
    >
      {children}
    </tbody>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTbody.displayName = "MarkdownTbody";

type TrProps = WithNode<JSX.IntrinsicElements["tr"]>;
const MemoTr = memo<TrProps>(
  ({ children, className, node, ...props }: TrProps) => (
    <tr
      className={cn("border-border border-b", className)}
      data-streamdown="table-row"
      {...props}
    >
      {children}
    </tr>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTr.displayName = "MarkdownTr";

type ThProps = WithNode<JSX.IntrinsicElements["th"]>;
const MemoTh = memo<ThProps>(
  ({ children, className, node, ...props }: ThProps) => (
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
  (p, n) => sameClassAndNode(p, n)
);
MemoTh.displayName = "MarkdownTh";

type TdProps = WithNode<JSX.IntrinsicElements["td"]>;
const MemoTd = memo<TdProps>(
  ({ children, className, node, ...props }: TdProps) => (
    <td
      className={cn("px-4 py-2 text-sm", className)}
      data-streamdown="table-cell"
      {...props}
    >
      {children}
    </td>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTd.displayName = "MarkdownTd";

type BlockquoteProps = WithNode<JSX.IntrinsicElements["blockquote"]>;
const MemoBlockquote = memo<BlockquoteProps>(
  ({ children, className, node, ...props }: BlockquoteProps) => (
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
  (p, n) => sameClassAndNode(p, n)
);
MemoBlockquote.displayName = "MarkdownBlockquote";

type SupProps = WithNode<JSX.IntrinsicElements["sup"]>;
const MemoSup = memo<SupProps>(
  ({ children, className, node, ...props }: SupProps) => (
    <sup
      className={cn("text-sm", className)}
      data-streamdown="superscript"
      {...props}
    >
      {children}
    </sup>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoSup.displayName = "MarkdownSup";

type SubProps = WithNode<JSX.IntrinsicElements["sub"]>;
const MemoSub = memo<SubProps>(
  ({ children, className, node, ...props }: SubProps) => (
    <sub
      className={cn("text-sm", className)}
      data-streamdown="subscript"
      {...props}
    >
      {children}
    </sub>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoSub.displayName = "MarkdownSub";

type SectionProps = WithNode<JSX.IntrinsicElements["section"]>;
const MemoSection = memo<SectionProps>(
  ({ children, className, node, ...props }: SectionProps) => {
    // Check if this is a footnotes section
    const isFootnotesSection = "data-footnotes" in props;

    if (isFootnotesSection) {
      // Filter out empty footnote list items (those with only the backref link)
      // This happens during streaming when footnote definitions haven't fully arrived

      // Helper to check if a node is empty (only contains backref)
      const isEmptyFootnote = (listItem: React.ReactNode): boolean => {
        if (!isValidElement(listItem)) return false;

        const itemChildren = Array.isArray(listItem.props.children)
          ? listItem.props.children
          : [listItem.props.children];

        // Check if all children are either whitespace or backref links
        let hasContent = false;
        let hasBackref = false;

        for (const itemChild of itemChildren) {
          if (!itemChild) continue;

          if (typeof itemChild === "string") {
            // If there's non-whitespace text, it has content
            if (itemChild.trim() !== "") {
              hasContent = true;
            }
          } else if (isValidElement(itemChild)) {
            // Check if it's a backref link
            if (itemChild.props?.["data-footnote-backref"] !== undefined) {
              hasBackref = true;
            } else {
              // It's some other element (like <p>), which means it has content
              // But we need to check if the <p> has actual content
              const grandChildren = Array.isArray(itemChild.props.children)
                ? itemChild.props.children
                : [itemChild.props.children];

              for (const grandChild of grandChildren) {
                if (
                  typeof grandChild === "string" &&
                  grandChild.trim() !== ""
                ) {
                  hasContent = true;
                  break;
                }
                if (isValidElement(grandChild)) {
                  // If it's not a backref link, it's content
                  if (
                    grandChild.props?.["data-footnote-backref"] === undefined
                  ) {
                    hasContent = true;
                    break;
                  }
                }
              }
            }
          }
        }

        // It's empty if it only has a backref and no other content
        return hasBackref && !hasContent;
      };

      // Process children to filter out empty footnotes
      const processedChildren = Array.isArray(children)
        ? children.map((child) => {
            if (!isValidElement(child)) return child;

            // If this is an <ol> containing footnote list items
            if (child.type === MemoOl) {
              const listChildren = Array.isArray(child.props.children)
                ? child.props.children
                : [child.props.children];

              const filteredListChildren = listChildren.filter(
                (listItem: React.ReactNode) => !isEmptyFootnote(listItem)
              );

              // If all footnotes are empty, return null
              if (filteredListChildren.length === 0) {
                return null;
              }

              // Clone the <ol> with filtered children
              return {
                ...child,
                props: {
                  ...child.props,
                  children: filteredListChildren,
                },
              };
            }

            return child;
          })
        : children;

      // Check if we filtered out all content
      const hasAnyContent = Array.isArray(processedChildren)
        ? processedChildren.some((child) => child !== null)
        : processedChildren !== null;

      if (!hasAnyContent) {
        return null;
      }

      return (
        <section className={className} {...props}>
          {processedChildren}
        </section>
      );
    }

    // For non-footnotes sections, render normally
    return (
      <section className={className} {...props}>
        {children}
      </section>
    );
  },
  (p, n) => sameClassAndNode(p, n)
);
MemoSection.displayName = "MarkdownSection";

const CodeComponent = ({
  node,
  className,
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  ExtraProps) => {
  const inline = node?.position?.start.line === node?.position?.end.line;
  const mermaidConfig = useContext(MermaidConfigContext);
  const mermaidLoader = useContext(MermaidLoaderContext);
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
    if (!mermaidLoader) {
      return (
        <div
          className={cn(
            "my-4 rounded-xl border p-4 text-muted-foreground text-sm",
            className
          )}
          data-streamdown="mermaid-block"
        >
          Mermaid rendering is disabled. Provide a{" "}
          <code className="rounded bg-muted px-1 py-0.5">mermaidLoader</code>{" "}
          prop to <code className="rounded bg-muted px-1 py-0.5">Streamdown</code>{" "}
          to enable diagram support.
        </div>
      );
    }

    const showMermaidControls = shouldShowControls(controlsConfig, "mermaid");
    const showDownload = shouldShowMermaidControl(controlsConfig, "download");
    const showCopy = shouldShowMermaidControl(controlsConfig, "copy");
    const showFullscreen = shouldShowMermaidControl(controlsConfig, "fullscreen");

    return (
      <div
        className={cn(
          "group relative my-4 h-auto rounded-xl border p-4",
          className
        )}
        data-streamdown="mermaid-block"
      >
        {showMermaidControls && (showDownload || showCopy || showFullscreen) && (
          <div className="flex items-center justify-end gap-2">
            {showDownload && <CodeBlockDownloadButton code={code} language={language} />}
            {showCopy && <CodeBlockCopyButton code={code} />}
            {showFullscreen && <MermaidFullscreenButton chart={code} config={mermaidConfig} />}
          </div>
        )}
        <Mermaid chart={code} config={mermaidConfig} />
      </div>
    );
  }

  const showCodeControls = shouldShowControls(controlsConfig, "code");

  return (
    <CodeBlock
      className={cn("overflow-x-auto border-t border-border", className)}
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

const MemoCode = memo<
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & ExtraProps
>(
  CodeComponent,
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node)
);
MemoCode.displayName = "MarkdownCode";

const MemoImg = memo<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> &
    ExtraProps
>(
  ImageComponent,
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node)
);

MemoImg.displayName = "MarkdownImg";

type ParagraphProps = WithNode<JSX.IntrinsicElements["p"]>;
const MemoParagraph = memo<ParagraphProps>(
  ({ children, className, node, ...props }: ParagraphProps) => {
    // Check if the paragraph contains only an image element
    // If so, render the image directly without the <p> wrapper to avoid hydration errors
    // (since our ImageComponent returns a <div>, which cannot be nested inside <p>)

    // Handle both array and single child cases
    const childArray = Array.isArray(children) ? children : [children];

    // Filter out null/undefined/empty values
    const validChildren = childArray.filter(
      (child) => child !== null && child !== undefined && child !== ""
    );

    // Check if there's exactly one child and it's an img element
    if (
      validChildren.length === 1 &&
      isValidElement(validChildren[0]) &&
      (validChildren[0].props as { node?: MarkdownNode }).node?.tagName ===
        "img"
    ) {
      return <>{children}</>;
    }

    return (
      <p className={className} {...props}>
        {children}
      </p>
    );
  },
  (p, n) => sameClassAndNode(p, n)
);
MemoParagraph.displayName = "MarkdownParagraph";

export const components: Options["components"] = {
  ol: MemoOl,
  li: MemoLi,
  ul: MemoUl,
  hr: MemoHr,
  strong: MemoStrong,
  a: MemoA,
  h1: MemoH1,
  h2: MemoH2,
  h3: MemoH3,
  h4: MemoH4,
  h5: MemoH5,
  h6: MemoH6,
  table: MemoTable,
  thead: MemoThead,
  tbody: MemoTbody,
  tr: MemoTr,
  th: MemoTh,
  td: MemoTd,
  blockquote: MemoBlockquote,
  code: MemoCode,
  img: MemoImg,
  pre: ({ children }) => children,
  sup: MemoSup,
  sub: MemoSub,
  p: MemoParagraph,
  section: MemoSection,
};
