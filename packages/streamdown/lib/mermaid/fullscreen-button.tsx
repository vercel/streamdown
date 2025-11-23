import Maximize2Icon from "lucide-react/dist/esm/icons/maximize-2";
import XIcon from "lucide-react/dist/esm/icons/x";
import type { MermaidConfig } from "mermaid";
import { type ComponentProps, useContext, useEffect, useState } from "react";
import { StreamdownContext } from "../../index";
import { cn } from "../utils";
import { Mermaid } from ".";

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
  const { isAnimating } = useContext(StreamdownContext);

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
            className="flex h-full w-full items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Mermaid
              chart={chart}
              className="h-full w-full [&>div]:h-full [&>div]:overflow-hidden [&_svg]:h-auto [&_svg]:w-auto"
              config={config}
              fullscreen={true}
            />
          </div>
        </div>
      )}
    </>
  );
};
