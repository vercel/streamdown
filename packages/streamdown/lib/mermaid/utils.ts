const SVG_TAG_REGEX = /<svg\b[^>]*>/i;
const VIEW_BOX_REGEX = /\bviewBox=(['"])(.*?)\1/i;
const VIEW_BOX_SPLIT_REGEX = /[\s,]+/;
const WIDTH_ATTR_REGEX = /\swidth=(['"]).*?\1/gi;
const HEIGHT_ATTR_REGEX = /\sheight=(['"]).*?\1/gi;
const STYLE_ATTR_REGEX = /\sstyle=(['"])(.*?)\1/i;
const WIDTH_DECL_REGEX = /^width\s*:/i;
const HEIGHT_DECL_REGEX = /^height\s*:/i;
const MAX_WIDTH_DECL_REGEX = /^max-width\s*:/i;
const SVG_OPEN_TAG_REGEX = /^<svg/i;

/**
 * Normalize Mermaid SVG dimensions for inline rendering.
 * Mermaid emits width="100%" with max-width style, which can shrink very wide
 * diagrams until text becomes unreadable.
 */
export const getMermaidSvgSize = (
  svgString: string
): { height: number; width: number } | null => {
  const svgTagMatch = svgString.match(SVG_TAG_REGEX);
  if (!svgTagMatch) {
    return null;
  }

  const svgTag = svgTagMatch[0];
  const viewBoxMatch = svgTag.match(VIEW_BOX_REGEX);
  const viewBox = viewBoxMatch?.[2];

  if (!viewBox) {
    return null;
  }

  const values = viewBox
    .trim()
    .split(VIEW_BOX_SPLIT_REGEX)
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
  const svgTagMatch = svgString.match(SVG_TAG_REGEX);
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
      .replace(WIDTH_ATTR_REGEX, "")
      .replace(HEIGHT_ATTR_REGEX, "");

    const styleMatch = updatedSvgTag.match(STYLE_ATTR_REGEX);
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
            !(
              WIDTH_DECL_REGEX.test(decl) ||
              HEIGHT_DECL_REGEX.test(decl) ||
              MAX_WIDTH_DECL_REGEX.test(decl)
            )
        )
        .join(";");

      const mergedStyle = `${sizeDeclarations}${filtered ? `${filtered};` : ""}`;
      updatedSvgTag = updatedSvgTag.replace(
        STYLE_ATTR_REGEX,
        ` style=${styleQuote}${mergedStyle}${styleQuote}`
      );
    } else {
      updatedSvgTag = updatedSvgTag.replace(
        SVG_OPEN_TAG_REGEX,
        `<svg style="${sizeDeclarations}"`
      );
    }

    updatedSvgTag = updatedSvgTag.replace(
      SVG_OPEN_TAG_REGEX,
      `<svg width="${width}" height="${height}"`
    );

    return svgString.replace(svgTag, updatedSvgTag);
  } catch {
    return svgString;
  }
};

/**
 * Mermaid render output may be HTML-serialized. Serialize the SVG node as XML
 * before downloading so embedded HTML like <br> becomes valid SVG markup.
 */
export const serializeSvgForDownload = (svgString: string): string => {
  if (
    typeof DOMParser === "undefined" ||
    typeof XMLSerializer === "undefined"
  ) {
    return svgString;
  }

  const doc = new DOMParser().parseFromString(svgString, "text/html");
  const svg = doc.querySelector("svg");

  if (!svg) {
    return svgString;
  }

  return new XMLSerializer().serializeToString(svg);
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
