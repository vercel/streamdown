import type { MermaidConfig } from "mermaid";
import { type ComponentProps, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import { useTranslations } from "../translations-context";
import { Mermaid } from ".";

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
  const { Maximize2Icon, XIcon } = useIcons();
  const cn = useCn();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAnimating, controls: controlsConfig } =
    useContext(StreamdownContext);
  const t = useTranslations();
  const showPanZoomControls = (() => {
    if (typeof controlsConfig === "boolean") {
      return controlsConfig;
    }
    const mermaidCtl = controlsConfig.mermaid;
    if (mermaidCtl === false) {
      return false;
    }
    if (mermaidCtl === true || mermaidCtl === undefined) {
      return true;
    }
    return mermaidCtl.panZoom !== false;
  })();

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
        title={t.viewFullscreen}
        type="button"
        {...props}
        aria-label={t.viewFullscreen}
      >
        <Maximize2Icon size={14} aria-hidden="true"/>
      </button>

      {isFullscreen
        ? createPortal(
            // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay, not a button"
            <div
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
              )}
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
                className={cn(
                  "absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                )}
                onClick={handleToggle}
                title={t.exitFullscreen}
                type="button"
                aria-label={t.exitFullscreen}
              >
                <XIcon size={20} aria-hidden="true" />
              </button>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
              <div
                className={cn("flex size-full items-center justify-center p-4")}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <Mermaid
                  chart={chart}
                  className={cn("size-full [&_svg]:h-auto [&_svg]:w-auto")}
                  config={config}
                  fullscreen={true}
                  showControls={showPanZoomControls}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};
