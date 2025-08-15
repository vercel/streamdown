import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Streamdown } from '../index';
import React from 'react';

// Mock the dependencies
vi.mock('react-markdown', () => ({
  default: ({ children, ...props }: any) => <div data-testid="markdown" {...props}>{children}</div>
}));

vi.mock('harden-react-markdown', () => ({
  default: (Component: any) => Component
}));

vi.mock('rehype-katex', () => ({
  default: () => {}
}));

vi.mock('remark-gfm', () => ({
  default: () => {}
}));

vi.mock('remark-math', () => ({
  default: () => {}
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
    render(<Streamdown>{content}</Streamdown>);
    const markdown = screen.getByTestId('markdown');
    expect(markdown.textContent).toBe('Text with **incomplete bold**');
  });

  it('should not parse incomplete markdown when disabled', () => {
    const content = 'Text with **incomplete bold';
    render(<Streamdown parseIncompleteMarkdown={false}>{content}</Streamdown>);
    const markdown = screen.getByTestId('markdown');
    expect(markdown.textContent).toBe('Text with **incomplete bold');
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
    expect(markdown?.getAttribute('class')).toBe('custom-class');
    expect(markdown?.getAttribute('data-custom')).toBe('value');
  });

  it('should use default allowed prefixes when not specified', () => {
    const { container } = render(
      <Streamdown>Content</Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.getAttribute('allowedImagePrefixes')).toBe('*');
    expect(markdown?.getAttribute('allowedLinkPrefixes')).toBe('*');
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
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.getAttribute('allowedImagePrefixes')).toBe('https://,http://');
    expect(markdown?.getAttribute('allowedLinkPrefixes')).toBe('https://,mailto:');
  });

  it('should pass defaultOrigin prop', () => {
    const { container } = render(
      <Streamdown defaultOrigin="https://example.com">
        Content
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.getAttribute('defaultOrigin')).toBe('https://example.com');
  });

  it('should merge custom components with defaults', () => {
    const customComponents = {
      h1: ({ children }: any) => <h1 className="custom-h1">{children}</h1>
    };
    
    const { container } = render(
      <Streamdown components={customComponents}>
        # Heading
      </Streamdown>
    );
    
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.getAttribute('components')).toBeTruthy();
  });

  it('should merge custom rehype plugins', () => {
    const customPlugin = () => {};
    
    const { container } = render(
      <Streamdown rehypePlugins={[customPlugin]}>
        Content
      </Streamdown>
    );
    
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should merge custom remark plugins', () => {
    const customPlugin = () => {};
    
    const { container } = render(
      <Streamdown remarkPlugins={[customPlugin]}>
        Content
      </Streamdown>
    );
    
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it('should memoize based on children prop', () => {
    const { rerender } = render(
      <Streamdown className="class1">Content</Streamdown>
    );
    
    // Same children, different prop - should not re-render (memoized)
    rerender(<Streamdown className="class2">Content</Streamdown>);
    
    // Different children - should re-render
    rerender(<Streamdown className="class2">Different Content</Streamdown>);
    
    const markdown = screen.getByTestId('markdown');
    expect(markdown.textContent).toBe('Different Content');
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
    expect(markdown?.textContent).toBe('123');
  });

  it('should handle complex markdown with incomplete tokens', () => {
    const content = `
# Heading
This is **bold** and *italic* text.
Here's an incomplete **bold
And an incomplete [link
`;
    
    render(<Streamdown>{content}</Streamdown>);
    const markdown = screen.getByTestId('markdown');
    expect(markdown.textContent).toContain('**bold**');
    expect(markdown.textContent).not.toContain('[link');
  });
});