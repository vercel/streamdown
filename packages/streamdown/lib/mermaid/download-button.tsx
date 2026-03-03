import type { MermaidConfig } from "mermaid";
import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import { useMermaidPlugin } from "../plugin-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { save } from "../utils";
import { svgToPngBlob } from "./utils";

interface MermaidDownloadDropdownProps {
  chart: string;
  children?: React.ReactNode;
  className?: string;
  config?: MermaidConfig;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = ({
  chart,
  children,
  className,
  onDownload,
  config,
  onError,
}: MermaidDownloadDropdownProps) => {
  const cn = useCn();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAnimating } = useContext(StreamdownContext);
  const icons = useIcons();
  const mermaidPlugin = useMermaidPlugin();
  const t = useTranslations();

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

      if (!mermaidPlugin) {
        onError?.(new Error("Mermaid plugin not available"));
        return;
      }

      const mermaid = mermaidPlugin.getMermaid(config);

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
    <div className={cn("relative")} ref={dropdownRef}>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={() => setIsOpen(!isOpen)}
        title={t.downloadDiagram}
        type="button"
      >
        {children ?? <icons.DownloadIcon size={14} />}
      </button>
      {isOpen ? (
        <div
          className={cn(
            "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
          )}
        >
          <button
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            )}
            onClick={() => downloadMermaid("svg")}
            title={t.downloadDiagramAsSvg}
            type="button"
          >
            {t.mermaidFormatSvg}
          </button>
          <button
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            )}
            onClick={() => downloadMermaid("png")}
            title={t.downloadDiagramAsPng}
            type="button"
          >
            {t.mermaidFormatPng}
          </button>
          <button
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            )}
            onClick={() => downloadMermaid("mmd")}
            title={t.downloadDiagramAsMmd}
            type="button"
          >
            {t.mermaidFormatMmd}
          </button>
        </div>
      ) : null}
    </div>
  );
};
