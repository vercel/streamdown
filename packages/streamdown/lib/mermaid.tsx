import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { cn } from './utils';

interface MermaidProps {
  chart: string;
  className?: string;
}

export const Mermaid = ({ chart, className }: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderChart = async () => {
      try {
        setError(null);
        
        // Initialize and configure mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          fontFamily: 'monospace',
        });

        // Render the chart
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, chart);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render Mermaid chart');
        console.error('Mermaid render error:', err);
      }
    };

    renderChart();
  }, [chart]);

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
      ref={containerRef} 
      className={cn('flex justify-center my-4', className)}
      role="img"
      aria-label="Mermaid chart"
    />
  );
};
