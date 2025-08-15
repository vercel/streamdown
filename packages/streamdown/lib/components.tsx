// import { CodeBlock, CodeBlockCopyButton } from './code-block';
import { isValidElement } from 'react';
import type { Options } from 'react-markdown';
import { cn } from './utils';

export const components: Options['components'] = {
  ol: ({ node, children, className, ...props }) => (
    <ol className={cn('ml-4 list-outside list-decimal', className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ node, children, className, ...props }) => (
    <li className={cn('py-1', className)} {...props}>
      {children}
    </li>
  ),
  ul: ({ node, children, className, ...props }) => (
    <ul className={cn('ml-4 list-outside list-disc', className)} {...props}>
      {children}
    </ul>
  ),
  hr: ({ node, className, ...props }) => (
    <hr className={cn('my-6 border-border', className)} {...props} />
  ),
  strong: ({ node, children, className, ...props }) => (
    <span className={cn('font-semibold', className)} {...props}>
      {children}
    </span>
  ),
  a: ({ node, children, className, ...props }) => (
    <a
      className={cn('font-medium text-primary underline', className)}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ node, children, className, ...props }) => (
    <h1
      className={cn('mt-6 mb-2 font-semibold text-3xl', className)}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, className, ...props }) => (
    <h2
      className={cn('mt-6 mb-2 font-semibold text-2xl', className)}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ node, children, className, ...props }) => (
    <h3 className={cn('mt-6 mb-2 font-semibold text-xl', className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, className, ...props }) => (
    <h4 className={cn('mt-6 mb-2 font-semibold text-lg', className)} {...props}>
      {children}
    </h4>
  ),
  h5: ({ node, children, className, ...props }) => (
    <h5
      className={cn('mt-6 mb-2 font-semibold text-base', className)}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ node, children, className, ...props }) => (
    <h6 className={cn('mt-6 mb-2 font-semibold text-sm', className)} {...props}>
      {children}
    </h6>
  ),
  table: ({ node, children, className, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table
        className={cn('w-full border-collapse border border-border', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ node, children, className, ...props }) => (
    <thead className={cn('bg-muted/50', className)} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ node, children, className, ...props }) => (
    <tbody className={cn('divide-y divide-border', className)} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ node, children, className, ...props }) => (
    <tr className={cn('border-border border-b', className)} {...props}>
      {children}
    </tr>
  ),
  th: ({ node, children, className, ...props }) => (
    <th
      className={cn('px-4 py-2 text-left font-semibold text-sm', className)}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, children, className, ...props }) => (
    <td className={cn('px-4 py-2 text-sm', className)} {...props}>
      {children}
    </td>
  ),
  blockquote: ({ node, children, className, ...props }) => (
    <blockquote
      className={cn(
        'my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic',
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ node, className, ...props }) => {
    const inline = node?.position?.start.line === node?.position?.end.line;

    if (!inline) {
      return <code className={className} {...props} />;
    }

    return (
      <code
        className={cn(
          'rounded bg-muted px-1.5 py-0.5 font-mono text-sm',
          className
        )}
        {...props}
      />
    );
  },
  pre: ({ node, className, children, ...props }) => {
    let language = 'javascript';

    if (typeof node?.properties?.className === 'string') {
      language = node.properties.className.replace('language-', '');
    }

    // Extract code content from children safely
    let code = '';
    if (
      isValidElement(children) &&
      children.props &&
      typeof children.props.children === 'string'
    ) {
      code = children.props.children;
    } else if (typeof children === 'string') {
      code = children;
    }

    return (
      <pre className={cn('my-4 h-auto', className)} {...props}>
        <code className={cn('language-javascript', className)}>{code}</code>
      </pre>
      // <CodeBlock
      //   className={cn('my-4 h-auto', className)}
      //   code={code}
      //   language={language}
      // >
      //   <CodeBlockCopyButton
      //     onCopy={() => console.log('Copied code to clipboard')}
      //     onError={() => console.error('Failed to copy code to clipboard')}
      //   />
      // </CodeBlock>
    );
  },
};
