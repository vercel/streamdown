import type { ControlsConfig } from "../index";

export const getDownloadFilename = (
  config: ControlsConfig,
  type: "code" | "table" | "mermaid",
  fallback: string
): string => {
  if (typeof config === "boolean") {
    return fallback;
  }

  const typeConfig = config[type];
  if (typeof typeConfig !== "object") {
    return fallback;
  }

  const downloadConfig = typeConfig.download;
  if (typeof downloadConfig !== "object") {
    return fallback;
  }

  return downloadConfig.filename || fallback;
};

export const getCopyCallbacks = (
  config: ControlsConfig,
  type: "code" | "mermaid"
): { onCopy?: () => void; onError?: (error: Error) => void } => {
  if (typeof config === "boolean") {
    return {};
  }

  const typeConfig = config[type];
  if (typeof typeConfig !== "object") {
    return {};
  }

  const copyConfig = typeConfig.copy;
  if (typeof copyConfig !== "object" || copyConfig === null) {
    return {};
  }

  return {
    onCopy: copyConfig.onCopy,
    onError: copyConfig.onError,
  };
};
