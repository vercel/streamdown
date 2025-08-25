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
  const [lastValidSvg, setLastValidSvg] = useState<string>('');

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Initialize mermaid only once globally
        const mermaid = await initializeMermaid();

        // Use a stable ID based on chart content hash to prevent re-renders
        const chartHash = chart.split('').reduce((acc, char) => {
          return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        }, 0);
        const uniqueId = `mermaid-${Math.abs(chartHash)}`;
        
        const { svg } = await mermaid.render(uniqueId, chart);

        // Update both current and last valid SVG
        setSvgContent(svg);
        setLastValidSvg(svg);
      } catch (err) {
        // Silently fail and keep the last valid SVG
        // Don't update svgContent here - just keep what we have
        
        // Only set error if we don't have any valid SVG
        if (!lastValidSvg && !svgContent) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Failed to render Mermaid chart';
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  // Show loading only on initial load when we have no content
  if (isLoading && !svgContent && !lastValidSvg) {
    return (
      <div className={cn('my-4 flex justify-center p-4', className)}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
          <span className="text-sm">Loading diagram...</span>
        </div>
      </div>
    );
  }

  // Only show error if we have no valid SVG to display
  if (error && !svgContent && !lastValidSvg) {
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

  // Always render the SVG if we have content (either current or last valid)
  const displaySvg = svgContent || lastValidSvg;

  return (
    <div
      aria-label="Mermaid chart"
      className={cn('my-4 flex justify-center', className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for Mermaid"
      dangerouslySetInnerHTML={{ __html: displaySvg }}
      role="img"
    />
  );
};
