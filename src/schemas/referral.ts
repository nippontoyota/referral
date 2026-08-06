import { z } from "zod";

export const referralSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(1),
  referredName: z.string().trim().min(2).max(100),
  referredPhone: z.string().trim().min(1),
  model: z.enum(["glanza", "hyryder"]),
});
