import {
  type DetailedHTMLProps,
  type ImgHTMLAttributes,
  useState,
} from "react";
import type { ExtraProps } from "react-markdown";
import { DownloadIcon } from "lucide-react";
import { cn } from "./utils";

export const ImageComponent = ({
  node,
  className,
  src,
  alt,
  ...props
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> &
  ExtraProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const downloadImage = async () => {
    if (!src) return;

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Extract filename from URL or use alt text with proper extension
      const urlPath = new URL(src, window.location.origin).pathname;
      const originalFilename = urlPath.split('/').pop() || '';
      const hasExtension = originalFilename.includes('.') && originalFilename.split('.').pop()?.length! <= 4;
      
      let filename = '';
      if (hasExtension) {
        filename = originalFilename;
      } else {
        // Determine extension from blob type
        const mimeType = blob.type;
        let extension = 'png'; // default
        
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
          extension = 'jpg';
        } else if (mimeType.includes('png')) {
          extension = 'png';
        } else if (mimeType.includes('svg')) {
          extension = 'svg';
        } else if (mimeType.includes('gif')) {
          extension = 'gif';
        } else if (mimeType.includes('webp')) {
          extension = 'webp';
        }
        
        const baseName = alt || originalFilename || 'image';
        filename = `${baseName.replace(/\.[^/.]+$/, '')}.${extension}`;
      }
      
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <div
      className="group relative my-4 inline-block"
      data-streamdown="image-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        className={cn("max-w-full rounded-lg", className)}
        data-streamdown="image"
        src={src}
        alt={alt}
        {...props}
      />
      {isHovered && (
        <div className="absolute inset-0 bg-black/10 rounded-lg pointer-events-none" />
      )}
      <button
        className={cn(
          "absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 bg-background/90 hover:bg-background border border-border rounded-md shadow-sm transition-all duration-200 cursor-pointer backdrop-blur-sm",
          isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
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