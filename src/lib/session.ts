import "server-only";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24;

function key(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key());
}

export async function verifySessionToken(
  token?: string,
): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

export async function setAdminSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteAdminSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(await verifySessionToken(token));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
}
