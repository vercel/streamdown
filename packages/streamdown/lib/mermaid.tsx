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

interface MermaidProps {
  chart: string;
  className?: string;
}

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
        const errorMessage = err instanceof Error ? err.message : 'Failed to render Mermaid chart';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  if (isLoading) {
    return (
      <div className={cn('flex justify-center my-4 p-4', className)}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="text-sm">Loading diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 border border-red-200 bg-red-50 rounded-lg', className)}>
        <p className="text-red-700 text-sm font-mono">Mermaid Error: {error}</p>
        <details className="mt-2">
          <summary className="text-red-600 text-xs cursor-pointer">Show Code</summary>
          <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div 
      className={cn('flex justify-center my-4', className)}
      role="img"
      aria-label="Mermaid chart"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
