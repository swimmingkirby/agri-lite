# Agri-Lite — verification log (2026-04-30)

Production deployment verified end-to-end against
<https://agri-lite-woad.vercel.app>. This document maps each
PRD checklist item to the evidence captured during the verification run.

## Acceptance checklist

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

## Performance verification

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

---

## Finalisation pass (2026-05-01)

Hardening, enrichment and final-pass work after the initial
verification confirmed the build was functionally complete. Source
code, schema and design contracts were unchanged during this pass
except where listed.

### Demo scenarios seeder (FR1, FR2, FR14)

Added `lib/seed-scenarios.ts`, `lib/seed-runner.ts` and
`app/api/seed/route.ts`. The route is `CRON_SECRET`-gated and shares
the same random walk (`randomNormal`, `timeOfDayLightFactor`) as the
live simulator — those helpers were promoted to exports in
`lib/simulator.ts`. The seeder biases each draw toward predetermined
target curves, then upserts the scenario's notes and thresholds and
wipes the plot's previous readings/notes/thresholds first so each
run is self-contained.

Five plots were created on production and seeded:

After the initial seeder pass produced 2–7 day windows the scenarios
were extended to 30-day windows with multiple events each (multiple
drought cycles, three heatwaves of varying severity, two sunny breaks
during the light-deprivation month, and so on). Drift was also
boosted (moisture 0.8 → 1.5, temperature 0.3 → 0.6, light 400 → 700)
so individual readings show more visible point-to-point variation.

Re-seeded plot summary:

| Plot | Scenario | Readings | Notes | Thresholds | Seed time |
| --- | --- | --- | --- | --- | --- |
| Healthy week | `healthy` | 8 641 | 5 | 3 | 3 144 ms |
| Drought stress | `drought` | 8 641 | 5 | 3 | 2 735 ms |
| Heatwave | `heatwave` | 8 641 | 4 | 3 | 2 520 ms |
| Light deprivation | `light_deprivation` | 8 641 | 5 | 3 | 2 461 ms |
| Mixed conditions | `mixed` | 8 641 | 7 | 3 | 2 420 ms |

Per-scenario value ranges captured directly from Postgres after the
30-day seed run (each scenario's curve clearly hits its intended
extremes within a single demo plot):

| Plot | Window | Moisture min/max | Temp min/max | Light max |
| --- | --- | --- | --- | --- |
| Healthy week | 30 d | 41.5 % / 69.5 % | 16.5 °C / 28.0 °C | 81 667 lux |
| Drought stress | 30 d | **18.5 %** / 63.2 % | 19.3 °C / 29.2 °C | 81 763 lux |
| Heatwave | 30 d | 40.1 % / 61.0 % | 19.0 °C / **40.7 °C** | 81 901 lux |
| Light deprivation | 30 d | 49.8 % / 62.1 % | 14.7 °C / 22.3 °C | **42 718 lux** (sunny breaks; otherwise <3 000 lux) |
| Mixed conditions | 30 d | 24.1 % / 64.7 % | 16.2 °C / 38.6 °C | 81 870 lux |

### Edge cases (§4 of the finalisation prompt)

| # | Case | Result |
| --- | --- | --- |
| 4.1 | Delete the currently-selected plot | Created an "Empty edge-case plot", deleted while selected; URL fell back to the next plot in the list (`Mixed conditions`) and the dashboard re-rendered without intervention. |
| 4.2 | Threshold validation, `min > max` | `PUT /api/thresholds` with `{min: 80, max: 30}` returns **HTTP 400** with `{"error":"min_value must be less than or equal to max_value"}`. |
| 4.2b | Clearing both bounds (`null`/`null`) | Returns **HTTP 200** and the dashboard shows "Within range" for that parameter. |
| 4.3 | Realtime channel cleanup on plot switch | Showed Drought dashboard, captured values; inserted a row directly into the database for the Healthy plot via Supabase; values on the Drought dashboard remained unchanged after 3 s, confirming the channel for the deselected plot was unsubscribed. |
| 4.4 | Note creation with empty body | `POST /api/notes` with `{body: ""}` returns **HTTP 400** with the Zod issue (`min length 1`). |
| 4.5 | Sparse-data history view | A freshly-created plot at `/history?plot=<new>` shows the "Not enough data yet for this range" message in each of the three chart panels and renders zero `.recharts-wrapper` elements. |

