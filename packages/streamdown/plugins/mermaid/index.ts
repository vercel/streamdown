"use client";

import mermaid from "mermaid";
import type { MermaidConfig } from "mermaid";
import type { DiagramPlugin, MermaidInstance } from "../../lib/plugin-types";

/**
 * Options for creating a Mermaid plugin
 */
export interface MermaidPluginOptions {
  /**
   * Default Mermaid configuration
   */
  config?: MermaidConfig;
}

const defaultConfig: MermaidConfig = {
  startOnLoad: false,
  theme: "default",
  securityLevel: "strict",
  fontFamily: "monospace",
  suppressErrorRendering: true,
};

/**
 * Create a Mermaid plugin with optional configuration
 */
export function createMermaidPlugin(options: MermaidPluginOptions = {}): DiagramPlugin {
  let initialized = false;
  let currentConfig: MermaidConfig = { ...defaultConfig, ...options.config };

  const mermaidInstance: MermaidInstance = {
    initialize(config: MermaidConfig) {
      currentConfig = { ...defaultConfig, ...options.config, ...config };
      mermaid.initialize(currentConfig);
      initialized = true;
    },
    async render(id: string, source: string) {
      if (!initialized) {
        mermaid.initialize(currentConfig);
        initialized = true;
      }
      return mermaid.render(id, source);
    },
  };

  return {
    name: "mermaid",
    type: "diagram",
    language: "mermaid",
    getMermaid(config?: MermaidConfig) {
      if (config) {
        mermaidInstance.initialize(config);
      }
      return mermaidInstance;
    },
  };
}

/**
 * Pre-configured Mermaid plugin with default settings
 */
export const mermaidPlugin = createMermaidPlugin();

// Re-export types
export type { DiagramPlugin, MermaidInstance } from "../../lib/plugin-types";
export type { MermaidConfig } from "mermaid";
