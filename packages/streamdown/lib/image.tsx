import { DownloadIcon } from "lucide-react";
import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import type { ExtraProps } from "react-markdown";
import { cn, save } from "./utils";

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
      const hasExtension =
        originalFilename.includes(".") &&
        originalFilename.split(".").pop()?.length! <= 4;

      let filename = "";

      if (hasExtension) {
        filename = originalFilename;
      } else {
        // Determine extension from blob type
        const mimeType = blob.type;
        let extension = "png"; // default

        if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
          extension = "jpg";
        } else if (mimeType.includes("png")) {
          extension = "png";
        } else if (mimeType.includes("svg")) {
          extension = "svg";
        } else if (mimeType.includes("gif")) {
          extension = "gif";
        } else if (mimeType.includes("webp")) {
          extension = "webp";
        }

        const baseName = alt || originalFilename || "image";
        filename = `${baseName.replace(/\.[^/.]+$/, "")}.${extension}`;
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
