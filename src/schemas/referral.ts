import { z } from "zod";

export const referralSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(10).max(30),
  referredName: z.string().trim().min(2).max(100),
  referredPhone: z.string().trim().min(10).max(30),
  model: z.enum(["glanza", "hyryder"]),
  website: z.string().optional().default(""),
});

export type ReferralInput = z.input<typeof referralSchema>;
