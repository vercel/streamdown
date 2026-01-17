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
 * Hook to access the code plugin
 */
export const useCodePlugin = () => {
  const plugins = usePlugins();
  return plugins?.code ?? null;
};

/**
 * Hook to access the mermaid plugin
 */
export const useMermaidPlugin = () => {
  const plugins = usePlugins();
  return plugins?.mermaid ?? null;
};

/**
 * Hook to access the math plugin
 */
export const useMathPlugin = () => {
  const plugins = usePlugins();
  return plugins?.math ?? null;
};

/**
 * Hook to access the cjk plugin
 */
export const useCjkPlugin = () => {
  const plugins = usePlugins();
  return plugins?.cjk ?? null;
};
