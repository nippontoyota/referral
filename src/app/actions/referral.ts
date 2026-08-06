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

  const names = formData.getAll("referredName").map((v) => String(v));
  const phones = formData.getAll("referredPhone").map((v) => String(v));
  if (names.length === 0 || names.length !== phones.length) {
    return { ok: false, error: "Please check the submitted details" };
  }

  const parsed = referralSchema.safeParse({
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    friends: names.map((referredName, i) => ({
      referredName,
      referredPhone: phones[i] ?? "",
      model: String(formData.get(`referredModel-${i}`) ?? ""),
    })),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the submitted details" };
  }

  const customerPhone = normalizePhone(parsed.data.customerPhone);
  if (!customerPhone) {
    return { ok: false, error: "Enter a valid 10-digit Indian mobile number" };
  }

  const friends: {
    referredName: string;
    referredPhone: string;
    model: "glanza" | "hyryder";
  }[] = [];
  const seen = new Set<string>();

  for (const friend of parsed.data.friends) {
    const referredPhone = normalizePhone(friend.referredPhone);
    if (!referredPhone) {
      return {
        ok: false,
        error: "Enter valid 10-digit Indian mobile numbers for each person",
      };
    }
    if (referredPhone === customerPhone) {
      return {
        ok: false,
        error: "Your mobile and their mobile must be different numbers",
      };
    }
    if (seen.has(referredPhone)) {
      return {
        ok: false,
        error: "Each referred person must have a different mobile number",
      };
    }
    seen.add(referredPhone);
    friends.push({
      referredName: friend.referredName,
      referredPhone,
      model: friend.model,
    });
  }

  try {
    await prisma.$transaction(
      friends.map((friend) =>
        prisma.referral.create({
          data: {
            customerName: parsed.data.customerName,
            customerPhone,
            referredName: friend.referredName,
            referredPhone: friend.referredPhone,
            model: friend.model,
          },
        }),
      ),
    );
    return { ok: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: "One of these people has already been referred",
      };
    }
    return { ok: false, error: "Could not submit. Please try again." };
  }
}
