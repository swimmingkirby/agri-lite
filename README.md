# Agri-Lite

Simulated environmental monitoring for small-scale and DIY growers.
Final-year dissertation project, University of Portsmouth.

**Live demo:** <https://agri-lite-woad.vercel.app>

Verification log: [docs/verification.md](docs/verification.md).

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
4. Deploy. Vercel reads `vercel.json` and registers the daily cron job at
   `/api/cron/simulate`. It automatically attaches an
   `Authorization: Bearer ${CRON_SECRET}` header.

### Why the cron is daily, not every minute

The PRD asks for a once-per-minute simulator (FR1). Vercel's free
**Hobby** plan caps cron jobs at one run per day, so `vercel.json`
schedules `/api/cron/simulate` once daily as the architectural marker
that the API works under Vercel's cron. The actual every-minute
firing in production is driven by a Supabase `pg_cron` job that POSTs
to the same endpoint. This keeps NFR7 (free-tier only) intact while
still meeting FR1's cadence.

To wire the Supabase side after deploying:

1. Enable the `pg_cron` and `pg_net` extensions on your Supabase
   project (Database → Extensions).
2. Apply [supabase/migrations/0002_pg_cron_simulator.sql](supabase/migrations/0002_pg_cron_simulator.sql)
   in the SQL Editor — this creates a `SECURITY DEFINER` function that
   reads the bearer token from Supabase Vault and POSTs the deployed
   `/api/cron/simulate` URL on a one-minute schedule.
3. Insert your `CRON_SECRET` into Vault as the secret named
   `agri_lite_cron_secret`:

   ```sql
   select vault.create_secret(
     '<your CRON_SECRET>',
     'agri_lite_cron_secret',
     'Bearer token used by the Agri-Lite simulator pg_cron job.'
   );
   ```

4. Edit the URL inside the function body to point at your own deployed
   Vercel URL.

Verify the Vercel daily cron from the Vercel dashboard under **Cron
Jobs**, and the Supabase minutely cron via `select * from cron.job`.

## Demo scenarios

Five biased random walks live alongside the live simulator so the
dashboard, history view, threshold colours, and note markers can be
exercised against meaningful data on demand. They are openly named
demo aids — not a substitute for the live simulator and not real
sensor data.

| Scenario | Window | What it shows |
| --- | --- | --- |
| `healthy` | 7 days | Baseline; no warnings, no alerts |
| `drought` | 4 days | Moisture falls 60 %→25 %, then recovers after a "watered the plot" note |
| `heatwave` | 2 days | 6-hour spike to ~38 °C on day two with a "vents open" note at the peak |
| `light_deprivation` | 5 days | Light pinned below the configured minimum |
| `mixed` | 7 days | Drought, recovery, heatwave, two cloudy days, four notes |

Trigger one with curl:

```bash
curl -X POST https://agri-lite-woad.vercel.app/api/seed \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"plot_id":"<plot uuid>","scenario":"drought"}'
```

The endpoint wipes the target plot's existing readings, notes and
thresholds before seeding so each scenario stays self-contained. The
live simulator continues adding new readings every minute on top of
the seeded history.

## Architectural notes

- **Cron cadence.** Vercel Hobby caps cron jobs at one run per day, so
  `vercel.json` is configured at `0 6 * * *` as the architectural
  marker that the API works under Vercel cron. The actual one-minute
  cadence required by FR1 is driven by a Supabase `pg_cron` job that
  POSTs the same `/api/cron/simulate` endpoint. The bearer token lives
  in Supabase Vault, not inline in any cron definition.
- **No authentication.** Single-user demo by deliberate scope decision
  (deliberate scope decision). The browser uses the Supabase `anon` key, which has only
  `SELECT` policies — all writes go through Next.js API routes that
  use the service-role key on the server.

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
docs/verification.md          # post-build verification log
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
| NFR1–NFR8 | verified during evaluation |

## Useful commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```
