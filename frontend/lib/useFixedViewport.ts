import { useEffect } from "react";

/** Blockiert Seiten-Scroll und Pinch-Zoom (z. B. iOS PWA). */
export function useFixedViewport(routeClass: string) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add(routeClass);
    body.classList.add(routeClass);

    const syncViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      html.style.setProperty("--app-viewport-height", `${height}px`);
    };

    const blockPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const blockGesture = (e: Event) => e.preventDefault();

    syncViewportHeight();
    window.addEventListener("resize", syncViewportHeight);
    window.addEventListener("orientationchange", syncViewportHeight);
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    document.addEventListener("touchmove", blockPinch, { passive: false });
    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });

    return () => {
      html.classList.remove(routeClass);
      body.classList.remove(routeClass);
      html.style.removeProperty("--app-viewport-height");
      window.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      document.removeEventListener("touchmove", blockPinch);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
    };
  }, [routeClass]);
}
