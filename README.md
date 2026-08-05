# Nippon Toyota Referral

Next.js referral platform for existing customers to refer Glanza / Hyryder leads via personalized WhatsApp links.

**Domain:** `https://refer.nippontoyota.in`

## Stack

- Next.js 16 (App Router) on Vercel
- Supabase Postgres via Prisma (`DATABASE_URL` pooler + `DIRECT_URL`)
- DoubleTick WhatsApp template API
- Vercel Cron (`* * * * *`) for the send worker

## Environment variables

Copy `.env.example` to `.env` (local) and set the same keys in the Vercel project:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase **pooler** connection string (port **6543**, often with `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase **direct** connection string (port **5432**) for migrations |
| `SESSION_SECRET` | Long random secret for admin JWT cookies |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Shared staff login |
| `NEXT_PUBLIC_APP_URL` | Public origin, e.g. `https://refer.nippontoyota.in` |
| `DOUBLETICK_API_KEY` | DoubleTick API key (`Authorization` header) |
| `DOUBLETICK_FROM` | WhatsApp Business from number |
| `CRON_SECRET` | Bearer token for `/api/cron/whatsapp` |

Without `DOUBLETICK_API_KEY` in non-production, sends are mocked (logged + delayed) so local dry-runs work.

## Local setup

```bash
cp .env.example .env
# Fill DATABASE_URL (pooler :6543) and DIRECT_URL (:5432)
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — root redirects to `/admin/login`.

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
4. Confirm `vercel.json` cron is active:

```json
{
  "crons": [{ "path": "/api/cron/whatsapp", "schedule": "* * * * *" }]
}
```

Cron calls `/api/cron/whatsapp` every minute with `Authorization: Bearer ${CRON_SECRET}`.

## WhatsApp template constant

Template name and placeholder order are **hardcoded** (no admin UI):

- File: `src/lib/doubletick.ts`
- Constant: `REFERRAL_TEMPLATE_NAME` (currently `nippon_referral_invite_v1`)
- Placeholders: `[customer name, referral URL]`

When Meta approves the live template, update `REFERRAL_TEMPLATE_NAME` to the approved name and redeploy.

## Staff workflow

1. Sign in at `/admin/login`.
2. **Customers** — upload CSV (`name,phone`); optionally **Clear test data** (password confirm) before the first real list.
3. **Send** — confirm recipient count, start blast, watch progress (polls ~2s), retry failed only.
4. **Referrals** — stats, search/model filter, export CSV via `/api/admin/referrals/export`.

Public form: `https://refer.nippontoyota.in/r/{referral_token}`.

## Scripts

```bash
npm run dev      # local server
npm run lint     # ESLint
npm run test     # Vitest unit tests
npm run build    # production build
```
