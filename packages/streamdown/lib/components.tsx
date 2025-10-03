import { css, cx } from '@rolder/ss-react/css';
import { Divider, VStack } from '@rolder/ss-react/jsx';
import { Text } from '@rolder/ui-kit-react';
import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  isValidElement,
  type JSX,
  memo,
  useContext,
} from 'react';
import type { ExtraProps, Options } from 'react-markdown';
import type { BundledLanguage } from 'shiki';
import { ControlsContext, MermaidConfigContext } from '../index';
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from './code-block';
import { ImageComponent } from './image';
import { Mermaid } from './mermaid';
import { TableCopyButton, TableDownloadDropdown } from './table';

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
  next: { className?: string; node?: MarkdownNode },
) {
  return (
    prev.className === next.className && sameNodePosition(prev.node, next.node)
  );
}

const shouldShowControls = (
  config: boolean | { table?: boolean; code?: boolean; mermaid?: boolean },
  type: 'table' | 'code' | 'mermaid',
) => {
  if (typeof config === 'boolean') {
    return config;
  }

  return config[type] !== false;
};

type OlProps = WithNode<JSX.IntrinsicElements['ol']>;
const MemoOl = memo<OlProps>(
  ({ children, className, ...props }: OlProps) => (
    <ol
      className={cx(
        css({
          ml: 4,
          listStylePosition: 'outside',
          listStyleType: 'decimal',
          whiteSpace: 'normal',
        }),
        className,
      )}
      data-streamdown="ordered-list"
      {...props}
    >
      {children}
    </ol>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoOl.displayName = 'MarkdownOl';

type LiProps = WithNode<JSX.IntrinsicElements['li']>;

const MemoLi = memo<LiProps>(
  ({ children, className, ...props }: LiProps) => (
    <li
      className={cx(
        css({
          py: 1,
          '& > input[type="checkbox"]': {
            boxSize: '4',
            mr: 1,
          },
          '& > *': {
            verticalAlign: 'middle',
            mb: 1,
          },
        }),
        className,
      )}
      data-streamdown="list-item"
      {...props}
    >
      {children}
    </li>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoLi.displayName = 'MarkdownLi';

type UlProps = WithNode<JSX.IntrinsicElements['ul']>;
const MemoUl = memo<UlProps>(
  ({ children, className, ...props }: UlProps) => (
    <ul
      className={cx(
        css({
          ml: 4,
          listStyleType: 'disc',
          whiteSpace: 'normal',
        }),
        className,
      )}
      data-streamdown="unordered-list"
      {...props}
    >
      {children}
    </ul>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoUl.displayName = 'MarkdownUl';

type HrProps = WithNode<JSX.IntrinsicElements['hr']>;
const MemoHr = memo<HrProps>(
  (props: HrProps) => (
    <Divider data-streamdown="horizontal-rule" color="border" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoHr.displayName = 'MarkdownHr';

type StrongProps = WithNode<JSX.IntrinsicElements['span']>;
const MemoStrong = memo<StrongProps>(
  ({ children, className, ...props }: StrongProps) => (
    <span
      className={cx(css({ fontWeight: '500' }), className)}
      data-streamdown="strong"
      {...props}
    >
      {children}
    </span>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoStrong.displayName = 'MarkdownStrong';

type AProps = WithNode<JSX.IntrinsicElements['a']> & { href?: string };
const MemoA = memo<AProps>(
  ({ children, className, href, ...props }: AProps) => {
    const isIncomplete = href === 'streamdown:incomplete-link';

    return (
      <a
        className={cx(
          css({
            overflowWrap: 'anywhere',
            fontWeight: '500',
            color: 'text.accent',
            textDecoration: 'underline',
          }),
          className,
        )}
        data-incomplete={isIncomplete}
        data-streamdown="link"
        {...props}
      >
        {children}
      </a>
    );
  },
  (p, n) => sameClassAndNode(p, n) && p.href === n.href,
);
MemoA.displayName = 'MarkdownA';

type HeadingProps<TTag extends keyof JSX.IntrinsicElements> = WithNode<
  JSX.IntrinsicElements[TTag]
>;

const MemoH1 = memo<HeadingProps<'h1'>>(
  (props) => (
    <Text.H1 mt={6} mb={2} medium data-streamdown="heading-1" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH1.displayName = 'MarkdownH1';

const MemoH2 = memo<HeadingProps<'h2'>>(
  (props) => (
    <Text.H2 mt={6} mb={2} medium data-streamdown="heading-2" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH2.displayName = 'MarkdownH2';

const MemoH3 = memo<HeadingProps<'h3'>>(
  (props) => (
    <Text.H3 mt={6} mb={2} medium data-streamdown="heading-3" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH3.displayName = 'MarkdownH3';

const MemoH4 = memo<HeadingProps<'h4'>>(
  (props) => (
    <Text.P2 mt={6} mb={2} medium data-streamdown="heading-4" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH4.displayName = 'MarkdownH4';

const MemoH5 = memo<HeadingProps<'h5'>>(
  (props) => (
    <Text.P3 mt={6} mb={2} medium data-streamdown="heading-5" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH5.displayName = 'MarkdownH5';

const MemoH6 = memo<HeadingProps<'h6'>>(
  (props) => (
    <Text.P4 mt={6} mb={2} medium data-streamdown="heading-6" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH6.displayName = 'MarkdownH6';

type TableProps = WithNode<JSX.IntrinsicElements['table']>;
const MemoTable = memo<TableProps>(
  ({ children, className, ...props }: TableProps) => {
    const controlsConfig = useContext(ControlsContext);
    const showTableControls = shouldShowControls(controlsConfig, 'table');

    return (
      <VStack
        my={4}
        spaceY={2}
        //className="my-4 flex flex-col space-y-2"
        // className={css({
        //   my: 4,
        //   display: 'flex',
        //   flexDirection: 'column',
        //   spaceY: 2,
        // })}
        data-streamdown="table-wrapper"
      >
        {showTableControls && (
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
            })}
          >
            <TableCopyButton />
            <TableDownloadDropdown />
          </div>
        )}
        <div className={css({ overflowX: 'auto' })}>
          <table
            className={cx(
              css({
                w: 'full',
                borderCollapse: 'collapse',
                borderWidth: '1px',
                borderColor: 'border',
              }),
              className,
            )}
            data-streamdown="table"
            {...props}
          >
            {children}
          </table>
        </div>
      </VStack>
    );
  },
  (p, n) => sameClassAndNode(p, n),
);
MemoTable.displayName = 'MarkdownTable';

type TheadProps = WithNode<JSX.IntrinsicElements['thead']>;
const MemoThead = memo<TheadProps>(
  ({ children, className, ...props }: TheadProps) => (
    <thead
      className={cx(
        //'bg-muted/80',
        css({ bg: 'bg/80' }),
        className,
      )}
      data-streamdown="table-header"
      {...props}
    >
      {children}
    </thead>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoThead.displayName = 'MarkdownThead';

type TbodyProps = WithNode<JSX.IntrinsicElements['tbody']>;
const MemoTbody = memo<TbodyProps>(
  ({ children, className, ...props }: TbodyProps) => (
    <tbody
      className={cx(
        // 'divide-y divide-border bg-muted/40',
        css({ divideY: '1px', divideColor: 'border', bg: 'bg/40' }),
        className,
      )}
      data-streamdown="table-body"
      {...props}
    >
      {children}
    </tbody>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTbody.displayName = 'MarkdownTbody';

type TrProps = WithNode<JSX.IntrinsicElements['tr']>;
const MemoTr = memo<TrProps>(
  ({ children, className, ...props }: TrProps) => (
    <tr
      className={cx(
        css({ borderColor: 'border', borderBottomWidth: '1px' }),
        className,
      )}
      data-streamdown="table-row"
      {...props}
    >
      {children}
    </tr>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTr.displayName = 'MarkdownTr';

type ThProps = WithNode<JSX.IntrinsicElements['th']>;
const MemoTh = memo<ThProps>(
  ({ children, className, ...props }: ThProps) => (
    <th
      className={cx(
        //'whitespace-nowrap px-4 py-2 text-left font-semibold text-sm',
        css({
          whiteSpace: 'nowrap',
          px: 4,
          py: 2,
          textAlign: 'left',
          fontWeight: '500',
          textStyle: 'p4',
        }),
        className,
      )}
      data-streamdown="table-header-cell"
      {...props}
    >
      {children}
    </th>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTh.displayName = 'MarkdownTh';

type TdProps = WithNode<JSX.IntrinsicElements['td']>;
const MemoTd = memo<TdProps>(
  ({ children, className, ...props }: TdProps) => (
    <td
      //'px-4 py-2 text-sm'
      className={cx(css({ px: 4, py: 2, textStyle: 'p4' }), className)}
      data-streamdown="table-cell"
      {...props}
    >
      {children}
    </td>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTd.displayName = 'MarkdownTd';

type BlockquoteProps = WithNode<JSX.IntrinsicElements['blockquote']>;
const MemoBlockquote = memo<BlockquoteProps>(
  ({ children, className, ...props }: BlockquoteProps) => (
    <blockquote
      className={cx(
        //'my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic',
        css({ my: 4, borderColor: 'border/30', borderLeftWidth: '4px', pt: 4 }),
        className,
      )}
      data-streamdown="blockquote"
      {...props}
    >
      {children}
    </blockquote>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoBlockquote.displayName = 'MarkdownBlockquote';

type SupProps = WithNode<JSX.IntrinsicElements['sup']>;
const MemoSup = memo<SupProps>(
  ({ children, className, ...props }: SupProps) => (
    <sup
      className={cx(css({ textStyle: 'p4' }), className)}
      data-streamdown="superscript"
      {...props}
    >
      {children}
    </sup>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoSup.displayName = 'MarkdownSup';

type SubProps = WithNode<JSX.IntrinsicElements['sub']>;
const MemoSub = memo<SubProps>(
  ({ children, className, ...props }: SubProps) => (
    <sub
      className={cx(css({ textStyle: 'p4' }), className)}
      data-streamdown="subscript"
      {...props}
    >
      {children}
    </sub>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoSub.displayName = 'MarkdownSub';

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
        className={cx(
          //'rounded bg-muted px-1.5 py-0.5 font-mono text-sm',
          css({
            rounded: 'xl',
            bg: 'bg',
            px: 1.5,
            py: 0.5,
            fontFamily: 'mono',
            textStyle: 'p4',
          }),
          className,
        )}
        data-streamdown="inline-code"
        {...props}
      >
        {children}
      </code>
    );
  }

  const match = className?.match(LANGUAGE_REGEX);
  const language = (match?.at(1) ?? '') as BundledLanguage;

  // Extract code content from children safely
  let code = '';
  if (
    isValidElement(children) &&
    children.props &&
    typeof children.props === 'object' &&
    'children' in children.props &&
    typeof children.props.children === 'string'
  ) {
    code = children.props.children;
  } else if (typeof children === 'string') {
    code = children;
  }

  if (language === 'mermaid') {
    const showMermaidControls = shouldShowControls(controlsConfig, 'mermaid');

    return (
      <div
        className={cx(
          'group',
          css({
            pos: 'relative',
            my: 4,
            h: 'auto',
            rounded: 'xl',
            borderWidth: '1px',
            p: 4,
          }),
          className,
        )}
        data-streamdown="mermaid-block"
      >
        {showMermaidControls && (
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2,
            })}
          >
            <CodeBlockDownloadButton code={code} language={language} />
            <CodeBlockCopyButton code={code} />
          </div>
        )}
        <Mermaid chart={code} config={mermaidConfig} />
      </div>
    );
  }

  const showCodeControls = shouldShowControls(controlsConfig, 'code');

  return (
    <CodeBlock
      className={className}
      code={code}
      data-language={language}
      data-streamdown="code-block"
      language={language}
      preClassName={css({
        overflowX: 'auto',
        fontFamily: 'mono',
        textStyle: 'p5',
        p: 4,
      })}
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
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoCode.displayName = 'MarkdownCode';

const MemoImg = memo<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> &
    ExtraProps
>(
  ImageComponent,
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);

MemoImg.displayName = 'MarkdownImg';

export const components: Options['components'] = {
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
