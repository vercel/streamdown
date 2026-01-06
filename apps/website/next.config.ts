import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
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
          "https://cdn.jsdelivr.net/npm/shiki@:version/dist/langs/:path*",
      },
      {
        source: "/cdn/shiki/:version/themes/:path*",
        destination:
          "https://cdn.jsdelivr.net/npm/shiki@:version/dist/themes/:path*",
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
