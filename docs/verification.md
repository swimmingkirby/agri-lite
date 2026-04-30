# Agri-Lite — verification log (2026-04-30)

Production deployment verified end-to-end against
<https://agri-lite-woad.vercel.app>. This document maps each
PRD checklist item to the evidence captured during the verification run.

## Acceptance checklist (PRD section 12)

| # | Item | Tag | Result | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Create a plot from the UI | FR4 | ✅ | Empty state → `Create plot` button → modal → `Tomato bed` appears in sidebar. New URL `/?plot=db4ceee9…`. |
| 2 | Readings appear via cron every minute | FR1 | ✅ | `pg_cron` job `agri-lite-simulate` active; `inserted: 2` returned per fire (one per plot). |
| 3 | Readings change smoothly | FR14 | ✅ | Successive readings drift within `RANGES.drift` (e.g. 52.72 → 52.60 → 50.6 → 48.91 over a minute window). |
| 4 | Readings stay within plausible ranges | FR2 | ✅ | All sample readings within the configured min/max in `lib/simulator.ts`. |
| 5 | Dashboard shows latest readings, updates live | FR6 | ✅ | Browser session captured DOM values changing from `48.9 % / 19.7 °C` to `47.9 % / 19.8 °C` **without reload** after a manual simulator fire. |
| 6 | Switch between plots, dashboard updates | FR4 | ✅ | Sidebar links route between `Tomato bed` and `Herb shelf`; values + thresholds reload accordingly. |
| 7 | Historical charts render all 3 parameters | FR7 | ✅ | `document.querySelectorAll('.recharts-wrapper').length === 3`. Three `<h3>` titles rendered: moisture/temperature/light. |
| 8 | Time-range selector works | FR8 | ✅ | Clicking `1 hour` toggles active class to that pill; point counts re-fetch (38 points after switch). |
| 9 | Set thresholds, dashboard shows warnings | FR9, FR10 | ✅ | Three colour states observed simultaneously on Tomato bed: moisture **`bg-amber-50 text-amber-700`** (warn), temperature **`bg-red-50 text-red-700`** (alert), light **`bg-green-50 text-green-700`** (ok). |
| 10 | Add a note, appears on history chart | FR11, FR12 | ✅ | "Initial planting" note created via API; rendered as `recharts-reference-line-line` × 3 (one per chart) with the note body as label. |
| 11 | Empty state when no plots exist | FR15 | ✅ | After deleting all plots, `/` shows `Welcome to Agri-Lite` + `Create plot` button. |
| 12 | Empty state when plot has no readings | FR15 | ✅ | Fresh plot created at 23:09:27, dashboard at `?plot=<new-uuid>` shows `No readings yet — The simulator runs every minute, check back shortly.` |
| 13 | Phone-sized viewport works | NFR4 | ✅ | Window resized; sidebar collapses to `hidden`, hamburger button appears with `aria-controls="agri-sidebar"` and toggles `aria-expanded`; reading cards stack to one column; `documentElement.scrollWidth <= clientWidth` (no horizontal overflow). |
| 14 | Database not directly writable from browser | NFR8 | ✅ | RLS policies in `0001_initial.sql` only grant `SELECT` to anon. The browser uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`; all writes route through API routes that use the service-role key on the server. |
| 15 | API calls < 500ms warm | NFR1 | ✅ | Median of 5 warm samples each: GET /plots **257 ms**, GET /readings (limit 1000) **278 ms**, GET /thresholds **261 ms**, GET /notes **265 ms**, POST /cron/simulate **490 ms**. |
| 16 | Lighthouse FCP < 2 s | NFR2 | ✅ | Headless Lighthouse (performance category): **FCP 939 ms**, performance score 94/100, CLS 0, TBT 50 ms. |
| 17 | Deployed and accessible at a Vercel URL | FR13 | ✅ | <https://agri-lite-woad.vercel.app>. Smoke test: `curl GET /api/plots` → 200 with JSON; `POST /api/cron/simulate` (no auth) → 401; with auth → 200. |
| 18 | Cron firing on the deployed app | FR1 | ✅ | Two layers: (a) `vercel.json` registers a daily Vercel Cron at `0 6 * * *`. (b) Supabase `cron.job` row `agri-lite-simulate` schedule `* * * * *`, active=true; produced rows visible in the `readings` table at one-minute intervals. |
| 19 | Repository on GitHub | — | ✅ | <https://github.com/swimmingkirby/agri-lite> (public). |
| 20 | No login or signup anywhere | — | ✅ | No auth UI; no Supabase Auth client imported anywhere; no `/login` or `/signup` routes. |

## Performance (PRD section 11.19–21)

### NFR1 — warm API latency

5 sequential warm samples per route, median used.

| Route | Samples (ms) | Median | Avg |
| --- | --- | --- | --- |
| GET `/api/plots` | 258, 259, 257, 257, 249 | **257 ms** | 256 ms |
| GET `/api/readings?limit=1000` | 258, 278, 302, 278, 262 | **278 ms** | 275 ms |
| GET `/api/thresholds` | 260, 257, 261, 263, 363 | **261 ms** | 280 ms |
| GET `/api/notes` | 265, 273, 251, 269, 255 | **265 ms** | 262 ms |
| POST `/api/cron/simulate` | 509, 514, 485, 490, 478 | **490 ms** | 495 ms |

All read routes well under the 500 ms NFR1 ceiling. The cron route is at
the limit because it does one `SELECT` of plots plus, for each plot, a
last-reading lookup and an insert (so it scales linearly with plot count
— 2 plots in the demo).

### NFR2 — Lighthouse (mobile, headless Chrome)

| Metric | Value | Target |
| --- | --- | --- |
| First Contentful Paint | **939 ms** | < 2 s |
| Largest Contentful Paint | 3.1 s | — |
| Speed Index | 2.1 s | — |
| Total Blocking Time | 50 ms | — |
| Cumulative Layout Shift | 0 | — |
| Performance score | 94 / 100 | — |

### Cold-start latency (Chapter 7 evidence)

Probed `/api/notes` after ~10 min of no traffic on that route (only the
cron route is hit by `pg_cron`).

| Hit | TTFB |
| --- | --- |
| 1 (cold) | **351 ms** |
| 2 (warm) | 254 ms |
| 3 (warm) | 251 ms |
| 4 (warm) | 267 ms |
| 5 (warm) | 251 ms |

Cold-start overhead ≈ **95 ms** above the warm median. Note that
Vercel's platform appears to keep the runtime warm aggressively;
absolute cold (multiple-hours idle) was not reachable during the
verification window because `pg_cron` keeps the simulator route warm
continuously.

## Threshold colour state matrix

The three states (`ok` / `warn` / `alert`) were forced simultaneously
on the Tomato bed plot during testing and the rendered DOM classes
verified:

| State | Trigger | DOM class signature |
| --- | --- | --- |
| ok | no threshold or value within range | `bg-green-50 text-green-700 ring-1 ring-green-200` |
| warn | within 10% of either bound | `bg-amber-50 text-amber-700 ring-1 ring-amber-200` |
| alert | outside the configured range | `bg-red-50 text-red-700 ring-1 ring-red-200` |

## Deviations from PRD captured during verification

1. **Cron cadence (Vercel Hobby)** — Vercel Hobby caps cron jobs at one
   run per day, so `vercel.json` runs daily as the architectural marker
   that the API works under Vercel cron. The actual one-minute cadence
   (FR1) is driven by a Supabase `pg_cron` job that POSTs to the same
   `/api/cron/simulate` endpoint, with the bearer token in Supabase
   Vault rather than inline. Documented in `README.md` and
   `supabase/migrations/0002_pg_cron_simulator.sql`.

## Out-of-scope items

- The dissertation document itself — author's task.
- A confirmed Vercel daily cron firing — first scheduled run is at
  the next 06:00 UTC after deploy. Visible in the Vercel dashboard
  under **Cron Jobs** thereafter.
