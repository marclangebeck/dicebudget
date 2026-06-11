import { useEffect } from "react";

type Options = {
  /** false = Pinch-Zoom erlauben (Settings, Legal). Standard: true (Spiel-Routen). */
  blockPinchZoom?: boolean;
};

/** Layout-Höhe sync + optional Pinch-Zoom-Block (Spiel-Routen). */
export function useFixedViewport(routeClass: string, options: Options = {}) {
  const blockPinchZoom = options.blockPinchZoom !== false;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add(routeClass);
    body.classList.add(routeClass);
    if (!blockPinchZoom) {
      html.classList.add("zoomable-route");
      body.classList.add("zoomable-route");
    }

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

    if (blockPinchZoom) {
      document.addEventListener("touchmove", blockPinch, { passive: false });
      document.addEventListener("gesturestart", blockGesture, { passive: false });
      document.addEventListener("gesturechange", blockGesture, { passive: false });
      document.addEventListener("gestureend", blockGesture, { passive: false });
    }

    return () => {
      html.classList.remove(routeClass, "zoomable-route");
      body.classList.remove(routeClass, "zoomable-route");
      html.style.removeProperty("--app-viewport-height");
      window.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      if (blockPinchZoom) {
        document.removeEventListener("touchmove", blockPinch);
        document.removeEventListener("gesturestart", blockGesture);
        document.removeEventListener("gesturechange", blockGesture);
        document.removeEventListener("gestureend", blockGesture);
      }
    };
  }, [routeClass, blockPinchZoom]);
}
