/**
 * Convert SVG string to PNG blob for export
 */
export const svgToPngBlob = (
  svgString: string,
  options?: { scale?: number }
): Promise<Blob> => {
  const scale = options?.scale ?? 5;

  return new Promise((resolve, reject) => {
    const encoded =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)));

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.width * scale;
      const h = img.height * scale;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to create 2D canvas context for PNG export"));
        return;
      }

      // Do NOT draw a background → transparency preserved
      // ctx.clearRect(0, 0, w, h);

      ctx.drawImage(img, 0, 0, w, h);

      // Export PNG (lossless, keeps transparency)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create PNG blob"));
          return;
        }
        resolve(blob);
      }, "image/png");
    };

    img.onerror = () => reject(new Error("Failed to load SVG image"));
    img.src = encoded;
  });
};

/**
 * Re-serialize an SVG string as valid XML using the browser's DOMParser and
 * XMLSerializer. Mermaid renders diagrams via innerHTML, which can produce
 * HTML-normalized elements such as `<br>` (non-self-closing) that are invalid
 * inside SVG/XML. XMLSerializer converts them back to self-closing form so the
 * saved file is valid and can be loaded as an image.
 *
 * Falls back to the original string when running outside a browser or if
 * parsing fails.
 */
export const sanitizeSvgForExport = (svgString: string): string => {
  if (typeof document === "undefined") {
    return svgString;
  }
  try {
    const container = document.createElement("div");
    container.innerHTML = svgString;
    const svgElement = container.querySelector("svg");
    if (!svgElement) {
      return svgString;
    }
    return new XMLSerializer().serializeToString(svgElement);
  } catch {
    return svgString;
  }
};
