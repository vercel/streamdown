import { createSource } from "@vercel/geistdocs/source";
import { docs } from "@/.source/server";
import { config } from "./config";
import { unmaskMath, withMaskedMath } from "./math-markdown";

// TEMPORARY math workaround until https://github.com/vercel/geistdocs/pull/402 is released, see `./math-markdown`.
export const geistdocsSource = createSource({
  docs: withMaskedMath(docs),
  config,
  markdown: {
    transform: unmaskMath,
  },
});

export const source = geistdocsSource.source;
export const getPageImage = geistdocsSource.getPageImage;
export const getLLMText = geistdocsSource.getPageMarkdown;
