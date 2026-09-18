"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  INTERFACE_ZOOM_DEFAULT,
  INTERFACE_ZOOM_STORAGE_KEY,
  normalizeInterfaceZoom,
} from "./interface-zoom";

const INTERFACE_ZOOM_CHANGE_EVENT = "aubos-interface-zoom-change";

export function getInterfaceZoom(): number {
  if (typeof window === "undefined") return INTERFACE_ZOOM_DEFAULT;

  try {
    return normalizeInterfaceZoom(document.documentElement.dataset.interfaceZoom ?? window.localStorage.getItem(INTERFACE_ZOOM_STORAGE_KEY));
  } catch {
    return normalizeInterfaceZoom(document.documentElement.dataset.interfaceZoom ?? null);
  }
}

export function applyInterfaceZoomToDocument(nextZoom = getInterfaceZoom()): void {
  if (typeof document === "undefined") return;

  const zoom = normalizeInterfaceZoom(nextZoom);
  document.documentElement.dataset.interfaceZoom = String(zoom);
}

export function setInterfaceZoom(nextZoom: number): void {
  if (typeof window === "undefined") return;

  const zoom = normalizeInterfaceZoom(nextZoom);
  try {
    window.localStorage.setItem(INTERFACE_ZOOM_STORAGE_KEY, String(zoom));
  } catch {
    // The control still works when storage is unavailable.
  }
  applyInterfaceZoomToDocument(zoom);
  window.dispatchEvent(new CustomEvent(INTERFACE_ZOOM_CHANGE_EVENT, { detail: zoom }));
}

function subscribeInterfaceZoom(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === INTERFACE_ZOOM_STORAGE_KEY || event.key === null) {applyInterfaceZoomToDocument(normalizeInterfaceZoom(event.newValue));onChange();}
  };
  window.addEventListener(INTERFACE_ZOOM_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(INTERFACE_ZOOM_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useInterfaceZoom(): [number, (nextZoom: number) => void] {
  const zoom = useSyncExternalStore(
    subscribeInterfaceZoom,
    getInterfaceZoom,
    () => INTERFACE_ZOOM_DEFAULT,
  );

  useEffect(() => {
    applyInterfaceZoomToDocument(getInterfaceZoom());
  }, []);

  return [zoom, setInterfaceZoom];
}
