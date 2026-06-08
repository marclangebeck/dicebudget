import { APP_NAME, SITE_URL } from "@/lib/branding";

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function canShareImageFile(): Promise<boolean> {
  if (!canUseWebShare() || !navigator.canShare) return false;
  try {
    const probe = new File([new Blob(["x"], { type: "image/png" })], "probe.png", {
      type: "image/png",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function shareWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadShareBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareImageAndText(params: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
}): Promise<"shared" | "downloaded" | "aborted"> {
  const { blob, filename, title, text } = params;
  const file = new File([blob], filename, { type: "image/png" });

  if (canUseWebShare()) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return "shared";
      }
      await navigator.share({ title, text, url: SITE_URL });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "aborted";
    }
  }

  downloadShareBlob(blob, filename);
  return "downloaded";
}

export function appendSiteLink(body: string): string {
  return `${body}\n\nJetzt spielen: ${SITE_URL}`;
}

export function shareCardTitle(suffix: string): string {
  return `${APP_NAME} — ${suffix}`;
}
