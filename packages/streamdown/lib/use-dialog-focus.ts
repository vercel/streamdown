import { type RefObject, useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusable = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));

/**
 * Moves focus into a modal dialog when it opens, keeps Tab / Shift+Tab inside
 * it while open, and returns focus to the previously focused element on close.
 */
export const useDialogFocus = (
  isOpen: boolean,
  dialogRef: RefObject<HTMLElement | null>
) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const previous = document.activeElement as HTMLElement | null;
    (getFocusable(dialog)[0] ?? dialog).focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") {
        return;
      }
      const focusable = getFocusable(dialog);
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Capture phase: the dialog's inner wrappers stop keydown propagation.
    document.addEventListener("keydown", handleTab, true);
    return () => {
      document.removeEventListener("keydown", handleTab, true);
      if (previous?.isConnected) {
        previous.focus();
      }
    };
  }, [isOpen, dialogRef]);
};
