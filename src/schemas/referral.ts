import { z } from "zod";

export const MAX_FRIENDS = 5;

export const friendSchema = z.object({
  referredName: z.string().trim().min(2).max(100),
  referredPhone: z.string().trim().min(1),
});

export const referralSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(1),
  model: z.enum(["glanza", "hyryder"]),
  friends: z.array(friendSchema).min(1).max(MAX_FRIENDS),
});
