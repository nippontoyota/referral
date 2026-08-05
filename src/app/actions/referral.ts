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
    token: String(input.get("token") ?? ""),
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
  const phone = normalizePhone(parsed.data.referredPhone);
  if (!phone) {
    return { ok: false, error: "Enter a valid Indian mobile number" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('referral-send-import'))`;
      const referrer = await tx.customer.findUnique({
        where: { referralToken: parsed.data.token },
      });
      if (!referrer) throw new Error("INVALID_LINK");

      const currentCustomer = await tx.customer.findUnique({
        where: { phone },
        select: { id: true },
      });
      if (currentCustomer) throw new Error("CURRENT_CUSTOMER");

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${phone}))`;
      const prior = await tx.referral.count({ where: { referredPhone: phone } });
      const duplicateCount = prior + 1;

      await tx.referral.create({
        data: {
          referrerCustomerId: referrer.id,
          referrerName: referrer.name,
          referrerPhone: referrer.phone,
          referredName: parsed.data.referredName,
          referredPhone: phone,
          model: parsed.data.model,
          isDuplicate: prior > 0,
          duplicateCount,
        },
      });

      if (prior > 0) {
        await tx.referral.updateMany({
          where: { referredPhone: phone },
          data: { isDuplicate: true, duplicateCount },
        });
      }
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LINK") {
      return { ok: false, error: "This referral link is invalid" };
    }
    if (error instanceof Error && error.message === "CURRENT_CUSTOMER") {
      return {
        ok: false,
        error: "This person is already a Nippon Toyota customer",
      };
    }
    throw error;
  }
}
