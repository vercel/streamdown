import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIcons } from "./icon-context";
import type { ExtraProps } from "./markdown";
import { useCn } from "./prefix-context";
import { useTranslations } from "./translations-context";
import { save } from "./utils";

const fileExtensionPattern = /\.[^/.]+$/;

type ImageComponentProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> &
  ExtraProps & {
    showControls?: boolean;
    showDownloadControl?: boolean;
  };

export const ImageComponent = ({
  node,
  className,
  src,
  alt,
  onLoad: onLoadProp,
  onError: onErrorProp,
  showControls = true,
  showDownloadControl = true,
  ...props
}: ImageComponentProps) => {
  const { DownloadIcon } = useIcons();
  const cn = useCn();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const t = useTranslations();

  const hasExplicitDimensions = props.width != null || props.height != null;
  const canDownload = (imageLoaded || hasExplicitDimensions) && !imageError;
  const showDownload = canDownload && showControls && showDownloadControl;
  const showFallback = imageError && !hasExplicitDimensions;

  // Handle images already complete before React attaches event handlers (e.g. cached or SSR hydration)
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      const loaded = img.naturalWidth > 0;
      setImageLoaded(loaded);
      setImageError(!loaded);
    }
  }, []);

  const handleLoad = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (event) => {
      setImageLoaded(true);
      setImageError(false);
      onLoadProp?.(event);
    },
    [onLoadProp]
  );

  const handleError = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (event) => {
      setImageLoaded(false);
      setImageError(true);
      onErrorProp?.(event);
    },
    [onErrorProp]
  );

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex image download logic with multiple edge cases"
  const downloadImage = async () => {
    /* v8 ignore next */
    if (!src) {
      return;
    }

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      // Extract filename from URL or use alt text with proper extension
      const urlPath = new URL(src, window.location.origin).pathname;
      const originalFilename = urlPath.split("/").pop() || "";
      const extension = originalFilename.split(".").pop();
      const hasExtension =
        originalFilename.includes(".") &&
        extension !== undefined &&
        extension.length <= 4;

      let filename = "";

      if (hasExtension) {
        filename = originalFilename;
      } else {
        // Determine extension from blob type
        const mimeType = blob.type;
        let fileExtension = "png"; // default

        if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
          fileExtension = "jpg";
        } else if (mimeType.includes("png")) {
          fileExtension = "png";
        } else if (mimeType.includes("svg")) {
          fileExtension = "svg";
        } else if (mimeType.includes("gif")) {
          fileExtension = "gif";
        } else if (mimeType.includes("webp")) {
          fileExtension = "webp";
        }

        const baseName = alt || originalFilename || "image";
        filename = `${baseName.replace(fileExtensionPattern, "")}.${fileExtension}`;
      }

      save(filename, blob, blob.type);
    } catch {
      // CORS fallback: open image in new tab for manual save
      window.open(src, "_blank");
    }
  };

  if (!src) {
    return null;
  }

  return (
    <div
      className={cn("group relative my-4 inline-block")}
      data-streamdown="image-wrapper"
    >
      {/** biome-ignore lint/performance/noImgElement: "streamdown is framework-agnostic" */}
      {/** biome-ignore lint/correctness/useImageSize: "unknown size" */}
      {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: image overlay with intentional load/error handling */}
      <img
        alt={alt}
        className={cn(
          "max-w-full rounded-lg",
          showFallback && "hidden",
          className
        )}
        data-streamdown="image"
        onError={handleError}
        onLoad={handleLoad}
        ref={imgRef}
        src={src}
        {...props}
      />
      {showFallback && (
        <span
          className={cn("text-muted-foreground text-xs italic")}
          data-streamdown="image-fallback"
        >
          {t.imageNotAvailable}
        </span>
      )}
      {showControls && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block"
          )}
          data-streamdown="image-overlay"
        />
      )}
      {showDownload && (
        <button
          className={cn(
            "absolute right-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background",
            "opacity-0 group-hover:opacity-100"
          )}
          onClick={downloadImage}
          title={t.downloadImage}
          type="button"
        >
          <DownloadIcon size={14} />
        </button>
      )}
    </div>
  );
};
