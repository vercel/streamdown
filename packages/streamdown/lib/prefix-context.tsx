"use client";

import { createContext, useContext } from "react";
import { type CnFunction, cn as defaultCn } from "./utils";

/**
 * Context for providing a prefix-aware `cn` function to all components.
 * Defaults to the standard `cn` (no prefix) for zero-overhead when unused.
 */
export const PrefixContext = createContext<CnFunction>(defaultCn);

/**
 * Hook to access the prefix-aware `cn` function.
 * When a prefix is set via `<Streamdown prefix="...">`, this returns
 * a `cn` that prepends the prefix to all class names.
 */
export const useCn = (): CnFunction => useContext(PrefixContext);
