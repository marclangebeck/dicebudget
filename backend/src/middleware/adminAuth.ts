import type { NextFunction, Request, Response } from "express";

export function requireAdminKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = process.env.ADMIN_API_KEY?.trim() || "";
  if (!key) {
    res.status(503).json({ error: "Admin API not configured" });
    return;
  }
  const header = req.headers["x-admin-key"];
  const provided = typeof header === "string" ? header.trim() : "";
  if (!provided || provided !== key) {
    res.status(401).json({ error: "Invalid or missing admin API key" });
    return;
  }
  next();
}
