import { useContext, useEffect, useRef, useState } from "react";
import { useDeferredRender } from "../../hooks/use-deferred-render";
import { StreamdownContext } from "../../index";
import { useMermaidPlugin } from "../plugin-context";
import type { MermaidConfig } from "../plugin-types";
import { useCn } from "../prefix-context";
import { PanZoom } from "./pan-zoom";
import { getMermaidSvgSize, normalizeMermaidInlineSvg } from "./utils";

interface MermaidProps {
  chart: string;
  className?: string;
  config?: MermaidConfig;
  fullscreen?: boolean;
  showControls?: boolean;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

interface RenderRequest {
  chart: string;
  config?: MermaidConfig;
}

type RenderOutcome =
  | { ok: true; svg: string; size: { height: number; width: number } | null }
  | { ok: false; error: string };

const renderChart = async (
  plugin: NonNullable<ReturnType<typeof useMermaidPlugin>>,
  { chart, config }: RenderRequest,
  fullscreen: boolean
): Promise<RenderOutcome> => {
  try {
    // Get mermaid instance from plugin
    const mermaid = plugin.getMermaid(config);

    // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
    const chartHash = chart.split("").reduce((acc, char) => {
      // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const { svg } = await mermaid.render(uniqueId, chart);
    const size = getMermaidSvgSize(svg);
    return {
      ok: true,
      svg: fullscreen ? svg : normalizeMermaidInlineSvg(svg),
      size,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to render Mermaid chart",
    };
  }
};

export const Mermaid = ({
  chart,
  className,
  config,
  fullscreen = false,
  showControls = true,
}: MermaidProps) => {
  const cn = useCn();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgSize, setSvgSize] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const [lastValidSvg, setLastValidSvg] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const { mermaid: mermaidContext } = useContext(StreamdownContext);
  const mermaidPlugin = useMermaidPlugin();
  const ErrorComponent = mermaidContext?.errorComponent;

  // Use deferred render hook for optimal performance
  const { shouldRender, containerRef } = useDeferredRender({
    immediate: fullscreen,
  });

  // Mermaid runs renders one after another. While a chart streams, every
  // token used to queue another full parse and layout of the growing chart,
  // so the finished diagram appeared long after the stream ended. Only one
  // render runs at a time here; when it settles, the latest chart is rendered
  // if it changed meanwhile, and the ones in between are skipped.
  const latestRequestRef = useRef<RenderRequest | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: "Required for Mermaid"
  useEffect(() => {
    // Only render when shouldRender is true
    if (!shouldRender) {
      return;
    }

    // If no mermaid plugin, show error
    if (!mermaidPlugin) {
      setError(
        "Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering."
      );
      return;
    }

    latestRequestRef.current = { chart, config };
    if (inFlightRef.current) {
      // The running loop picks up the latest request when it settles
      return;
    }

    const commit = (request: RenderRequest, rendered: RenderOutcome) => {
      if (rendered.ok) {
        // Update both current and last valid SVG
        setSvgContent(rendered.svg);
        setSvgSize(rendered.size);
        setLastValidSvg(rendered.svg);
      } else if (request === latestRequestRef.current) {
        // Keep the last valid SVG; the error only shows when there is
        // nothing to display, and only for the latest chart
        setError(rendered.error);
      }
    };

    const renderLatest = async () => {
      inFlightRef.current = true;
      setError(null);
      setIsLoading(true);
      try {
        let request = latestRequestRef.current;
        while (request) {
          const startedAt = performance.now();
          const rendered = await renderChart(
            mermaidPlugin,
            request,
            fullscreen
          );
          if (!mountedRef.current) {
            return;
          }
          commit(request, rendered);
          // Mermaid lays out on the main thread. After a layout, yield for as
          // long as it took so streamed updates keep flowing at their own
          // pace and only the latest chart is rendered next. A failed parse
          // did no layout, so there is nothing to yield for.
          if (rendered.ok) {
            await sleep(performance.now() - startedAt);
          }
          if (!mountedRef.current || request === latestRequestRef.current) {
            return;
          }
          request = latestRequestRef.current;
        }
      } finally {
        inFlightRef.current = false;
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    renderLatest();
  }, [chart, config, retryCount, shouldRender, mermaidPlugin]);

  // Show placeholder when not scheduled to render
  if (!(shouldRender || svgContent || lastValidSvg)) {
    return (
      <div className={cn("my-4 min-h-[200px]", className)} ref={containerRef} />
    );
  }

  if (isLoading && !svgContent && !lastValidSvg) {
    return (
      <div
        className={cn("my-4 flex justify-center p-4", className)}
        ref={containerRef}
      >
        <div
          className={cn("flex items-center space-x-2 text-muted-foreground")}
        >
          <div
            className={cn(
              "h-4 w-4 animate-spin rounded-full border-current border-b-2"
            )}
          />
          <span className={cn("text-sm")}>Loading diagram...</span>
        </div>
      </div>
    );
  }

  // Only show error if we have no valid SVG to display
  if (error && !svgContent && !lastValidSvg) {
    const retry = () => setRetryCount((count) => count + 1);

    // Use custom error component if provided
    if (ErrorComponent) {
      return (
        <div ref={containerRef}>
          <ErrorComponent chart={chart} error={error} retry={retry} />
        </div>
      );
    }

    // Default error display
    return (
      <div
        className={cn("rounded-md bg-red-50 p-4", className)}
        ref={containerRef}
      >
        <p className={cn("font-mono text-red-700 text-sm")}>
          Mermaid Error: {error}
        </p>
        <details className={cn("mt-2")}>
          <summary className={cn("cursor-pointer text-red-600 text-xs")}>
            Show Code
          </summary>
          <pre
            className={cn(
              "mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs"
            )}
          >
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
      className={cn(
        fullscreen ? "size-full" : "max-h-[min(70vh,40rem)] w-full",
        className
      )}
      data-streamdown="mermaid"
      ref={containerRef}
    >
      <PanZoom
        className={cn(
          fullscreen
            ? "size-full overflow-hidden"
            : "max-h-[min(70vh,40rem)] overflow-hidden",
          className
        )}
        contentSize={svgSize}
        fitKey={chart}
        fullscreen={fullscreen}
        isAutoFit={true}
        maxZoom={3}
        minZoom={0.1}
        showControls={showControls}
        zoomStep={0.1}
      >
        <div
          aria-label="Mermaid chart"
          className={cn(
            "flex justify-center",
            fullscreen ? "size-full items-center" : null
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for Mermaid"
          dangerouslySetInnerHTML={{ __html: displaySvg }}
          role="img"
        />
      </PanZoom>
    </div>
  );
};
