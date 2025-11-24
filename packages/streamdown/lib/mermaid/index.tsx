import type { MermaidConfig } from "mermaid";
import { useContext, useEffect, useState } from "react";
import { StreamdownContext } from "../../index";
import { cn } from "../utils";
import { PanZoom } from "./pan-zoom";
import { initializeMermaid } from "./utils";

type MermaidProps = {
  chart: string;
  className?: string;
  config?: MermaidConfig;
  fullscreen?: boolean;
  showControls?: boolean;
};

export const Mermaid = ({
  chart,
  className,
  config,
  fullscreen = false,
  showControls = true,
}: MermaidProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>("");
  const [lastValidSvg, setLastValidSvg] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const { mermaid: mermaidContext } = useContext(StreamdownContext);
  const ErrorComponent = mermaidContext?.errorComponent;

  // biome-ignore lint/correctness/useExhaustiveDependencies: "Required for Mermaid"
  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Initialize mermaid with optional custom config
        const mermaid = await initializeMermaid(config);

        // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
        const chartHash = chart.split("").reduce((acc, char) => {
          // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
          return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        }, 0);
        const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const { svg } = await mermaid.render(uniqueId, chart);

        // Update both current and last valid SVG
        setSvgContent(svg);
        setLastValidSvg(svg);
      } catch (err) {
        // Silently fail and keep the last valid SVG
        // Don't update svgContent here - just keep what we have

        // Only set error if we don't have any valid SVG
        if (!(lastValidSvg || svgContent)) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to render Mermaid chart";
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart, config, retryCount]);

  // Show loading only on initial load when we have no content
  if (isLoading && !svgContent && !lastValidSvg) {
    return (
      <div className={cn("my-4 flex justify-center p-4", className)}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
          <span className="text-sm">Loading diagram...</span>
        </div>
      </div>
    );
  }

  // Only show error if we have no valid SVG to display
  if (error && !svgContent && !lastValidSvg) {
    const retry = () => setRetryCount((count) => count + 1);

    // Use custom error component if provided
    if (ErrorComponent) {
      return <ErrorComponent chart={chart} error={error} retry={retry} />;
    }

    // Default error display
    return (
      <div
        className={cn(
          "rounded-lg border border-red-200 bg-red-50 p-4",
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
    <PanZoom
      className={cn(
        fullscreen ? "h-full w-full overflow-hidden" : "my-4 overflow-hidden",
        className
      )}
      fullscreen={fullscreen}
      maxZoom={3}
      minZoom={0.5}
      showControls={showControls}
      zoomStep={0.1}
    >
      <div
        aria-label="Mermaid chart"
        className={cn(
          "flex justify-center",
          fullscreen && "h-full w-full items-center"
        )}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for Mermaid"
        dangerouslySetInnerHTML={{ __html: displaySvg }}
        role="img"
      />
    </PanZoom>
  );
};
