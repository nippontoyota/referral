"use server";

import { Prisma } from "@prisma/client";

import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { referralSchema } from "@/schemas/referral";

export type ReferralResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitReferral(
  _prev: ReferralResult | null,
  formData: FormData,
): Promise<ReferralResult> {
  // Honeypot: bots fill hidden "website"; pretend success.
  if (String(formData.get("website") ?? "")) return { ok: true };

  const parsed = referralSchema.safeParse({
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    referredName: String(formData.get("referredName") ?? ""),
    referredPhone: String(formData.get("referredPhone") ?? ""),
    model: String(formData.get("model") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the submitted details" };
  }

  const customerPhone = normalizePhone(parsed.data.customerPhone);
  const referredPhone = normalizePhone(parsed.data.referredPhone);
  if (!customerPhone || !referredPhone) {
    return { ok: false, error: "Enter valid 10-digit Indian mobile numbers" };
  }
  if (customerPhone === referredPhone) {
    return {
      ok: false,
      error: "Your mobile and their mobile must be different numbers",
    };
  }

  try {
    await prisma.referral.create({
      data: {
        customerName: parsed.data.customerName,
        customerPhone,
        referredName: parsed.data.referredName,
        referredPhone,
        model: parsed.data.model,
      },
    });
    return { ok: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "This person has already been referred",
      };
    }
    return { ok: false, error: "Could not submit. Please try again." };
  }
}
