import type { CSSProperties, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";

interface PanZoomProps {
  children: ReactNode;
  className?: string;
  contentSize?: { height: number; width: number } | null;
  fitKey?: string;
  fullscreen?: boolean;
  initialZoom?: number;
  isAutoFit?: boolean;
  maxZoom?: number;
  minZoom?: number;
  showControls?: boolean;
  zoomStep?: number;
}

/**
 * Resolve CSS max-height to pixels when possible.
 * Returns null when max-height does not constrain the element.
 */
const resolveMaxHeightPx = (
  element: HTMLElement,
  maxHeight: string
): number | null => {
  const value = maxHeight.trim().toLowerCase();
  if (!value || value === "none" || value === "auto") {
    return null;
  }

  if (value.endsWith("px")) {
    const px = Number.parseFloat(value);
    return px > 0 ? px : null;
  }

  if (value.endsWith("rem")) {
    const rem = Number.parseFloat(value);
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize || "16"
    );
    const px = rem * rootFontSize;
    return px > 0 ? px : null;
  }

  if (value.endsWith("em")) {
    const em = Number.parseFloat(value);
    const fontSize = Number.parseFloat(
      getComputedStyle(element).fontSize || "16"
    );
    const px = em * fontSize;
    return px > 0 ? px : null;
  }

  if (value.endsWith("vh")) {
    const vh = Number.parseFloat(value);
    const px = (vh / 100) * window.innerHeight;
    return px > 0 ? px : null;
  }

  if (value.endsWith("%")) {
    const percent = Number.parseFloat(value);
    const parent = element.parentElement;
    if (!parent) {
      return null;
    }
    const parentHeight = parent.clientHeight;
    if (!(parentHeight > 0)) {
      return null;
    }
    const px = (percent / 100) * parentHeight;
    return px > 0 ? px : null;
  }

  // min() / max() / calc() — fall back to the laid-out clientHeight when the
  // element already has a constrained box; otherwise leave unconstrained.
  if (element.clientHeight > 0 && element.style.height === "") {
    // Only trust clientHeight if it looks capped (strictly less than content
    // would demand). Caller still passes content-based candidate separately.
    return null;
  }

  return null;
};

/**
 * Evaluate simple `min(a, b)` max-height expressions used in Tailwind utilities
 * like `max-h-[min(70vh,40rem)]`.
 */
const resolveComplexMaxHeightPx = (
  element: HTMLElement,
  maxHeight: string
): number | null => {
  const direct = resolveMaxHeightPx(element, maxHeight);
  if (direct != null) {
    return direct;
  }

  const minMatch = maxHeight
    .trim()
    .match(/^min\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/i);
  if (!minMatch) {
    return null;
  }

  const left = resolveMaxHeightPx(element, minMatch[1].trim());
  const right = resolveMaxHeightPx(element, minMatch[2].trim());
  if (left == null || right == null) {
    return null;
  }
  return Math.min(left, right);
};

const computeFit = (
  contentSize: { height: number; width: number },
  container: HTMLElement,
  fullscreen: boolean
): { fitZoom: number; viewportHeight: number | null } | null => {
  const containerWidth = container.clientWidth;
  if (!(containerWidth > 0)) {
    return null;
  }

  if (fullscreen) {
    const containerHeight = container.clientHeight;
    if (!(containerHeight > 0)) {
      return null;
    }

    const fitZoom = Math.min(
      containerWidth / contentSize.width,
      containerHeight / contentSize.height,
      1
    );

    if (!(fitZoom > 0) || Number.isNaN(fitZoom)) {
      return null;
    }

    return { fitZoom, viewportHeight: null };
  }

  // Fit to container width first so the card never expands past the text column.
  const widthFit = Math.min(containerWidth / contentSize.width, 1);
  if (!(widthFit > 0) || Number.isNaN(widthFit)) {
    return null;
  }

  const heightAtWidthFit = contentSize.height * widthFit;

  // Cap tall diagrams using CSS max-height on this viewport or its parents.
  let maxHeightPx: number | null = null;
  let node: HTMLElement | null = container;
  while (node && maxHeightPx == null) {
    const styles = getComputedStyle(node);
    maxHeightPx = resolveComplexMaxHeightPx(node, styles.maxHeight);
    node = node.parentElement;
  }

  const viewportHeight =
    maxHeightPx != null
      ? Math.min(heightAtWidthFit, maxHeightPx)
      : heightAtWidthFit;

  const fitZoom = Math.min(
    widthFit,
    viewportHeight / contentSize.height,
    1
  );

  if (!(fitZoom > 0) || Number.isNaN(fitZoom)) {
    return null;
  }

  return { fitZoom, viewportHeight };
};

