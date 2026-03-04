import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  redirects: async () => {
    return [
      {
        source: "/docs/cjk-support",
        destination: "/docs/plugins/cjk",
        permanent: true,
      },
      {
        source: "/docs/mermaid",
        destination: "/docs/plugins/mermaid",
        permanent: true,
      },
      {
        source: "/docs/mathematics",
        destination: "/docs/plugins/math",
        permanent: true,
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default withMDX(config);
