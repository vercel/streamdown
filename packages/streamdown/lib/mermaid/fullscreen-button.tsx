import { type ComponentProps, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StreamdownContext } from "../../index";
import { CodeBlockCopyButton } from "../code-block/copy-button";
import { useIcons } from "../icon-context";
import type { MermaidConfig } from "../plugin-types";
import { resolvePortalTarget } from "../portal";
import { useCn } from "../prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import { useTranslations } from "../translations-context";
import { Mermaid } from ".";
import { MermaidDownloadDropdown } from "./download-button";

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
  const {
    isAnimating,
    controls: controlsConfig,
    portal,
  } = useContext(StreamdownContext);
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
  const showDownload = (() => {
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
    return mermaidCtl.download !== false;
  })();
  const showCopy = (() => {
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
    return mermaidCtl.copy !== false;
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
        <Maximize2Icon aria-hidden="true" size={14} />
      </button>

      {isFullscreen
        ? createPortal(
            // biome-ignore lint/a11y/noNoninteractiveElementInteractions: "div is used as a backdrop overlay, not a button"
            <div
              aria-label={t.viewFullscreen}
              aria-modal="true"
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
              )}
              data-streamdown="mermaid-fullscreen"
              onClick={handleToggle}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleToggle();
                }
              }}
              role="dialog"
            >
              {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
              <div
                className={cn(
                  "absolute top-4 right-4 z-10 flex items-center gap-1"
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                {showDownload ? (
                  <MermaidDownloadDropdown chart={chart} config={config} />
                ) : null}
                {showCopy ? <CodeBlockCopyButton code={chart} /> : null}
                <button
                  aria-label={t.exitFullscreen}
                  className={cn(
                    "rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  )}
                  onClick={handleToggle}
                  title={t.exitFullscreen}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={20} />
                </button>
              </div>
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
            resolvePortalTarget(portal)
          )
        : null}
    </>
  );
};
