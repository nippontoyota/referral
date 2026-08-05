"use server";

import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import {
  referralSchema,
  type ReferralInput,
} from "@/schemas/referral";

export type ReferralResult =
  | { ok: true }
  | { ok: false; error: string };

function toInput(input: ReferralInput | FormData): ReferralInput {
  if (!(input instanceof FormData)) return input;
  return {
    customerName: String(input.get("customerName") ?? ""),
    customerPhone: String(input.get("customerPhone") ?? ""),
    referredName: String(input.get("referredName") ?? ""),
    referredPhone: String(input.get("referredPhone") ?? ""),
    model: String(input.get("model") ?? "") as ReferralInput["model"],
    website: String(input.get("website") ?? ""),
  };
}

export async function submitReferral(
  input: ReferralInput | FormData,
): Promise<ReferralResult> {
  const raw = toInput(input);
  if (raw.website) return { ok: true };

  const parsed = referralSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please check the submitted details" };
  }
  const customerPhone = normalizePhone(parsed.data.customerPhone);
  const referredPhone = normalizePhone(parsed.data.referredPhone);
  if (!customerPhone || !referredPhone) {
    return { ok: false, error: "Enter valid 10-digit Indian mobile numbers" };
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
  } catch {
    return { ok: false, error: "Could not submit. Please try again." };
  }
}
