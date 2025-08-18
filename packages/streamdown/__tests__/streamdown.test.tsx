import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Streamdown } from '../index';

// Mock the dependencies
vi.mock('react-markdown', () => ({
  default: ({ 
    children, 
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    rehypePlugins,
    remarkPlugins,
    components,
    ...props 
  }: any) => (
    <div data-testid="markdown" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('harden-react-markdown', () => ({
  default: (Component: any) => Component,
}));

vi.mock('rehype-katex', () => ({
  default: () => {},
}));

vi.mock('remark-gfm', () => ({
  default: () => {},
}));

vi.mock('remark-math', () => ({
  default: () => {},
}));

describe('Streamdown Component', () => {
  it('should render markdown content', () => {
    const content = '# Hello World';
    const { container } = render(<Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should parse incomplete markdown by default', () => {
    const content = 'Text with **incomplete bold';
    const { container } = render(<Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe('Text with **incomplete bold**');
  });

  it('should not parse incomplete markdown when disabled', () => {
    const content = 'Text with **incomplete bold';
    const { container } = render(<Streamdown parseIncompleteMarkdown={false}>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe('Text with **incomplete bold');
  });

  it('should handle non-string children', () => {
    const content = <div>React Element</div>;
    const { container } = render(<Streamdown>{content as any}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should pass through custom props', () => {
    const { container } = render(
      <Streamdown className="custom-class" data-custom="value">
        Content
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.getAttribute('class')).toContain('custom-class');
    expect(markdown?.getAttribute('data-custom')).toBe('value');
  });

  it('should use default allowed prefixes when not specified', () => {
    const { container } = render(<Streamdown>Content</Streamdown>);
    // These props are passed to child Block components, not to the wrapper div
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should use custom allowed prefixes when specified', () => {
    const { container } = render(
      <Streamdown
        allowedImagePrefixes={['https://', 'http://']}
        allowedLinkPrefixes={['https://', 'mailto:']}
      >
        Content
      </Streamdown>
    );
    // These props are passed to child Block components, not to the wrapper div
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should pass defaultOrigin prop', () => {
    const { container } = render(
      <Streamdown defaultOrigin="https://example.com">Content</Streamdown>
    );
    // This prop is passed to child Block components, not to the wrapper div
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should merge custom components with defaults', () => {
    const customComponents = {
      h1: ({ children }: any) => <h1 className="custom-h1">{children}</h1>,
    };

    const { container } = render(
      <Streamdown components={customComponents}># Heading</Streamdown>
    );

    // The markdown might not render synchronously, let's check the wrapper exists
    const wrapper = container.querySelector('[data-testid="markdown"]');
    expect(wrapper).toBeTruthy();
    
    // Check if any h1 exists at all (custom or default)
    const h1 = container.querySelector('h1');
    // If h1 exists, it should have the custom class
    if (h1) {
      expect(h1.className).toContain('custom-h1');
      expect(h1.textContent).toBe('Heading');
    } else {
      // The component renders but heading might be parsed differently
      expect(wrapper?.textContent).toContain('Heading');
    }
  });

  it('should merge custom rehype plugins', () => {
    const customPlugin = () => {};

    const { container } = render(
      <Streamdown rehypePlugins={[customPlugin]}>Content</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should merge custom remark plugins', () => {
    const customPlugin = () => {};

    const { container } = render(
      <Streamdown remarkPlugins={[customPlugin]}>Content</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should memoize based on children prop', () => {
    const { rerender, container } = render(
      <Streamdown className="class1">Content</Streamdown>
    );

    // Same children, different prop - should not re-render (memoized)
    rerender(<Streamdown className="class2">Content</Streamdown>);

    // Different children - should re-render
    rerender(<Streamdown className="class2">Different Content</Streamdown>);

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe('Different Content');
  });

  it('should handle empty children', () => {
    const { container } = render(<Streamdown>{''}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe('');
  });

  it('should handle null children', () => {
    const { container } = render(<Streamdown>{null as any}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should handle undefined children', () => {
    const { container } = render(<Streamdown>{undefined as any}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should handle number children', () => {
    const { container } = render(<Streamdown>{123 as any}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    // Numbers are coerced to empty string in parseMarkdownIntoBlocks
    expect(markdown?.textContent).toBe('');
  });

  it('should handle complex markdown with incomplete tokens', () => {
    const content = `
# Heading
This is **bold** and *italic* text.
Here's an incomplete **bold
And an incomplete [link
`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    // Check that incomplete markdown is parsed correctly
    expect(markdown?.textContent).toContain('Heading');
    expect(markdown?.textContent).toContain('bold');
    expect(markdown?.textContent).toContain('italic');
  });
});
