"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";

import {
  deleteAdminSession,
  isAuthenticated,
  setAdminSession,
} from "@/lib/session";

export type LoginState = { error?: string } | null;

function matches(value: string, expected?: string): boolean {
  if (!expected) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (
    !matches(email, process.env.ADMIN_EMAIL) ||
    !matches(password, process.env.ADMIN_PASSWORD)
  ) {
    return { error: "Invalid email or password" };
  }

  await setAdminSession();
  redirect("/admin/customers");
}

export async function logout(): Promise<never> {
  await deleteAdminSession();
  redirect("/admin/login");
}

export { isAuthenticated };
