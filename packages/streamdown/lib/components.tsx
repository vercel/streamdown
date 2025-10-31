import {
  Blockquote,
  Box,
  Checkbox,
  Code,
  Divider,
  Group,
  List,
  type ListItemProps,
  type ListProps,
  Stack,
  Table,
  type TableProps,
  Text,
  type TextProps,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import cx from 'clsx';
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

type OlProps = WithNode<ListProps>;
const MemoOl = memo<OlProps>(
  ({ children, className, ...props }: OlProps) => (
    <List
      className={className}
      type="ordered"
      data-streamdown="ordered-list"
      {...props}
    >
      {children}
    </List>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoOl.displayName = 'MarkdownOl';

type LiProps = WithNode<ListItemProps>;

const findCheckboxInChildren = (children: React.ReactNode): boolean | null => {
  if (!children) return null;

  if (Array.isArray(children)) {
    for (const child of children) {
      const result = findCheckboxInChildren(child);
      if (result !== null) return result;
    }
    return null;
  }

  if (isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (children.type === 'input' && props?.type === 'checkbox') {
      return Boolean(props?.checked);
    }
    if (props?.children) {
      return findCheckboxInChildren(props.children as React.ReactNode);
    }
  }

  return null;
};

const removeCheckboxFromChildren = (
  children: React.ReactNode,
): React.ReactNode => {
  if (!children) return children;

  if (Array.isArray(children)) {
    return children
      .map((child) => removeCheckboxFromChildren(child))
      .filter(Boolean);
  }

  if (isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (children.type === 'input' && props?.type === 'checkbox') {
      return null;
    }
    if (props?.children) {
      const newProps = {
        ...props,
        children: removeCheckboxFromChildren(props.children as React.ReactNode),
      };
      return { ...children, props: newProps } as React.ReactElement;
    }
  }

  return children;
};

const MemoLi = memo<LiProps>(
  ({ children, className, ...props }: LiProps) => {
    const isTaskListItem = className?.includes('task-list-item');

    if (isTaskListItem) {
      const isChecked = findCheckboxInChildren(children);
      const processedChildren = removeCheckboxFromChildren(children);

      return (
        <List.Item
          py={2}
          className={className}
          data-streamdown="list-item"
          icon={
            <ThemeIcon size={20}>
              <Checkbox checked={!!isChecked} readOnly />
            </ThemeIcon>
          }
          {...props}
        >
          {processedChildren}
        </List.Item>
      );
    }

    return (
      <List.Item className={className} data-streamdown="list-item" {...props}>
        {children}
      </List.Item>
    );
  },
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoLi.displayName = 'MarkdownLi';

type UlProps = WithNode<ListProps>;
const MemoUl = memo<UlProps>(
  ({ children, className, ...props }: UlProps) => {
    const isTaskListItem = className?.includes('contains-task-list');

    return (
      <List
        center={isTaskListItem}
        className={className}
        data-streamdown="unordered-list"
        {...props}
      >
        {children}
      </List>
    );
  },
  (p, n) => sameClassAndNode(p, n),
);
MemoUl.displayName = 'MarkdownUl';

type HrProps = WithNode<JSX.IntrinsicElements['hr']>;
const MemoHr = memo<HrProps>(
  (props: HrProps) => <Divider data-streamdown="horizontal-rule" {...props} />,
  (p, n) => sameClassAndNode(p, n),
);
MemoHr.displayName = 'MarkdownHr';

type StrongProps = WithNode<TextProps>;
const MemoStrong = memo<StrongProps>(
  ({ children, className, ...props }: StrongProps) => (
    <Text
      span
      fw={600}
      className={className}
      data-streamdown="strong"
      {...props}
    >
      {children}
    </Text>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoStrong.displayName = 'MarkdownStrong';

type AProps = WithNode<JSX.IntrinsicElements['a']> & { href?: string };
const MemoA = memo<AProps>(
  ({ children, className, href, ...props }: AProps) => {
    const isIncomplete = href === 'streamdown:incomplete-link';

    return (
      <UnstyledButton
        component="a"
        fw={50}
        c="var(--mantine-color-anchor)"
        style={{ overflowWrap: 'anywhere', cursor: 'pointer' }}
        className={className}
        data-incomplete={isIncomplete}
        data-streamdown="link"
        href={href}
        {...props}
      >
        {children}
      </UnstyledButton>
    );
  },
  (p, n) => sameClassAndNode(p, n) && p.href === n.href,
);
MemoA.displayName = 'MarkdownA';

type HeadingProps<TTag extends keyof JSX.IntrinsicElements> = WithNode<
  JSX.IntrinsicElements[TTag]
>;

const MemoH1 = memo<HeadingProps<'h1'>>(
  (props) => <Title mt={24} mb={8} data-streamdown="heading-1" {...props} />,
  (p, n) => sameClassAndNode(p, n),
);
MemoH1.displayName = 'MarkdownH1';

const MemoH2 = memo<HeadingProps<'h2'>>(
  (props) => (
    <Title order={2} mt={24} mb={8} data-streamdown="heading-2" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH2.displayName = 'MarkdownH2';

const MemoH3 = memo<HeadingProps<'h3'>>(
  (props) => (
    <Title order={3} mt={24} mb={8} data-streamdown="heading-3" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH3.displayName = 'MarkdownH3';

const MemoH4 = memo<HeadingProps<'h4'>>(
  (props) => (
    <Title order={4} mt={24} mb={8} data-streamdown="heading-4" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH4.displayName = 'MarkdownH4';

const MemoH5 = memo<HeadingProps<'h5'>>(
  (props) => (
    <Title order={5} mt={24} mb={8} data-streamdown="heading-5" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH5.displayName = 'MarkdownH5';

const MemoH6 = memo<HeadingProps<'h6'>>(
  (props) => (
    <Title order={6} mt={24} mb={8} data-streamdown="heading-6" {...props} />
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoH6.displayName = 'MarkdownH6';

type NodeTableProps = WithNode<TableProps>;
const MemoTable = memo<NodeTableProps>(
  ({ children, className, ...props }: NodeTableProps) => {
    const controlsConfig = useContext(ControlsContext);
    const showTableControls = shouldShowControls(controlsConfig, 'table');

    return (
      <Stack gap={2} align="stretch" data-streamdown="table-wrapper">
        {showTableControls && (
          <Group justify="flex-end">
            <TableCopyButton />
            <TableDownloadDropdown />
          </Group>
        )}
        <Box
          bdrs="md"
          bd="1px solid var(--mantine-color-default-border)"
          style={{ overflow: 'hidden' }}
        >
          <Table
            className={className}
            data-streamdown="table"
            striped
            {...props}
          >
            {children}
          </Table>
        </Box>
      </Stack>
    );
  },
  (p, n) => sameClassAndNode(p, n),
);
MemoTable.displayName = 'MarkdownTable';

type TheadProps = WithNode<JSX.IntrinsicElements['thead']>;
const MemoThead = memo<TheadProps>(
  ({ children, className, ...props }: TheadProps) => (
    <Table.Thead
      className={className}
      data-streamdown="table-header"
      {...props}
    >
      {children}
    </Table.Thead>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoThead.displayName = 'MarkdownThead';

type TbodyProps = WithNode<JSX.IntrinsicElements['tbody']>;
const MemoTbody = memo<TbodyProps>(
  ({ children, className, ...props }: TbodyProps) => (
    <Table.Tbody className={className} data-streamdown="table-body" {...props}>
      {children}
    </Table.Tbody>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTbody.displayName = 'MarkdownTbody';

type TrProps = WithNode<JSX.IntrinsicElements['tr']>;
const MemoTr = memo<TrProps>(
  ({ children, className, ...props }: TrProps) => (
    <Table.Tr className={className} data-streamdown="table-row" {...props}>
      {children}
    </Table.Tr>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTr.displayName = 'MarkdownTr';

type ThProps = WithNode<JSX.IntrinsicElements['th']>;
const MemoTh = memo<ThProps>(
  ({ children, className, ...props }: ThProps) => (
    <Table.Th
      className={className}
      data-streamdown="table-header-cell"
      {...props}
    >
      {children}
    </Table.Th>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTh.displayName = 'MarkdownTh';

type TdProps = WithNode<JSX.IntrinsicElements['td']>;
const MemoTd = memo<TdProps>(
  ({ children, className, ...props }: TdProps) => (
    <Table.Td className={className} data-streamdown="table-cell" {...props}>
      {children}
    </Table.Td>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoTd.displayName = 'MarkdownTd';

type BlockquoteProps = WithNode<JSX.IntrinsicElements['blockquote']>;
const MemoBlockquote = memo<BlockquoteProps>(
  ({ children, className, ...props }: BlockquoteProps) => (
    <Blockquote
      className={className}
      // className={cx(
      //   //'my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic',
      //   css({ my: 4, borderColor: 'border/30', borderLeftWidth: '4px', pt: 4 }),
      //   className,
      // )}
      data-streamdown="blockquote"
      {...props}
    >
      {children}
    </Blockquote>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoBlockquote.displayName = 'MarkdownBlockquote';

type SupProps = WithNode<JSX.IntrinsicElements['sup']>;
const MemoSup = memo<SupProps>(
  ({ children, className, ...props }: SupProps) => (
    <Box
      component="sup"
      fz="sm"
      className={className}
      data-streamdown="superscript"
      {...props}
    >
      {children}
    </Box>
  ),
  (p, n) => sameClassAndNode(p, n),
);
MemoSup.displayName = 'MarkdownSup';

type SubProps = WithNode<JSX.IntrinsicElements['sub']>;
const MemoSub = memo<SubProps>(
  ({ children, className, ...props }: SubProps) => (
    <Box
      component="sub"
      fz="sm"
      className={className}
      data-streamdown="subscript"
      {...props}
    >
      {children}
    </Box>
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
      <Code className={className} data-streamdown="inline-code" {...props}>
        {children}
      </Code>
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
      <Box
        pos="relative"
        my="md"
        h="auto"
        bdrs="lg"
        p="md"
        style={{ borderWidth: '1px' }}
        className={cx('group', className)}
        data-streamdown="mermaid-block"
      >
        {showMermaidControls && (
          <Group display="flex" align="center" justify="flex-end" gap={8}>
            <CodeBlockDownloadButton code={code} language={language} />
            <CodeBlockCopyButton code={code} />
          </Group>
        )}
        <Mermaid chart={code} config={mermaidConfig} />
      </Box>
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
      // preClassName={css({
      //   overflowX: 'auto',
      //   fontFamily: 'mono',
      //   textStyle: 'p5',
      //   p: 4,
      // })}
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
  // @ts-expect-error
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
