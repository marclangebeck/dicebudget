import { useEffect } from "react";

/** Blockiert Seiten-Scroll und Pinch-Zoom (z. B. iOS PWA). */
export function useFixedViewport(routeClass: string) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add(routeClass);
    body.classList.add(routeClass);

    const blockPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const blockGesture = (e: Event) => e.preventDefault();

    document.addEventListener("touchmove", blockPinch, { passive: false });
    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });

    return () => {
      html.classList.remove(routeClass);
      body.classList.remove(routeClass);
      document.removeEventListener("touchmove", blockPinch);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
    };
  }, [routeClass]);
}
