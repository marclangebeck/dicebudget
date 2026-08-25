import { APP_NAME, SITE_URL } from "@/lib/branding";

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
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

/** Nur den Raumcode teilen (ohne Link). */
export async function shareInviteCode(code: string): Promise<"shared" | "copied" | "aborted"> {
  const text = code.trim().toUpperCase();
  if (!text) return "copied";

  if (canUseWebShare()) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "aborted";
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      /* fallback below */
    }
  }

  return "copied";
}

export async function sharePlainText(params: {
  title: string;
  text: string;
}): Promise<"shared" | "copied" | "aborted"> {
  const { title, text } = params;
  const fullText = appendSiteLink(text);

  if (canUseWebShare()) {
    try {
      await navigator.share({ title, text: fullText });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "aborted";
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fullText);
      return "copied";
    } catch {
      /* fallback below */
    }
  }

  return "copied";
}

export function shareCardTitle(suffix: string): string {
  return `${APP_NAME} — ${suffix}`;
}
