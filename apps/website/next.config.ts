import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  async headers() {
    return [
      {
        // Add CORS headers for CDN routes to support cross-origin requests
        source: "/cdn/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/:path*",
      },
      {
        source: "/docs/:path*.md",
        destination: "/llms.mdx/:path*",
      },
      {
        source: "/cdn/shiki/:version/langs/:path*",
        destination:
          "https://cdn.jsdelivr.net/npm/@shikijs/langs@:version/dist/:path*",
      },
      {
        source: "/cdn/shiki/:version/themes/:path*",
        destination:
          "https://cdn.jsdelivr.net/npm/@shikijs/themes@:version/dist/:path*",
      },
      {
        source: "/cdn/katex/:version/:path*",
        destination: "https://cdn.jsdelivr.net/npm/katex@:version/dist/:path*",
      },
      {
        source: "/cdn/mermaid/:version/:path*",
        destination:
          "https://cdn.jsdelivr.net/npm/mermaid@:version/dist/:path*",
      },
    ];
  },
};

export default withMDX(config);