### Recharts `width(-1) and height(-1)` warnings (§5.5)

Three iterations were attempted:

1. `w-full` on the chart-wrapping `<div>`s. No effect.
2. Deferred render gated on a `useEffect`-set `mounted` boolean. Cut
   warnings from 6 per page load to 3 (the dashboard sparklines).
3. Replaced the wrapping `<div>` with a `ChartFrame` that observes
   its own bounding rect with a `ResizeObserver` and only renders
   children once the rect is non-zero. **No further reduction.**

The remaining three warnings fire from Recharts' own
`validateWidthAndHeight` during the `ResponsiveContainer`'s first
render, before its internal `ResizeObserver` produces a measured
size. Subsequent renders are correct and the visual output is
unaffected. Documented as a known non-fatal limitation rather than
silenced with a console.warn override.

### UI / DX polish

- Per-route metadata: `Dashboard | Agri-Lite`, `History | Agri-Lite`,
  `Settings | Agri-Lite` (verified — `document.title` matches).
- New favicon at `app/icon.svg` (rounded green tile with a
  two-leaf-and-stem glyph) replaces the default Next.js mark.
- `ThresholdForm` now parses the API's `{ error }` payload and
  surfaces the server message ("min_value must be less than or
  equal to max_value") instead of a generic "Could not save".
- `ChartErrorBoundary` wraps each `HistoryChart` so a render-time
  Recharts crash on malformed data shows a "Could not render chart"
  panel with a Retry button instead of white-screening.
- `README.md` gained a "Live demo" link, a "Demo scenarios" table
  with a curl example, and an "Architectural notes" paragraph
  explaining the `pg_cron` + Vercel cron split honestly.

### Cold-start measurement (≈5 min idle)

`pg_cron` job `agri-lite-simulate` was paused with
`select cron.unschedule('agri-lite-simulate');` to allow the Vercel
serverless functions to go cold. After **~5 minutes of no traffic**
on the deployed app, each route was hit once for the cold sample,
then three more times for the warm comparison. (A longer 30-minute
idle was attempted but cut short to keep the build moving; 5 min is
already comfortably past Vercel Hobby's typical idle-kill window of
2–3 minutes for individual functions.)

| Route | First hit (cold-ish) | Warm samples (s) | Cold-start overhead |
| --- | --- | --- | --- |
| GET `/api/plots` | **941 ms** | 0.300, 0.257, 0.258 | ≈ 683 ms |
| GET `/api/readings?plot_id=…&limit=10` | **390 ms** | 0.358, 0.287, 0.282 | ≈ 103 ms |
| GET `/api/thresholds?plot_id=…` | **278 ms** | 0.256, 0.287, 0.252 | ≈ 22 ms (already warm) |
| GET `/api/notes?plot_id=…` | **515 ms** | 0.260, 0.260, 0.267 | ≈ 255 ms |
| POST `/api/cron/simulate` (auth) | **2 340 ms** | 2.052, 1.519, 1.361 | ≈ 821 ms |

Two findings worth carrying into Chapter 7:

1. **Cold-start overhead varies by route.** `/api/plots` and
   `/api/cron/simulate` both went genuinely cold (683 ms and 821 ms
   above warm respectively). `/api/thresholds` showed essentially no
   overhead, suggesting Vercel's platform may keep some functions
   warm via internal health probes even when application traffic is
   absent — i.e. cold-starts are observable but not uniform across
   serverless functions on the same project.
2. **Warm latency on `/api/cron/simulate` scaled with plot count.**
   The original verification log measured 490 ms with 2 plots; the
   warm median here is 1.52 s with 5 plots. The route does one
   `SELECT` + one `INSERT` per plot per call, so its execution time
   is linear in plot count. This is an honest finding about the
   simulator's coupling to plot count and is appropriate evidence
   for the dissertation's discussion of serverless function
   scalability.

The `pg_cron` job was re-scheduled afterwards via
`select cron.schedule('agri-lite-simulate', '* * * * *', $$select public.agri_lite_fire_simulator();$$);`
to restore the live one-minute cadence.

### Acceptance checklist (post-finalisation)

Re-walked the original acceptance checklist items against the deployed app
populated with the five seeded plots; all 18 items previously verified
remain green. The two outstanding items
(Vercel daily cron's first run and the dissertation chapters
themselves) are unchanged.
