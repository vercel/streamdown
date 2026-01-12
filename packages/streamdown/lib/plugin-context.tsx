"use client";

import { createContext, useContext } from "react";
import type { PluginConfig } from "./plugin-types";

/**
 * Context for Streamdown plugins
 */
export const PluginContext = createContext<PluginConfig | null>(null);

/**
 * Hook to access all plugins
 */
export const usePlugins = (): PluginConfig | null => useContext(PluginContext);

/**
 * Hook to access the shiki plugin
 */
export const useShikiPlugin = () => {
  const plugins = usePlugins();
  return plugins?.shiki ?? null;
};

/**
 * Hook to access the mermaid plugin
 */
export const useMermaidPlugin = () => {
  const plugins = usePlugins();
  return plugins?.mermaid ?? null;
};

/**
 * Hook to access the katex plugin
 */
export const useKatexPlugin = () => {
  const plugins = usePlugins();
  return plugins?.katex ?? null;
};

/**
 * Hook to access the cjk plugin
 */
export const useCjkPlugin = () => {
  const plugins = usePlugins();
  return plugins?.cjk ?? null;
};
