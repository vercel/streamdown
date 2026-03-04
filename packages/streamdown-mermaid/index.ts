"use client";

import type { MermaidConfig } from "mermaid";
import mermaidLib from "mermaid";

/**
 * Mermaid instance interface
 */
export interface MermaidInstance {
  initialize: (config: MermaidConfig) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
}

/**
 * Plugin for diagram rendering (Mermaid)
 */
export interface DiagramPlugin {
  /**
   * Get the mermaid instance (initialized with optional config)
   */
  getMermaid: (config?: MermaidConfig) => MermaidInstance;
  /**
   * Language identifier for code blocks
   */
  language: string;
  name: "mermaid";
  type: "diagram";
}

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
export function createMermaidPlugin(
  options: MermaidPluginOptions = {}
): DiagramPlugin {
  let initialized = false;
  let currentConfig: MermaidConfig = { ...defaultConfig, ...options.config };

  const mermaidInstance: MermaidInstance = {
    initialize(config: MermaidConfig) {
      currentConfig = { ...defaultConfig, ...options.config, ...config };
      mermaidLib.initialize(currentConfig);
      initialized = true;
    },
    async render(id: string, source: string) {
      if (!initialized) {
        mermaidLib.initialize(currentConfig);
        initialized = true;
      }
      return await mermaidLib.render(id, source);
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
export const mermaid = createMermaidPlugin();

// Re-export MermaidConfig for convenience
export type { MermaidConfig } from "mermaid";
