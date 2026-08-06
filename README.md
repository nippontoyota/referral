# Nippon Toyota Referral

One public form that stores Glanza / Hyryder referrals in Supabase.

## Production

- https://referral-black.vercel.app
- Vercel project: `nippontoyotas-projects/referral`
- Supabase project: `pcydxlfxjslhafxgnlci`

## Setup

Set `DATABASE_URL` to the Supabase pooler and `DIRECT_URL` to its direct
connection, then run:

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

Checks: `npm run lint`, `npm test`, `npm run build`.

## Inspect referrals (terminal)

GUI:

```bash
npx prisma studio
```

List all rows (PowerShell):

```powershell
@'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.referral.findMany({ orderBy: { createdAt: "desc" } })
  .then((rows) => console.log(JSON.stringify(rows, null, 2)))
  .finally(() => p.$disconnect());
'@ | node
```

Count:

```powershell
@'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.referral.count().then(console.log).finally(() => p.$disconnect());
'@ | node
```
