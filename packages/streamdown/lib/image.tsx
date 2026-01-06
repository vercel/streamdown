import { DownloadIcon } from "./icons";
import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import type { ExtraProps } from "./markdown";
import { cn, save } from "./utils";

const fileExtensionPattern = /\.[^/.]+$/;

type ImageComponentProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> &
  ExtraProps;

export const ImageComponent = ({
  node,
  className,
  src,
  alt,
  ...props
}: ImageComponentProps) => {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex image download logic with multiple edge cases"
  const downloadImage = async () => {
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
    } catch (error) {
      console.error("Failed to download image:", error);
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
      {/** biome-ignore lint/performance/noImgElement: "streamdown is framework-agnostic" */}
      {/** biome-ignore lint/correctness/useImageSize: "unknown size" */}
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
