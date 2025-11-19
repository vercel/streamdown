import { DownloadIcon, Maximize2Icon, XIcon } from "lucide-react";
import type { MermaidConfig } from "mermaid";
import type { ComponentProps } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownRuntimeContext } from "../index";
import { cn, save } from "./utils";

// Track the number of active fullscreen modals to manage body scroll lock correctly
let activeFullscreenCount = 0;

const lockBodyScroll = () => {
  activeFullscreenCount += 1;
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

const initializeMermaid = async (customConfig?: MermaidConfig) => {
  const defaultConfig: MermaidConfig = {
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
    fontFamily: "monospace",
    suppressErrorRendering: true,
  } as MermaidConfig;

  const config = { ...defaultConfig, ...customConfig };

  const mermaidModule = await import("mermaid");
  const mermaid = mermaidModule.default;

  // Always reinitialize with the current config to support different configs per component
  mermaid.initialize(config);

  return mermaid;
};

type MermaidFullscreenButtonProps = ComponentProps<"button"> & {
  chart: string;
  config?: MermaidConfig;
  onFullscreen?: () => void;
  onExit?: () => void;
};

export const MermaidFullscreenButton = ({
  chart,
  config,
  onFullscreen,
  onExit,
  className,
  ...props
}: MermaidFullscreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAnimating } = useContext(StreamdownRuntimeContext);

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
        disabled={isAnimating}
        onClick={handleToggle}
        title="View fullscreen"
        type="button"
        {...props}
      >
        <Maximize2Icon size={14} />
      </button>

      {isFullscreen && (
        // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay, not a button"
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleToggle();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <button
            className="absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            onClick={handleToggle}
            title="Exit fullscreen"
            type="button"
          >
            <XIcon size={20} />
          </button>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
          <div
            className="flex h-full w-full items-center justify-center p-12"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="max-h-full max-w-full">
              <Mermaid
                chart={chart}
                className="[&>div]:my-0 [&_svg]:h-auto [&_svg]:min-h-[60vh] [&_svg]:w-auto [&_svg]:min-w-[60vw]"
                config={config}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function svgToPngBlob(
  svgString: string,
  options?: { scale?: number }
): Promise<Blob> {
  const scale = options?.scale ?? 5;

  return new Promise((resolve, reject) => {
    const encoded =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)));

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.width * scale;
      const h = img.height * scale;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to create 2D canvas context for PNG export"));
        return;
      }

      // Do NOT draw a background → transparency preserved
      // ctx.clearRect(0, 0, w, h);

      ctx.drawImage(img, 0, 0, w, h);

      // Export PNG (lossless, keeps transparency)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create PNG blob"));
          return;
        }
        resolve(blob);
      }, "image/png");
    };

    img.onerror = () => reject(new Error("Failed to load SVG image"));
    img.src = encoded;
  });
}

type MermaidDownloadDropdownProps = {
  chart: string;
  children?: React.ReactNode;
  className?: string;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
  config?: MermaidConfig;
};
export const MermaidDownloadDropdown = ({
  chart,
  children,
  className,
  onDownload,
  config,
  onError,
}: MermaidDownloadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAnimating } = useContext(StreamdownRuntimeContext);
  const downloadMermaid = async (format: "mmd" | "png" | "svg") => {
    try {
      if (format === "mmd") {
        // Download as Mermaid source code
        const filename = "diagram.mmd";
        const mimeType = "text/plain";
        save(filename, chart, mimeType);
        setIsOpen(false);
        onDownload?.(format);
        return;
      }

      const mermaid = await initializeMermaid(config);

      // Use a stable ID based on chart content hash and timestamp to ensure uniqueness
      const chartHash = chart.split("").reduce((acc, char) => {
        // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);
      const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const { svg } = await mermaid.render(uniqueId, chart);
      // For SVG and PNG, we need to extract the rendered SVG

      if (!svg) {
        onError?.(
          new Error("SVG not found. Please wait for the diagram to render.")
        );
        return;
      }

      if (format === "svg") {
        const filename = "diagram.svg";
        const mimeType = "image/svg+xml";
        save(filename, svg, mimeType);
        setIsOpen(false);
        onDownload?.(format);
        return;
      }

      if (format === "png") {
        const blob = await svgToPngBlob(svg);
        save("diagram.png", blob, "image/png");
        onDownload?.(format);
        setIsOpen(false);
        return;
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={() => setIsOpen(!isOpen)}
        title="Download diagram"
        type="button"
      >
        {children ?? <DownloadIcon size={14} />}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadMermaid("svg")}
            type="button"
          >
            SVG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadMermaid("png")}
            type="button"
          >
            PNG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadMermaid("mmd")}
            type="button"
          >
            MMD
          </button>
        </div>
      )}
    </div>
  );
};

type MermaidProps = {
  chart: string;
  className?: string;
  config?: MermaidConfig;
};

export const Mermaid = ({ chart, className, config }: MermaidProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>("");
  const [lastValidSvg, setLastValidSvg] = useState<string>("");

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
