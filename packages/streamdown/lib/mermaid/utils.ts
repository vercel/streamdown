/**
 * Ensure SVG string has required XML namespaces for canvas rendering
 */
function normalizeSvg(svg: string): string {
  if (svg.includes("xlink:href") && !svg.includes("xmlns:xlink")) {
    return svg.replace("<svg", '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  return svg;
}

/**
 * Convert SVG string to PNG blob for export
 */
export const svgToPngBlob = (
  svgString: string,
  options?: { scale?: number }
): Promise<Blob> => {
  const scale = options?.scale ?? 5;

  return new Promise((resolve, reject) => {
    const normalized = normalizeSvg(svgString);

    const encoded =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(normalized)));

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
