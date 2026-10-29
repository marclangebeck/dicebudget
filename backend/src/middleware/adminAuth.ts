import type { NextFunction, Request, Response } from "express";

/** True, wenn X-Admin-Key zum konfigurierten ADMIN_API_KEY passt (ohne Response). */
export function hasValidAdminKey(req: Request): boolean {
  const key = process.env.ADMIN_API_KEY?.trim() || "";
  if (!key) return false;
  const header = req.headers["x-admin-key"];
  const provided = typeof header === "string" ? header.trim() : "";
  return Boolean(provided && provided === key);
}

export function requireAdminKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = process.env.ADMIN_API_KEY?.trim() || "";
  if (!key) {
    res.status(503).json({
      error: "Admin-API nicht konfiguriert (ADMIN_API_KEY fehlt auf dem Server).",
    });
    return;
  }
  if (!hasValidAdminKey(req)) {
    res.status(401).json({
      error:
        "Admin-Schlüssel fehlt oder ist falsch. Server-Bereinigung und Siege/Diff brauchen den App-Admin-Key (nur Admin-iOS-Build / Mac-.env.production, nicht öffentliches Web).",
    });
    return;
  }
  next();
}
