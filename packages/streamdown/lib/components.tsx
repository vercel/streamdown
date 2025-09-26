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
  config: boolean | { table?: boolean; code?: boolean; mermaid?: boolean },
  type: "table" | "code" | "mermaid"
) => {
  if (typeof config === "boolean") {
    return config;
  }

  return config[type] !== false;
};

type OlProps = WithNode<JSX.IntrinsicElements["ol"]>;
const MemoOl = memo<OlProps>(
  ({ children, className, node, ...htmlProps }: OlProps) => (
    <ol
      className={cn(
        "ml-4 list-outside list-decimal whitespace-normal",
        className
      )}
      data-streamdown="ordered-list"
      {...htmlProps}
    >
      {children}
    </ol>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoOl.displayName = "MarkdownOl";

type LiProps = WithNode<JSX.IntrinsicElements["li"]>;

const MemoLi = memo<LiProps>(
  ({ children, className, node, ...htmlProps }: LiProps) => (
    <li
      className={cn("py-1", className)}
      data-streamdown="list-item"
      {...htmlProps}
    >
      {children}
    </li>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node)
);
MemoLi.displayName = "MarkdownLi";

type UlProps = WithNode<JSX.IntrinsicElements["ul"]>;
const MemoUl = memo<UlProps>(
  ({ children, className, node, ...htmlProps }: UlProps) => (
    <ul
      className={cn("ml-4 list-outside list-disc whitespace-normal", className)}
      data-streamdown="unordered-list"
      {...htmlProps}
    >
      {children}
    </ul>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoUl.displayName = "MarkdownUl";

type HrProps = WithNode<JSX.IntrinsicElements["hr"]>;
const MemoHr = memo<HrProps>(
  ({ className, node, ...htmlProps }: HrProps) => (
    <hr
      className={cn("my-6 border-border", className)}
      data-streamdown="horizontal-rule"
      {...htmlProps}
    />
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoHr.displayName = "MarkdownHr";

type StrongProps = WithNode<JSX.IntrinsicElements["span"]>;
const MemoStrong = memo<StrongProps>(
  ({ children, className, node, ...htmlProps }: StrongProps) => (
    <span
      className={cn("font-semibold", className)}
      data-streamdown="strong"
      {...htmlProps}
    >
      {children}
    </span>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoStrong.displayName = "MarkdownStrong";

type AProps = WithNode<JSX.IntrinsicElements["a"]> & { href?: string };
const MemoA = memo<AProps>(
  ({ children, className, href, node, ...htmlProps }: AProps) => {
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
        {...htmlProps}
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
  ({ children, className, node, ...htmlProps }) => (
    <h1
      className={cn("mt-6 mb-2 font-semibold text-3xl", className)}
      data-streamdown="heading-1"
      {...htmlProps}
    >
      {children}
    </h1>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH1.displayName = "MarkdownH1";

const MemoH2 = memo<HeadingProps<"h2">>(
  ({ children, className, node, ...htmlProps }) => (
    <h2
      className={cn("mt-6 mb-2 font-semibold text-2xl", className)}
      data-streamdown="heading-2"
      {...htmlProps}
    >
      {children}
    </h2>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH2.displayName = "MarkdownH2";

const MemoH3 = memo<HeadingProps<"h3">>(
  ({ children, className, node, ...htmlProps }) => (
    <h3
      className={cn("mt-6 mb-2 font-semibold text-xl", className)}
      data-streamdown="heading-3"
      {...htmlProps}
    >
      {children}
    </h3>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH3.displayName = "MarkdownH3";

const MemoH4 = memo<HeadingProps<"h4">>(
  ({ children, className, node, ...htmlProps }) => (
    <h4
      className={cn("mt-6 mb-2 font-semibold text-lg", className)}
      data-streamdown="heading-4"
      {...htmlProps}
    >
      {children}
    </h4>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH4.displayName = "MarkdownH4";

const MemoH5 = memo<HeadingProps<"h5">>(
  ({ children, className, node, ...htmlProps }) => (
    <h5
      className={cn("mt-6 mb-2 font-semibold text-base", className)}
      data-streamdown="heading-5"
      {...htmlProps}
    >
      {children}
    </h5>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH5.displayName = "MarkdownH5";

const MemoH6 = memo<HeadingProps<"h6">>(
  ({ children, className, node, ...htmlProps }) => (
    <h6
      className={cn("mt-6 mb-2 font-semibold text-sm", className)}
      data-streamdown="heading-6"
      {...htmlProps}
    >
      {children}
    </h6>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoH6.displayName = "MarkdownH6";

type TableProps = WithNode<JSX.IntrinsicElements["table"]>;
const MemoTable = memo<TableProps>(
  ({ children, className, node, ...htmlProps }: TableProps) => {
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
            {...htmlProps}
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
  ({ children, className, node, ...htmlProps }: TheadProps) => (
    <thead
      className={cn("bg-muted/80", className)}
      data-streamdown="table-header"
      {...htmlProps}
    >
      {children}
    </thead>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoThead.displayName = "MarkdownThead";

type TbodyProps = WithNode<JSX.IntrinsicElements["tbody"]>;
const MemoTbody = memo<TbodyProps>(
  ({ children, className, node, ...htmlProps }: TbodyProps) => (
    <tbody
      className={cn("divide-y divide-border bg-muted/40", className)}
      data-streamdown="table-body"
      {...htmlProps}
    >
      {children}
    </tbody>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTbody.displayName = "MarkdownTbody";

type TrProps = WithNode<JSX.IntrinsicElements["tr"]>;
const MemoTr = memo<TrProps>(
  ({ children, className, node, ...htmlProps }: TrProps) => (
    <tr
      className={cn("border-border border-b", className)}
      data-streamdown="table-row"
      {...htmlProps}
    >
      {children}
    </tr>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTr.displayName = "MarkdownTr";

type ThProps = WithNode<JSX.IntrinsicElements["th"]>;
const MemoTh = memo<ThProps>(
  ({ children, className, node, ...htmlProps }: ThProps) => (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-2 text-left font-semibold text-sm",
        className
      )}
      data-streamdown="table-header-cell"
      {...htmlProps}
    >
      {children}
    </th>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTh.displayName = "MarkdownTh";

type TdProps = WithNode<JSX.IntrinsicElements["td"]>;
const MemoTd = memo<TdProps>(
  ({ children, className, node, ...htmlProps }: TdProps) => (
    <td
      className={cn("px-4 py-2 text-sm", className)}
      data-streamdown="table-cell"
      {...htmlProps}
    >
      {children}
    </td>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoTd.displayName = "MarkdownTd";

type BlockquoteProps = WithNode<JSX.IntrinsicElements["blockquote"]>;
const MemoBlockquote = memo<BlockquoteProps>(
  ({ children, className, node, ...htmlProps }: BlockquoteProps) => (
    <blockquote
      className={cn(
        "my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic",
        className
      )}
      data-streamdown="blockquote"
      {...htmlProps}
    >
      {children}
    </blockquote>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoBlockquote.displayName = "MarkdownBlockquote";

type SupProps = WithNode<JSX.IntrinsicElements["sup"]>;
const MemoSup = memo<SupProps>(
  ({ children, className, node, ...htmlProps }: SupProps) => (
    <sup
      className={cn("text-sm", className)}
      data-streamdown="superscript"
      {...htmlProps}
    >
      {children}
    </sup>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoSup.displayName = "MarkdownSup";

type SubProps = WithNode<JSX.IntrinsicElements["sub"]>;
const MemoSub = memo<SubProps>(
  ({ children, className, node, ...htmlProps }: SubProps) => (
    <sub
      className={cn("text-sm", className)}
      data-streamdown="subscript"
      {...htmlProps}
    >
      {children}
    </sub>
  ),
  (p, n) => sameClassAndNode(p, n)
);
MemoSub.displayName = "MarkdownSub";

const CodeComponent = ({
  node,
  className,
  children,
  ...htmlProps
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
        {...htmlProps}
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
};
