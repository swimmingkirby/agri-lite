# Agri-Lite

Simulated environmental monitoring for small-scale and DIY growers.
Final-year dissertation project, University of Portsmouth.

The full PRD lives at [(removed)]((removed)).

## Stack

- **Next.js** (App Router, TypeScript) — frontend + API routes
- **Supabase** (Postgres + realtime) — database
- **Tailwind CSS v4** — styling
- **Recharts** — sparklines and time-series charts
- **Zod** — API input validation
- **Vercel Cron** — triggers the simulator every minute
- **Vercel** — hosting

## Local development

### 1. Create a Supabase project

1. Sign in to [supabase.com](https://supabase.com) and create a new (free-tier) project.
2. From the project dashboard, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose)

### 2. Apply the schema

Open the Supabase **SQL Editor** and run the contents of
[supabase/migrations/0001_initial.sql](supabase/migrations/0001_initial.sql).
This creates the four tables and the SELECT-only RLS policies.

### 3. Enable realtime on the readings table

In the Supabase dashboard go to **Database → Replication** and enable
realtime for the `readings` table. Without this, the dashboard will still
work but cards will refresh only on a manual page reload.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
# Then edit .env.local with values from steps 1 and a long random CRON_SECRET.
```

### 5. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Create a plot from the sidebar, then
trigger the simulator manually:

```bash
curl -X POST http://localhost:3000/api/cron/simulate \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

A reading should appear within a few seconds via the realtime channel.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel as a new project.
3. Set the four environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark **Secret**)
   - `CRON_SECRET` (mark **Secret**)
4. Deploy. Vercel reads `vercel.json` and registers the cron job at
   `/api/cron/simulate` (every minute). It automatically attaches an
   `Authorization: Bearer ${CRON_SECRET}` header.

Verify the cron from the Vercel dashboard under **Cron Jobs**.

## Project layout

```
app/
  layout.tsx                  # shell: sidebar + top nav
  page.tsx, _dashboard.tsx    # / dashboard with realtime cards
  history/                    # /history time-series charts
  settings/                   # /settings thresholds + notes
  api/                        # serverless API routes
components/                   # UI building blocks
lib/
  supabase/                   # service-role and anon clients
  simulator.ts                # random-walk reading generator
  schemas.ts                  # Zod validation
  format.ts, threshold.ts     # display + status helpers
  types.ts
supabase/migrations/          # 0001_initial.sql
(removed)         # the requirements doc
vercel.json                   # cron config
```

## Functional requirement coverage

| ID | Status |
| --- | --- |
| FR1, FR2, FR14 | `/api/cron/simulate` + `lib/simulator.ts` |
| FR3, FR5 | `readings` table + plot foreign key |
| FR4 | `/api/plots` + sidebar |
| FR6, FR10 | dashboard reading cards + threshold colour |
| FR7, FR8 | history charts + time-range selector |
| FR9 | thresholds settings form |
| FR11 | notes panel |
| FR12 | reference lines on history chart |
| FR13 | API routes deploy as Vercel serverless functions |
| FR15 | empty states on dashboard |
| NFR1–NFR8 | see PRD section 6; verified during evaluation |

## Useful commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```
