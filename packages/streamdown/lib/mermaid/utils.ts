import type { MermaidConfig } from "mermaid";
import packageJson from "../../package.json";

// Get mermaid version for CDN URL
const MERMAID_VERSION = (
  packageJson.dependencies?.mermaid ?? packageJson.devDependencies?.mermaid ?? "11"
).replace(/^\^/, "");

// Use a proxy URL that can be rewritten by the host application
// For example, Next.js can rewrite /cdn/mermaid/:version/* to jsDelivr
const MERMAID_CDN_URL = `/cdn/mermaid/${MERMAID_VERSION}/mermaid.esm.min.mjs`;

// Cache the mermaid module once loaded
let mermaidModuleCache: typeof import("mermaid") | null = null;

export const initializeMermaid = async (customConfig?: MermaidConfig) => {
  const defaultConfig: MermaidConfig = {
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
    fontFamily: "monospace",
    suppressErrorRendering: true,
  } as MermaidConfig;

  const config = { ...defaultConfig, ...customConfig };

  // Load mermaid from CDN if not cached
  if (!mermaidModuleCache) {
    mermaidModuleCache = await import(/* webpackIgnore: true */ MERMAID_CDN_URL);
  }

  const mermaid = mermaidModuleCache.default;

  // Always reinitialize with the current config to support different configs per component
  mermaid.initialize(config);

  return mermaid;
};

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
