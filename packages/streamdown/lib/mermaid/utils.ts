/**
 * Normalize Mermaid SVG dimensions for inline rendering.
 * Mermaid emits width="100%" with max-width style, which can shrink very wide
 * diagrams until text becomes unreadable.
 */
export const getMermaidSvgSize = (
  svgString: string
): { height: number; width: number } | null => {
  const svgTagMatch = svgString.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) {
    return null;
  }

  const svgTag = svgTagMatch[0];
  const viewBoxMatch = svgTag.match(/\bviewBox=(['"])(.*?)\1/i);
  const viewBox = viewBoxMatch?.[2];

  if (!viewBox) {
    return null;
  }

  const values = viewBox
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value));

  if (values.length < 4 || values.slice(0, 4).some(Number.isNaN)) {
    return null;
  }

  const width = values[2];
  const height = values[3];
  if (!(width > 0 && height > 0)) {
    return null;
  }

  return { height, width };
};

/**
 * Normalize Mermaid SVG dimensions for inline rendering.
 * Mermaid emits width="100%" with max-width style, which can shrink very wide
 * diagrams until text becomes unreadable.
 */
export const normalizeMermaidInlineSvg = (svgString: string): string => {
  const svgTagMatch = svgString.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) {
    return svgString;
  }

  try {
    const svgTag = svgTagMatch[0];
    const size = getMermaidSvgSize(svgString);
    if (!size) {
      return svgString;
    }
    const { width, height } = size;

    let updatedSvgTag = svgTag
      .replace(/\swidth=(['"]).*?\1/gi, "")
      .replace(/\sheight=(['"]).*?\1/gi, "");

    const styleMatch = updatedSvgTag.match(/\sstyle=(['"])(.*?)\1/i);
    const sizeDeclarations = `width:${width}px;height:${height}px;max-width:none;`;

    if (styleMatch) {
      const styleQuote = styleMatch[1];
      const styleValue = styleMatch[2];
      const filtered = styleValue
        .split(";")
        .map((decl) => decl.trim())
        .filter(Boolean)
        .filter(
          (decl) =>
            !/^width\s*:/i.test(decl) &&
            !/^height\s*:/i.test(decl) &&
            !/^max-width\s*:/i.test(decl)
        )
        .join(";");

      const mergedStyle = `${sizeDeclarations}${filtered ? `${filtered};` : ""}`;
      updatedSvgTag = updatedSvgTag.replace(
        /\sstyle=(['"])(.*?)\1/i,
        ` style=${styleQuote}${mergedStyle}${styleQuote}`
      );
    } else {
      updatedSvgTag = updatedSvgTag.replace(
        /^<svg/i,
        `<svg style="${sizeDeclarations}"`
      );
    }

    updatedSvgTag = updatedSvgTag.replace(
      /^<svg/i,
      `<svg width="${width}" height="${height}"`
    );

    return svgString.replace(svgTag, updatedSvgTag);
  } catch {
    return svgString;
  }
};

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
