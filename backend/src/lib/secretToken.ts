import { randomBytes } from "crypto";

export function generateSecretToken(): string {
  return randomBytes(24).toString("hex");
}
