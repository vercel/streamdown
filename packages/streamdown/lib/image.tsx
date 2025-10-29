import { DownloadIcon } from "lucide-react";
import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import type { ExtraProps } from "react-markdown";
import { cn, save } from "./utils";

const FILE_EXTENSION_PATTERN = /\.[^/.]+$/;
const MAX_EXTENSION_LENGTH = 4;

type ImageComponentProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> &
  ExtraProps;

// Determines file extension from MIME type
const getExtensionFromMimeType = (mimeType: string): string => {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "jpg";
  }
  if (mimeType.includes("png")) {
    return "png";
  }
  if (mimeType.includes("svg")) {
    return "svg";
  }
  if (mimeType.includes("gif")) {
    return "gif";
  }
  if (mimeType.includes("webp")) {
    return "webp";
  }
  return "png"; // default
};

// Checks if a filename has a valid extension
const hasValidExtension = (filename: string): boolean => {
  const parts = filename.split(".");
  if (!filename.includes(".") || parts.length < 2) {
    return false;
  }
  const extension = parts.pop();
  return (extension?.length ?? 0) <= MAX_EXTENSION_LENGTH;
};

// Generates filename from blob and alt text
const generateFilename = (
  originalFilename: string,
  blob: Blob,
  alt: string | undefined
): string => {
  if (hasValidExtension(originalFilename)) {
    return originalFilename;
  }

  const extension = getExtensionFromMimeType(blob.type);
  const baseName = alt || originalFilename || "image";
  return `${baseName.replace(FILE_EXTENSION_PATTERN, "")}.${extension}`;
};

export const ImageComponent = ({
  node,
  className,
  src,
  alt,
  ...props
}: ImageComponentProps) => {
  const downloadImage = async () => {
    if (!src) {
      return;
    }

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      // Extract filename from URL
      const urlPath = new URL(src, window.location.origin).pathname;
      const originalFilename = urlPath.split("/").pop() || "";

      const filename = generateFilename(originalFilename, blob, alt);
      save(filename, blob, blob.type);
    } catch (_error) {
      // Silently fail if download fails
    }
  };

  if (!src) {
    return null;
  }

  return (
    <div
      className="group relative my-4 inline-block"
      data-streamdown="image-wrapper"
    >
      {/** biome-ignore lint/nursery/useImageSize: "unknown size" */}
      {/** biome-ignore lint/performance/noImgElement: "streamdown is framework-agnostic" */}
      <img
        alt={alt}
        className={cn("max-w-full rounded-lg", className)}
        data-streamdown="image"
        src={src}
        {...props}
      />
      <div className="pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block" />
      <button
        className={cn(
          "absolute right-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background",
          "opacity-0 group-hover:opacity-100"
        )}
        onClick={downloadImage}
        title="Download image"
        type="button"
      >
        <DownloadIcon size={14} />
      </button>
    </div>
  );
};
