import { RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils";

type PanZoomProps = {
  children: ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  showControls?: boolean;
  initialZoom?: number;
  fullscreen?: boolean;
};

export const PanZoom = ({
  children,
  className,
  minZoom = 0.5,
  maxZoom = 3,
  zoomStep = 0.1,
  showControls = true,
  initialZoom = 1,
  fullscreen = false,
}: PanZoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });

  const handleZoom = useCallback(
    (delta: number) => {
      setZoom((prevZoom) => {
        const newZoom = Math.max(minZoom, Math.min(maxZoom, prevZoom + delta));
        return newZoom;
      });
    },
    [minZoom, maxZoom]
  );

  const handleZoomIn = useCallback(() => {
    handleZoom(zoomStep);
  }, [handleZoom, zoomStep]);

  const handleZoomOut = useCallback(() => {
    handleZoom(-zoomStep);
  }, [handleZoom, zoomStep]);

  const handleReset = useCallback(() => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [initialZoom]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      handleZoom(delta);
    },
    [handleZoom, zoomStep]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only handle primary pointer (left mouse button, first touch, etc.)
      if (e.button !== 0 || e.isPrimary === false) {
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanStartPosition(pan);
      // Capture the pointer to track it even outside the element
      const target = e.currentTarget;
      if (target instanceof HTMLElement) {
        target.setPointerCapture(e.pointerId);
      }
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPanning) {
        return;
      }
      e.preventDefault();
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPan({
        x: panStartPosition.x + deltaX,
        y: panStartPosition.y + deltaY,
      });
    },
    [isPanning, panStart, panStartPosition]
  );

  const handlePointerUp = useCallback((e: PointerEvent) => {
    setIsPanning(false);
    // Release pointer capture
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      target.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    if (isPanning) {
      // Prevent text selection while panning
      document.body.style.userSelect = "none";
      content.addEventListener("pointermove", handlePointerMove, {
        passive: false,
      });
      content.addEventListener("pointerup", handlePointerUp);
      content.addEventListener("pointercancel", handlePointerUp);

      return () => {
        document.body.style.userSelect = "";
        content.removeEventListener("pointermove", handlePointerMove);
        content.removeEventListener("pointerup", handlePointerUp);
        content.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [isPanning, handlePointerMove, handlePointerUp]);

  return (
    <div
      className={cn(
        "relative flex flex-col",
        fullscreen ? "h-full w-full" : "min-h-28 w-full",
        className
      )}
      ref={containerRef}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {showControls && (
        <div
          className={cn(
            "absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/90 p-1 shadow-sm backdrop-blur-sm",
            fullscreen ? "bottom-4 left-4" : "bottom-2 left-2"
          )}
        >
          <button
            className="flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={zoom >= maxZoom}
            onClick={handleZoomIn}
            title="Zoom in"
            type="button"
          >
            <ZoomInIcon size={16} />
          </button>
          <button
            className="flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={zoom <= minZoom}
            onClick={handleZoomOut}
            title="Zoom out"
            type="button"
          >
            <ZoomOutIcon size={16} />
          </button>
          <button
            className="flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={handleReset}
            title="Reset zoom and pan"
            type="button"
          >
            <RotateCcwIcon size={16} />
          </button>
        </div>
      )}
      <div
        className={cn(
          "flex-1 origin-center transition-transform duration-150 ease-out",
          fullscreen
            ? "flex h-full w-full items-center justify-center"
            : "flex w-full items-center justify-center"
        )}
        onPointerDown={handlePointerDown}
        ref={contentRef}
        role="application"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          touchAction: "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};
