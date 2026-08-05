import { randomBytes } from "node:crypto";

export function createReferralToken(): string {
  return randomBytes(16).toString("base64url");
}
