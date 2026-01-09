import type { MermaidConfig } from "mermaid";
import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownContext } from "../../index";
import { DownloadIcon } from "../icons";
import { cn, save } from "../utils";
import { initializeMermaid, svgToPngBlob } from "./utils";

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
  const { isAnimating } = useContext(StreamdownContext);
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
      const path = event.composedPath();
      if (dropdownRef.current && !path.includes(dropdownRef.current)) {
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
      {isOpen ? (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadMermaid("svg")}
            title="Download diagram as SVG"
            type="button"
          >
            SVG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadMermaid("png")}
            title="Download diagram as PNG"
            type="button"
          >
            PNG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadMermaid("mmd")}
            title="Download diagram as MMD"
            type="button"
          >
            MMD
          </button>
        </div>
      ) : null}
    </div>
  );
};
