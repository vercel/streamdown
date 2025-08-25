import { useEffect, useState } from 'react';
import { cn } from './utils';

// Global mermaid initialization
let mermaidInitialized = false;

const initializeMermaid = async () => {
  if (!mermaidInitialized) {
    const mermaidModule = await import('mermaid');
    const mermaid = mermaidModule.default;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'monospace',
    });

    mermaidInitialized = true;
    return mermaid;
  }

  const mermaidModule = await import('mermaid');
  return mermaidModule.default;
};

type MermaidProps = {
  chart: string;
  className?: string;
};

export const Mermaid = ({ chart, className }: MermaidProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(null);
        setIsLoading(true);
        setSvgContent('');

        // Initialize mermaid only once globally
        const mermaid = await initializeMermaid();

        // Render the chart with unique ID to prevent conflicts
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        setSvgContent(svg);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to render Mermaid chart';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  if (isLoading) {
    return (
      <div className={cn('my-4 flex justify-center p-4', className)}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
          <span className="text-sm">Loading diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 p-4',
          className
        )}
      >
        <p className="font-mono text-red-700 text-sm">Mermaid Error: {error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-red-600 text-xs">
            Show Code
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      aria-label="Mermaid chart"
      className={cn('my-4 flex justify-center', className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      role="img"
    />
  );
};
