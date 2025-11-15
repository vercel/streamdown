import { Maximize2Icon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useContext, useEffect, useState } from "react";
import {
  MermaidLoaderContext,
  StreamdownRuntimeContext,
} from "../index";
import { cn } from "./utils";
import type { MermaidConfig, MermaidLoader } from "./mermaid-types";

// Track the number of active fullscreen modals to manage body scroll lock correctly
let activeFullscreenCount = 0;

const lockBodyScroll = () => {
  activeFullscreenCount++;
  if (activeFullscreenCount === 1) {
    document.body.style.overflow = "hidden";
  }
};

const unlockBodyScroll = () => {
  activeFullscreenCount = Math.max(0, activeFullscreenCount - 1);
  if (activeFullscreenCount === 0) {
    document.body.style.overflow = "";
  }
};

const initializeMermaid = async (
  loader: MermaidLoader | undefined,
  customConfig?: MermaidConfig
) => {
  const defaultConfig: MermaidConfig = {
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
    fontFamily: "monospace",
    suppressErrorRendering: true,
  } as MermaidConfig;

  const config = { ...defaultConfig, ...customConfig };

  if (!loader) {
    throw new Error(
      "Mermaid rendering is disabled because no loader was provided."
    );
  }

  const mermaid = await loader();

  // Always reinitialize with the current config to support different configs per component
  mermaid.initialize(config);

  return mermaid;
};

type MermaidFullscreenButtonProps = ComponentProps<"button"> & {
  chart: string;
  config?: MermaidConfig;
  onFullscreen?: () => void;
  onExit?: () => void;
  loader?: MermaidLoader;
};

export const MermaidFullscreenButton = ({
  chart,
  config,
  onFullscreen,
  onExit,
  className,
  loader,
  ...props
}: MermaidFullscreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAnimating } = useContext(StreamdownRuntimeContext);
  const contextLoader = useContext(MermaidLoaderContext);
  const mermaidLoader = loader ?? contextLoader;

  const handleToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Manage scroll lock and keyboard events
  useEffect(() => {
    if (isFullscreen) {
      lockBodyScroll();

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        unlockBodyScroll();
      };
    }
  }, [isFullscreen]);

  // Handle callbacks separately to avoid scroll lock flickering
  useEffect(() => {
    if (isFullscreen) {
      onFullscreen?.();
    } else if (onExit) {
      onExit();
    }
  }, [isFullscreen, onFullscreen, onExit]);

  return (
    <>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating || !mermaidLoader}
        onClick={handleToggle}
        title="View fullscreen"
        type="button"
        {...props}
      >
        <Maximize2Icon size={14} />
      </button>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={handleToggle}
        >
          <button
            className="absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            onClick={handleToggle}
            title="Exit fullscreen"
            type="button"
          >
            <XIcon size={20} />
          </button>
          <div
            className="flex h-full w-full items-center justify-center p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-full max-w-full">
              <Mermaid
                chart={chart}
                className="[&>div]:my-0 [&_svg]:h-auto [&_svg]:w-auto [&_svg]:min-h-[60vh] [&_svg]:min-w-[60vw]"
                config={config}
                loader={mermaidLoader}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

type MermaidProps = {
  chart: string;
  className?: string;
  config?: MermaidConfig;
  loader?: MermaidLoader;
};

export const Mermaid = ({
  chart,
  className,
  config,
  loader,
}: MermaidProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>("");
  const [lastValidSvg, setLastValidSvg] = useState<string>("");
  const contextLoader = useContext(MermaidLoaderContext);
  const mermaidLoader = loader ?? contextLoader;

  // biome-ignore lint/correctness/useExhaustiveDependencies: "Required for Mermaid"
  useEffect(() => {
    if (!mermaidLoader) {
      setError(
        "Mermaid loader missing. Pass a mermaidLoader prop to Streamdown to enable diagrams."
      );
      setIsLoading(false);
      return;
    }

    const renderChart = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Initialize mermaid with optional custom config
        const mermaid = await initializeMermaid(mermaidLoader, config);

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
  }, [chart, config]);

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
    <div
      aria-label="Mermaid chart"
      className={cn("my-4 flex justify-center", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for Mermaid"
      dangerouslySetInnerHTML={{ __html: displaySvg }}
      role="img"
    />
  );
};
