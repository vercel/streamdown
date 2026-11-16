import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    (element) => element.tabIndex >= 0 && !element.hasAttribute("disabled")
  );

const isInside = (dialog: HTMLElement, node: EventTarget | null) =>
  node instanceof Node && dialog.contains(node);

// Pick the element Tab should wrap to, or null to let the browser move focus.
const getWrapTarget = (dialog: HTMLElement, shiftKey: boolean) => {
  const focusable = getFocusableElements(dialog);
  const first = focusable[0];
  const last = focusable.at(-1);
  // Nothing to focus: the dialog has no tabindex, so focusing it does nothing,
  // but the caller still prevents the default and focus stays where it is.
  if (!(first && last)) {
    return dialog;
  }

  const active = document.activeElement;
  const focusInside = isInside(dialog, active);
  if (shiftKey) {
    return active === first || !focusInside ? last : null;
  }
  return active === last || !focusInside ? first : null;
};

interface DialogFocus {
  dialogRef: RefObject<HTMLDivElement | null>;
  initialFocusRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Modal dialog focus handling: move focus into the dialog when it opens, keep
 * Tab and Shift+Tab inside it, and return focus once the dialog closes. Focus
 * returns to `triggerRef` when given, otherwise to the element that had it
 * before opening (some browsers do not focus a button on mouse click).
 */
export const useDialogFocus = (
  open: boolean,
  triggerRef?: RefObject<HTMLElement | null>
): DialogFocus => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus =
      triggerRef?.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (event.key !== "Tab" || !dialog) {
        return;
      }

      // Leave Tab alone in other overlays opened from the dialog, such as the
      // link safety modal.
      if (event.target !== document.body && !isInside(dialog, event.target)) {
        return;
      }

      const wrapTarget = getWrapTarget(dialog, event.shiftKey);
      if (wrapTarget) {
        event.preventDefault();
        wrapTarget.focus();
      }
    };

    // Listen in the capture phase: the dialog content stops propagation of
    // every key except Escape.
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [open, triggerRef]);

  return { dialogRef, initialFocusRef };
};
