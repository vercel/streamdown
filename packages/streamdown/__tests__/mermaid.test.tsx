import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Mermaid } from '../lib/mermaid';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

describe('Mermaid', () => {
  it('renders without crashing', () => {
    const { container } = render(<Mermaid chart="graph TD; A-->B" />);
    expect(container.firstChild).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Mermaid chart="graph TD; A-->B" className="custom-class" />
    );

    const mermaidContainer = container.firstChild as HTMLElement;
    expect(mermaidContainer.className).toContain('custom-class');
  });
});
