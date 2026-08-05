# Nippon Toyota Referral

One public form that stores Glanza / Hyryder referrals in Supabase.

## Stack

- Next.js 16
- Prisma + Supabase Postgres
- Vercel

## Production

- Live: https://referral-black.vercel.app
- Vercel: `nippontoyotas-projects/referral` (GitHub connected)
- Supabase: `pcydxlfxjslhafxgnlci`

## Environment variables

Copy `.env.example` to `.env` (local) and set the same keys in the Vercel project:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase **pooler** connection string (port **6543**, often with `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase **direct** connection string (port **5432**) for migrations |

## Local setup

```bash
cp .env.example .env
# Fill DATABASE_URL (pooler :6543) and DIRECT_URL (:5432)
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase + migrations

1. Create a Supabase project and copy the connection strings into `DATABASE_URL` / `DIRECT_URL`.
2. Deploy schema with:

```bash
npx prisma migrate deploy
```

Use `DIRECT_URL` for migrate; the app runtime uses the pooler `DATABASE_URL`.

## Vercel deploy

1. Import the GitHub repo `nippontoyota/referral` into Vercel.
2. Set all environment variables listed above (Production + Preview as needed).
3. Attach custom domain `refer.nippontoyota.in`.

## Scripts

```bash
npm run dev      # local server
npm run lint     # ESLint
npm run test     # Vitest unit tests
npm run build    # production build
```
