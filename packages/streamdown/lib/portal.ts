import type { PortalTarget } from "../index";

export const resolvePortalTarget = (
  portal: PortalTarget | undefined
): HTMLElement => {
  const container = typeof portal === "function" ? portal() : portal;
  return container ?? document.body;
};