export const PanZoom = ({
  children,
  className,
  contentSize,
  fitKey,
  minZoom = 0.5,
  maxZoom = 3,
  zoomStep = 0.1,
  showControls = true,
  initialZoom = 1,
  isAutoFit = false,
  fullscreen = false,
}: PanZoomProps) => {
  const { RotateCcwIcon, ZoomInIcon, ZoomOutIcon } = useIcons();
  const cn = useCn();
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasUserInteractedRef = useRef(false);
  const [baseZoom, setBaseZoom] = useState(initialZoom);
  const [effectiveMinZoom, setEffectiveMinZoom] = useState(minZoom);
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });
  // Intrinsic height of the viewport once the diagram is scaled to container width.
  // Height is independent of the fitted scale transform so the card doesn't balloon
  // with the SVG's native size. Capped by max-height CSS when tall.
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const applyFit = useCallback(
    (nextContentSize: { height: number; width: number }) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const result = computeFit(nextContentSize, container, fullscreen);
      if (!result) {
        return;
      }

      const { fitZoom, viewportHeight: nextViewportHeight } = result;

      setViewportHeight(nextViewportHeight);
      setBaseZoom(fitZoom);
      setEffectiveMinZoom(Math.min(minZoom, fitZoom));

      if (!hasUserInteractedRef.current) {
        setZoom(fitZoom);
        setPan({ x: 0, y: 0 });
      }
    },
    [fullscreen, minZoom]
  );

  const handleZoom = useCallback(
    (delta: number) => {
      setZoom((prevZoom) => {
        const newZoom = Math.max(
          effectiveMinZoom,
          Math.min(maxZoom, prevZoom + delta)
        );
        return newZoom;
      });
      hasUserInteractedRef.current = true;
    },
    [effectiveMinZoom, maxZoom]
  );

  const handleZoomIn = useCallback(() => {
    handleZoom(zoomStep);
  }, [handleZoom, zoomStep]);

  const handleZoomOut = useCallback(() => {
    handleZoom(-zoomStep);
  }, [handleZoom, zoomStep]);

  const handleReset = useCallback(() => {
    setZoom(baseZoom);
    setPan({ x: 0, y: 0 });
    hasUserInteractedRef.current = false;
  }, [baseZoom]);

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
      hasUserInteractedRef.current = true;
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
      /* v8 ignore next */
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
    setEffectiveMinZoom(minZoom);
    if (!isAutoFit) {
      setBaseZoom(initialZoom);
      setZoom(initialZoom);
      setViewportHeight(null);
    }
  }, [initialZoom, isAutoFit, minZoom]);

  useLayoutEffect(() => {
    if (!isAutoFit || !contentSize) {
      return;
    }

    applyFit(contentSize);

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      applyFit(contentSize);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [applyFit, contentSize, isAutoFit]);

  useEffect(() => {
    if (!isAutoFit) {
      return;
    }

    hasUserInteractedRef.current = false;
  }, [fitKey, isAutoFit]);

  useEffect(() => {
    const container = containerRef.current;
    /* v8 ignore next */
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
    /* v8 ignore next */
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

  const viewportStyle: CSSProperties | undefined =
    !fullscreen && isAutoFit && viewportHeight != null
      ? { height: viewportHeight }
      : undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col",
        fullscreen ? "h-full w-full" : "min-h-28 w-full",
        className
      )}
      ref={containerRef}
      style={{
        cursor: isPanning ? "grabbing" : "grab",
        ...viewportStyle,
      }}
    >
      {showControls ? (
        <div
          className={cn(
            "absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/80 p-1 supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur-sm",
            fullscreen ? "bottom-4 left-4" : "bottom-2 left-2"
          )}
        >
          <button
            aria-label={t.zoomIn}
            className={cn(
              "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            )}
            disabled={zoom >= maxZoom}
            onClick={handleZoomIn}
            title={t.zoomIn}
            type="button"
          >
            <ZoomInIcon aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={t.zoomOut}
            className={cn(
              "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            )}
            disabled={zoom <= effectiveMinZoom}
            onClick={handleZoomOut}
            title={t.zoomOut}
            type="button"
          >
            <ZoomOutIcon aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={t.resetView}
            className={cn(
              "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            )}
            onClick={handleReset}
            title={t.resetView}
            type="button"
          >
            <RotateCcwIcon aria-hidden="true" size={16} />
          </button>
        </div>
      ) : null}
      <div
        className={cn(
          "flex h-full w-full flex-1 origin-center items-center justify-center transition-transform duration-150 ease-out"
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
