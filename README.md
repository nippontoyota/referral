# Nippon Toyota Referral

Next.js referral platform for existing customers to refer Glanza / Hyryder leads.

## Stack

- Next.js (App Router) on Vercel
- Supabase Postgres (Prisma)
- DoubleTick WhatsApp templates

## Local setup

```bash
cp .env.example .env
# Set DATABASE_URL (Supabase pooler :6543) and DIRECT_URL (:5432)
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
