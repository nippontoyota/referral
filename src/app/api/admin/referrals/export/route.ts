import { escapeCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/session";

const HEADER = [
  "referrer_name",
  "referrer_phone",
  "referred_name",
  "referred_phone",
  "model",
  "is_duplicate",
  "duplicate_count",
  "created_at",
];

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let cursor: string | undefined;
  let finished = false;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (finished) return;
      const referrals = await prisma.referral.findMany({
        take: 500,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          referrerName: true,
          referrerPhone: true,
          referredName: true,
          referredPhone: true,
          model: true,
          isDuplicate: true,
          duplicateCount: true,
          createdAt: true,
        },
      });

      const lines = referrals.map((referral) =>
        [
          referral.referrerName,
          referral.referrerPhone,
          referral.referredName,
          referral.referredPhone,
          referral.model,
          referral.isDuplicate,
          referral.duplicateCount,
          referral.createdAt,
        ]
          .map(escapeCsv)
          .join(","),
      );
      const prefix = cursor ? "" : `${HEADER.join(",")}\r\n`;
      controller.enqueue(encoder.encode(`${prefix}${lines.join("\r\n")}${lines.length ? "\r\n" : ""}`));

      if (referrals.length < 500) {
        finished = true;
        controller.close();
      } else {
        cursor = referrals.at(-1)?.id;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="nippon-toyota-referrals.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
