"use client";

import * as React from "react";

const DEFAULT_MESSAGE = "You have unsaved changes. Leave this page and lose them?";

/**
 * Warns before the user leaves while `enabled` is true: on tab close / reload (native prompt)
 * and on in-app link clicks (the App Router has no navigation-blocking API).
 */
export function useUnsavedChangesWarning(enabled: boolean, message: string = DEFAULT_MESSAGE) {
  React.useEffect(() => {
    if (!enabled) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function onClickCapture(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      // Cross-origin navigation is covered by beforeunload; same-page links don't navigate away.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture phase on document runs before Next's <Link> handler (delegated at the React root).
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [enabled, message]);
}
