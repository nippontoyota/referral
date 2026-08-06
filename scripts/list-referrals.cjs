const { PrismaClient } = require("@prisma/client");

const p = new PrismaClient();

p.referral
  .findMany({ orderBy: { createdAt: "desc" } })
  .then((rows) => {
    console.log(JSON.stringify(rows, null, 2));
    console.error(`count: ${rows.length}`);
  })
  .finally(() => p.$disconnect());
