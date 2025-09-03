import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CodeBlock, CodeBlockCopyButton } from '../lib/code-block';
import { ShikiThemeContext } from '../index';

describe('CodeBlockCopyButton', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('should copy code to clipboard on click', async () => {
    const onCopy = vi.fn();
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton onCopy={onCopy} />
      </CodeBlock>
    );

    const button = container.querySelector('button');
    expect(button).toBeTruthy();

    fireEvent.click(button!);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
      expect(onCopy).toHaveBeenCalled();
    });
  });

  it('should show check icon after copying', async () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton />
      </CodeBlock>
    );

    const button = container.querySelector('button');
    fireEvent.click(button!);

    await waitFor(() => {
      // Check icon should be visible after copying
      const svg = button?.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  it('should handle clipboard API not available', async () => {
    const onError = vi.fn();
    
    // Mock clipboard API not available
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: undefined,
      },
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton onError={onError} />
      </CodeBlock>
    );

    const button = container.querySelector('button');
    
    await act(async () => {
      fireEvent.click(button!);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle clipboard write failure', async () => {
    const onError = vi.fn();
    const error = new Error('Clipboard write failed');
    
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(error),
      },
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton onError={onError} />
      </CodeBlock>
    );

    const button = container.querySelector('button');
    fireEvent.click(button!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('should reset icon after timeout', async () => {
    vi.useFakeTimers();
    
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript">
        <CodeBlockCopyButton timeout={1000} />
      </CodeBlock>
    );

    const button = container.querySelector('button');

    await act(async () => {
      fireEvent.click(button!);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Icon should be reset after timeout
    const svg = button?.querySelector('svg');
    expect(svg).toBeTruthy();
  });

});

describe('CodeBlock with multiple languages', () => {
  it('should render multiple code blocks with different languages simultaneously', async () => {
    const pythonCode = "print('hello world!')";
    const jsCode = "console.log('hello world!');";
    
    const { container } = render(
      <ShikiThemeContext.Provider value={['github-light', 'github-dark']}>
        <div>
          <CodeBlock code={pythonCode} language="python" />
          <CodeBlock code={jsCode} language="javascript" />
        </div>
      </ShikiThemeContext.Provider>
    );

    // Wait for both code blocks to render
    await waitFor(() => {
      const codeBlocks = container.querySelectorAll('.my-4');
      expect(codeBlocks.length).toBe(2);
      
      // Check that both language labels are present
      const languageLabels = container.querySelectorAll('.font-mono.lowercase');
      expect(languageLabels.length).toBe(2);
      expect(languageLabels[0].textContent).toBe('python');
      expect(languageLabels[1].textContent).toBe('javascript');
      
      // Check that both code blocks have rendered content
      const preElements = container.querySelectorAll('pre');
      expect(preElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('should handle multiple instances of the same language', async () => {
    const code1 = "const x = 1;";
    const code2 = "const y = 2;";
    
    const { container } = render(
      <ShikiThemeContext.Provider value={['github-light', 'github-dark']}>
        <div>
          <CodeBlock code={code1} language="javascript" />
          <CodeBlock code={code2} language="javascript" />
        </div>
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      const codeBlocks = container.querySelectorAll('.my-4');
      expect(codeBlocks.length).toBe(2);
      
      // Both should be JavaScript
      const languageLabels = container.querySelectorAll('.font-mono.lowercase');
      expect(languageLabels.length).toBe(2);
      expect(languageLabels[0].textContent).toBe('javascript');
      expect(languageLabels[1].textContent).toBe('javascript');
    }, { timeout: 5000 });
  });

  it('should handle rapid sequential rendering of different languages', async () => {
    const languages: Array<{ code: string; lang: 'python' | 'javascript' | 'typescript' }> = [
      { code: "print('Python')", lang: 'python' },
      { code: "console.log('JS')", lang: 'javascript' },
      { code: "const x: string = 'TS'", lang: 'typescript' },
    ];

    const { container } = render(
      <ShikiThemeContext.Provider value={['github-light', 'github-dark']}>
        <div>
          {languages.map((item, index) => (
            <CodeBlock key={index} code={item.code} language={item.lang} />
          ))}
        </div>
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      const codeBlocks = container.querySelectorAll('.my-4');
      expect(codeBlocks.length).toBe(3);
      
      const languageLabels = container.querySelectorAll('.font-mono.lowercase');
      expect(languageLabels.length).toBe(3);
      expect(languageLabels[0].textContent).toBe('python');
      expect(languageLabels[1].textContent).toBe('javascript');
      expect(languageLabels[2].textContent).toBe('typescript');
    }, { timeout: 5000 });
  });

  it('should have data attributes on container, header, and code block elements', async () => {
    const { container } = render(
      <ShikiThemeContext.Provider value={['github-light', 'github-dark']}>
        <CodeBlock code="const x = 1;" language="javascript" />
      </ShikiThemeContext.Provider>
    );

    await waitFor(() => {
      // Check container has data attributes
      const containerElement = container.querySelector('[data-code-block-container]');
      expect(containerElement).toBeTruthy();
      expect(containerElement?.getAttribute('data-language')).toBe('javascript');

      // Check header has data attributes
      const headerElement = container.querySelector('[data-code-block-header]');
      expect(headerElement).toBeTruthy();
      expect(headerElement?.getAttribute('data-language')).toBe('javascript');

      // Check code block has data attributes
      const codeBlockElements = container.querySelectorAll('[data-code-block]');
      expect(codeBlockElements.length).toBeGreaterThan(0);
      codeBlockElements.forEach(element => {
        expect(element.getAttribute('data-language')).toBe('javascript');
      });
    }, { timeout: 5000 });
  });
});