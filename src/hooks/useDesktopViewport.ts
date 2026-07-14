import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function getSnapshot() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DESKTOP_QUERY).matches;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

export function useDesktopViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}