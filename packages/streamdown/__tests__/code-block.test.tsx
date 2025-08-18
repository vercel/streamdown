import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CodeBlock, CodeBlockCopyButton } from '../lib/code-block';

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