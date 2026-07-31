import type { NextFunction, Request, Response } from "express";

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
  const header = req.headers["x-admin-key"];
  const provided = typeof header === "string" ? header.trim() : "";
  if (!provided || provided !== key) {
    res.status(401).json({
      error:
        "Admin-Schlüssel fehlt oder ist falsch. Server-Bereinigung und Siege/Diff brauchen den App-Admin-Key (Web-Build bzw. .env.production).",
    });
    return;
  }
  next();
}
