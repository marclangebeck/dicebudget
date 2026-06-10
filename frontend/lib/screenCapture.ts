import { toBlob } from "html-to-image";

const CAPTURE_ROOT_SELECTORS = [".home-screen", ".setup-screen", ".legal-screen"] as const;

export function findScreenCaptureRoot(): HTMLElement {
  for (const selector of CAPTURE_ROOT_SELECTORS) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) return el;
  }
  return document.body;
}

export async function captureVisibleScreen(): Promise<Blob> {
  const node = findScreenCaptureRoot();
  const blob = await toBlob(node, {
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    cacheBust: true,
    filter: (domNode) => {
      if (!(domNode instanceof HTMLElement)) return true;
      if (domNode.dataset.captureExclude === "true") return false;
      return true;
    },
  });

  if (!blob) {
    throw new Error("Screenshot konnte nicht erstellt werden.");
  }

  return blob;
}
