"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const query = "(min-width: 1200px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

export function LiveViewport({ desktop, children }: { desktop: ReactNode; children: ReactNode }) {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isDesktop ? desktop : children;
}
