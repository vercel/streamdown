import { createSource } from "@vercel/geistdocs/source";
import remarkMath from "remark-math";
import { docs } from "@/.source/server";
import { config } from "./config";

export const geistdocsSource = createSource({
  docs,
  config,
  markdown: {
    // Parse math in Markdown exports like `source.config.ts` does for the rendered page.
    remarkPlugins: [remarkMath],
  },
});

export const source = geistdocsSource.source;
export const getPageImage = geistdocsSource.getPageImage;
export const getLLMText = geistdocsSource.getPageMarkdown;
