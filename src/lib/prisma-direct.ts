import { PrismaClient } from "@prisma/client";

/** Session/direct DB client for long imports (pooler transaction mode breaks interactive tx). */
export function createDirectPrisma() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL is not configured");
  return new PrismaClient({
    datasources: { db: { url } },
  });
}
