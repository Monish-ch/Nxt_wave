# NxtWave AI Workshop Growth Engine

> **ACQUIRE → REGISTER → REFER → TRACK → OPTIMIZE**
> A working growth engine for a free online workshop — *"Build Your First AI Project in 60 Minutes"* — built to prove that every registered student can become a distribution channel.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748) ![Recharts](https://img.shields.io/badge/Recharts-2.15-888888)

---

## 1. Project Overview

This is a **growth challenge prototype**: get 500 final-year engineering students to register for a free 60-minute AI workshop in 7 days with a ₹2,000 budget.

Instead of stopping at a landing page, this project builds the **full growth loop as a working product**:

1. Students land on a conversion-focused page (with a **live seat counter**)
2. They register through a validated form that captures **source + UTM attribution**
3. Every registrant instantly receives a **unique referral code** (`NXW-MONISH42`)
4. Sharing happens through **one-tap WhatsApp** with a correctly encoded invite message
5. Friends register through `/r/[code]` links — attribution is automatic
6. Referrers watch a **live milestone dashboard** (1 / 3 / 5 / 10 referral rewards) and a **public campus leaderboard** with competition ranking
7. The **admin console** tracks the entire funnel in real time — with **CSV export** for the campaign team

The working asset *is* the growth strategy.

## 2. The Growth Problem

| Constraint | Value |
|---|---|
| Target | 500 registrations |
| Duration | 7 days |
| Budget | ₹2,000 (~$24) |
| Audience | Final-year engineering students (Telangana/AP focus) |
| Team | 1 person |

Paid ads can't buy 500 students with ₹2,000 (that's ₹4/register at best — CPMs for students sit higher). The only lever that works at this budget is **making the product distribute itself**: every student who registers is one WhatsApp message away from 40–80 classmates. The engine's job is to make that message frictionless and *rewarded*.

## 3. Strategy (channels & why)

1. **Campus ambassadors (~200 registrations)** — 10–15 student influencers across target colleges get personal codes (`RAHUL01`). They care about the certificate + internship fast-track milestone.
2. **College club partnerships (~150)** — CSE/IT/AI club WhatsApp groups and GDSC chapters share `CSECLUB01`-style codes; the club gets a "community partner" shoutout.
3. **WhatsApp community groups (~100)** — forwardable message + link designed for group dynamics (the share message is pre-written and encoded).
4. **Student referrals (~50 incremental)** — the built-in engine: every registrant becomes a channel, milestone rewards create a reason to share *now*.

The product demonstrates channel #4 working end-to-end, and the admin dashboard measures channels #1–3 (`?source=…&code=…` attribution).

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router (Vercel-compatible)                   │
│                                                             │
│  Public:            /  /register  /success  /r/[code]  /leaderboard │
│  Channel owners:    /ambassador/[code]   (public, read-only board)   │
│  Admin (auth):      /admin  /admin/registrations  /admin/sources/[code] │
│                                                             │
│  API:  POST /api/register        GET /api/referral/[code]   │
│        GET /api/public/stats     GET /api/colleges (typeahead)│
│        POST /api/lookup          POST /api/admin/login      │
│        GET /api/admin/registrations  POST /api/admin/logout │
│        POST /api/admin/demo-reset                            │
│        POST /api/admin/normalize-colleges (hygiene sweep)    │
│        GET /api/admin/sources + /api/admin/sources/[code]    │
│        GET /api/admin/sources/[code]/export (channel CSV)    │
│        GET/POST /api/admin/nudges  POST /api/admin/nudges/bulk │
│        POST /api/admin/nudges/snooze (outreach hygiene)      │
│        GET /api/admin/digests  POST /api/admin/digests/log   │
│        GET /api/qr/[code] + /api/qr/link                     │
│                                                             │
│  PWA:  /manifest.webmanifest (app/manifest.ts)               │
│        public/sw.js (network-first SW) + /icons/icon-*.png   │
│                                                             │
│  Proxy (Next 16, ex-middleware):                             │
│        /admin/** + /api/admin/** session guard               │
├─────────────────────────────────────────────────────────────┤
│  Data layer: Prisma ORM                                     │
│  • local demo → SQLite (zero setup)                         │
│  • production → PostgreSQL / Supabase (change DATABASE_URL) │
│  • supabase/schema.sql provided for raw-SQL deployments     │
└─────────────────────────────────────────────────────────────┘
```

**Key design choices**

- **One data layer, two databases** — the same Prisma schema runs on SQLite (local demo) and Postgres (Supabase in production). No mock layer in the request path; demo mode is a seeded database, so *every metric is computed live, never hardcoded*.
- **Edge-compatible admin auth** — HMAC-signed session cookie via Web Crypto, verified in both the proxy (Next 16 convention, formerly middleware) and API routes.
- **Shared validation** — one Zod schema (`lib/validation.ts`) powers client inline errors *and* authoritative server validation.
- **Server components where data is read** (landing, `/r/[code]`) and client components where interaction lives (forms, dashboard) — no self-fetching.

## 5. Features

**Public funnel**
- Landing page with live 500-target progress, campaign day indicator, referral seat math — plus a **live pace urgency strip**: when the rolling average finishes short of target, a pulsing rose banner shows "rolling at X/day, need N/day" (and a "Goal reached 🎉" pill once the target is hit); the social-proof line leads with "**N registered today**"
- Registration form: full name, email, WhatsApp, college, branch, graduation year, source — all validated with helpful inline messages. The **college field has a typeahead** (`GET /api/colleges`) suggesting canonical spellings already on file with popularity badges ("31 registered"), keyboard-navigable listbox — data hygiene that keeps the college standings accurate
- Duplicate email protection with graceful recovery (auto-redirect to their existing dashboard)
- UTM + source capture: `?source=ambassador&code=RAHUL01`, `?source=club&code=CSECLUB01`, `?source=whatsapp`, `?utm_source=…`
- Referral landing pages preserve the code and personalize the pitch ("Kiran invited you")
- Success page = referral dashboard: code display, copy (code/link/message), WhatsApp share, live referral count, milestone progress bar, **live competition rank** ("Ranked #7 of 27 referrers"), reward ladder, and a **QR poster code** (download as SVG or **print-ready 1024px PNG** — rendered client-side via canvas — for notice boards, print shops & WhatsApp status). Plus a **"Your campus" competition panel**: the student's college rank (#N of M campuses), a progress bar to the nearest college above ("3 registrations put your campus above MVSR (26)"), per-college referral stats and its best masked referrer — the club-competition angle aimed at the moment of maximum motivation. And a **referral activity timeline**: every friend who joined via the student's link, newest first, with masked name, college and a relative timestamp ("today" / "4 days ago") — their own cause-effect mirror of the admin-side audit trail, with an encouraging empty state before the first referral lands
- **Public campus leaderboard** (`/leaderboard`) — top-3 podium + ranked list, privacy-masked names, "That's you" highlight via `?ref=`, competition ranking consistent with dashboards, plus a **Colleges view toggle**: campus standings with a college podium (medal-tinted cards), share-of-leader progress bars, per-college referral engagement and each campus's best referrer — the club-competition angle
- **"Find my dashboard"** email lookup (`/success` without a code, or footer link) — students recover their referral link by email
- **Invite-message A/B test** — students pick one of three share styles on their dashboard (👋 Friendly / 🏆 Achievement / ⚡ Urgent); the choice rides the link as `?v=` and is captured on the referred registration (`registrations.shareVariant`), so the admin console can report which copy actually converts friends
- **Public ambassador boards** (`/ambassador/[code]`) — channel owners (ambassadors, club leads, creators) watch their own funnel from a phone: registrations, activated sharers, referrals generated, conversion rate, 7-day CSS trend, top sharers (privacy-masked), tracking-link + QR toolkit, plus **board distribution** ("WhatsApp this board" with a prefilled scorecard message / copy board link) and a mobile-only dismissible **Add-to-Home-Screen hint** (iOS Safari / Android Chrome step chips, remembered per device). No login required
- **PWA installability + offline shell** — web manifest (`/manifest.webmanifest`, generated via `app/manifest.ts`) with branded violet/bolt icons (192/512 + maskable), `apple-touch-icon` + standalone web-app meta, and a minimal service worker (`public/sw.js`: network-first for pages so dev/online behavior is untouched, cache fallback for offline, cache-first for icons, network-only for APIs; **only successful (2xx) navigations are cached**, so a 404 never becomes an offline shell). An **offline indicator** banner appears when connectivity drops — "showing your last synced board" — and confirms "Back online" on recovery, so the installed app opens honestly even without network. On Android/desktop Chrome the A2HS hint upgrades itself to a one-tap **"Install app"** button via the captured `beforeinstallprompt`
- WhatsApp share with spec-exact URL-encoded message — no API credentials needed

**Admin console (password protected)**
- 6 live metric cards (total, today, referrals, colleges, active referrers, target progress)
- Campaign pacing: current pace, projected final count, needed-per-day to hit 500 — flips to a pulsing "Final day — N today!" urgency state on the last day (and "Goal reached 🎉" once the target is hit), with a **required-vs-actual daily pace sparkline** (solid bars = actual signups per day, dashed amber bars = the pace still needed on today + remaining days)
- 4 Recharts visualizations: registrations over time (daily bars + cumulative line), by source, referral vs direct donut, top colleges
- **Channel drill-down board** — per-code attribution (RAHUL01, CSECLUB01, REELS60…) with volume bars, owners, referral share; click a card to open the **channel analytics page** (`/admin/sources/[code]`), or tap the link icon on any card to copy the owner-view board URL (`/ambassador/<code>`) for distribution
- **Channel analytics sub-dashboard** (`/admin/sources/[code]`) — per-code funnel (registrations → activated referrers → referral conversions), viral factor, 7-day trend chart, branch mix, top referrers within the channel, latest signups, one-click tracked-link copy, **invite style mix** (which `?v=` copy wins inside THIS channel — the variant × channel cross-tab), and **Export report** — one CSV with the funnel, style mix, daily trend and every registration for offline channel reviews
- **WhatsApp reminder simulator (nudge queue)** — live-computed near-miss list (students exactly 1 referral from their next milestone), pre-written personalized reminder, one-tap `wa.me` deep link, copy fallback, and an outreach log (`nudges` table) storing the exact message copy — hover the "reminded N×" chip to preview the last message sent; never-nudged rows highlighted, WhatsApp CTA pulses. Each row carries a **campus-competition chip** ("campus #4 · 6 behind Vasavi" / "tied with CMR" / "#1 — defending lead") and the reminder copy includes a matching "🏫 Campus boost" line — team-sport framing computed live from the college standings (`getCollegeGapMap`), in individual AND bulk sends
- **Nudge effectiveness read** — every logged reminder is checked for a referral landing within 24h; the queue shows "N sent · X% converted <24h" and rows that converted carry a "reminder worked" badge
- **Per-student outreach history** — expandable audit timeline on every nudged row (History ▾): every logged touch with timestamp, channel chip, the exact message copy **and the referral count at the time of the touch** ("at 2 referrals" → "today: 3 referrals" — cause-effect made visible); newest touch dot turns emerald with a "referral followed <24h" marker when that touch converted
- **Bulk first-touch reminders** — one-click "Remind all never-nudged" (near-misses) and "First-share push" (dormant students), batched at 25/click with a confirmation dialog; second touches stay manual
- **Snooze (outreach hygiene)** — per-row Snooze menu (1/3/7 days) pulls a student out of bulk pushes and sinks them to the bottom of the queue until the snooze expires (they wake automatically); "Snoozed until 6 Oct" chip + slate styling + one-tap **Wake now**; summary shows a "N snoozed" chip; bulk queries exclude actively-snoozed students at the database level (`registrations.snoozed_until`)
- **Channel owner digests** (`GET /api/admin/digests`) — a composed, send-ready weekly update per channel code with ≥1 registration: live funnel (regs → referrers → conversions), today's count, top masked referrer, board link — formatted as a WhatsApp-style message with one-click **Copy digest** (clipboard fallback included), plus direct Board / CSV links per row. The demo stand-in for scheduled email delivery: ops can paste the exact text into any channel today. Every copy is **logged as a handoff** (`digest_logs` table): rows carry a sky "sent N×" chip (tooltip = last handed-off copy + timestamp), the button flips to "Copy again", and the summary shows "N/M channels updated" — the digest loop gets the same audit trail as nudges
- **Invite-message A/B board** — registrations per share style with winner banner (+lift vs runner-up), a **two-proportion z-test significance readout** (`p ≈ 0.10`-style chip + ≥30-paired-signups guardrail, so early gaps aren't over-read), and a **three-way chi-square verdict** across all live styles (`χ²(2) = 9.75 · p ≈ 0.01`): "keep all styles live" when the spread looks like chance, or — only once significant — "consider pausing <last place>" with a small-sample caveat; share-of-tagged-referrals bars, "untagged" footnote, per-row variant chips in the registrations table + `Share Variant` column in CSV export
- **Campaign link generator** — build tracked share-links (`/register?source=…&code=…`) for any channel + downloadable QR poster (same-origin-restricted QR API)
- **College-name hygiene** — free-typed college values are **fuzzy-merged into the canonical spelling at registration time** (`lib/college-normalize.ts`: exact → punctuation/whitespace-insensitive → distinctive-token match incl. parenthetical abbreviations — "CBIT Hyderabad" → "Chaitanya Bharathi Institute of Technology (CBIT)"; unknown colleges stay as-typed), and an admin **"Clean college names"** button runs the same matcher retroactively over existing rows so campus standings never split a college across near-duplicates
- Top referrers leaderboard and acquisition-source breakdown
- Registrations table: debounced search, source/college/campaign-code filters, sortable columns, pagination, referral attribution per row
- **CSV export** of the currently filtered/sorted dataset (streams all pages, proper escaping)
- Demo dataset reset button (demo mode only)

**Safety rails**
- In-memory sliding-window **rate limiting** on `POST /api/register` (12/min/IP) and `POST /api/lookup` (5/min/IP) with `Retry-After` headers — blunt abuse before real traffic without extra infrastructure

**States**: loading skeletons, empty states, error states with retry, success toasts — every interaction gives feedback.

## 6. Referral Flow

```
Student registers  ──►  NXW-MONISH42 generated (unique, name-derived)
       │
       ▼
Success dashboard  ──►  copy code / copy link / WhatsApp share
       │                message: "Hey! I'm joining NxtWave's free
       │                'Build Your First AI Project in 60 Minutes'
       │                workshop. You can register here: {link}"
       ▼
Friend opens /r/NXW-MONISH42
       │                 • invalid code → friendly error + direct register path
       ▼
/register?ref=NXW-MONISH42
       │                 • "Kiran invited you" banner, source pre-set to "Friend / Referral"
       ▼
POST /api/register
       ├─ 1. validate (zod)             → field-level errors on failure
       ├─ 2. duplicate email check      → 409 + their existing referral code
       ├─ 3. referral code validation   → 400 on invalid / self-referral
       ├─ 4. unique referral code gen   → retry loop + DB unique constraint
       ├─ 5. insert registration        → transaction
       ├─ 6. insert referral record     → referrer + referred linked
       └─ 7. return referral stats      → referrer's dashboard updates instantly
```

Protected against: **self-referrals**, **duplicate referral attribution** (`referred_id` is unique), **duplicate emails** (unique index), **duplicate referral codes** (unique index + retry generation).

## 7. Database Schema

Six tables (Postgres types shown; SQLite local equivalent via Prisma):

- **`registrations`** — `id UUID PK`, `full_name TEXT`, `email TEXT UNIQUE`, `whatsapp TEXT`, `college TEXT`, `branch TEXT`, `graduation_year INTEGER`, `source TEXT`, `source_code TEXT`, `share_variant TEXT NULLABLE`, `referral_code TEXT UNIQUE`, `referred_by UUID → registrations(id) NULLABLE`, `snoozed_until TIMESTAMP NULLABLE` (nudge outreach hygiene), `created_at TIMESTAMP`
- **`referrals`** — `id UUID PK`, `referrer_id UUID → registrations`, `referred_id UUID UNIQUE → registrations`, `referral_code TEXT`, `status TEXT`, `created_at TIMESTAMP`
- **`campaign_sources`** — `id UUID PK`, `name TEXT`, `code TEXT UNIQUE`, `type TEXT`, `owner_name TEXT`, `created_at TIMESTAMP`
- **`milestones`** — `id UUID PK`, `name TEXT`, `referral_count INTEGER UNIQUE`, `reward_text TEXT`
- **`nudges`** — `id UUID PK`, `registration_id UUID → registrations`, `channel TEXT`, `message TEXT NULLABLE` (exact copy sent), `created_at TIMESTAMP`
- **`digest_logs`** — `id UUID PK`, `code TEXT` (channel code), `message TEXT NULLABLE` (exact copy handed off), `created_at TIMESTAMP`

Indexes on `created_at`, `source`, `college`, `referred_by`, `referrer_id`, `referral_code`, `digest_logs.code`. Full SQL: [`supabase/schema.sql`](supabase/schema.sql). Prisma source: [`prisma/schema.prisma`](prisma/schema.prisma).

## 8. Local Setup

```bash
# 1. Install
bun install            # or: npm install

# 2. Environment
cp .env.example .env   # defaults work out of the box (SQLite + demo mode)

# 3. Database
bun run db:push        # create tables
bun prisma/seed.ts     # seed 323 realistic demo registrations

# 4. Run
bun run dev            # http://localhost:3000
```

Admin console: `/admin` → password `12345` (demo default).

Useful scripts: `bun run lint`, `bunx tsc --noEmit`, `bun run db:push`.

## 9. Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite locally (`file:./db/custom.db`) or Supabase Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional; unset → demo mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Never exposed to the browser; not used in code paths unless you wire Supabase directly |
| `ADMIN_PASSWORD` | `/admin` password. Unset → demo password `12345` (hint is shown on the login page only in demo mode) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` → Demo Mode badges + dataset reset tooling |
| `CAMPAIGN_START_DATE` | Pin the 7-day window (`YYYY-MM-DD`); default = rolling window ending today |

## 10. Demo Mode

- Clearly labeled with **“Demo Mode”** badges (navbar, footer, dashboards, tooltip explains it)
- ~323 seeded registrations across 7 accelerating days, 16 real-feeling colleges, 6 sources, a referral network with 26 distinct referrers (top at 13) and a long tail
- Deterministic (seeded PRNG) — reseeding reproduces the same dataset
- Demo data lives in the same Prisma schema but is isolated by convention: `NEXT_PUBLIC_DEMO_MODE=false` + a production `DATABASE_URL` gives you a clean production instance, and the demo-reset API **refuses to run outside demo mode**
- Reset from the admin dashboard (“Reset demo data”) or `bun prisma/seed.ts`

## 11. Deployment to Vercel

1. Push to GitHub → import into Vercel (framework auto-detected)
2. Provision Supabase → run `supabase/schema.sql` in the SQL editor (or set `DATABASE_URL` to the Postgres pooler string and run `prisma db push`)
3. Set env vars in Vercel: `DATABASE_URL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_DEMO_MODE=false`, optional Supabase keys
4. Deploy — no server functions beyond the App Router defaults; everything is standard `next` runtime
5. **Security**: the service-role key stays server-side; admin routes are gated by middleware + HMAC cookie; the API re-verifies the session independently of the middleware

## 12. Design Decisions

- **Violet/fuchsia brand system, generous whitespace, restrained motion** — reads as a real SaaS product; framer-motion only for hero entrance, no gratuitous animation
- **Live numbers everywhere** — the landing hero counter, seat tracker, and every dashboard metric query the database at request time (`force-dynamic`); nothing is hardcoded
- **Names in referral codes** (`NXW-MONISH42`) — shareable codes feel personal and are self-verifying when friends compare links
- **Milestone ladder 1/3/5/10** — first reward lands immediately (instant gratification), the rest create escalating pull
- **Admin auth via env password + HMAC cookie** — right-sized for a prototype; middleware protects pages, APIs re-verify server-side (defense in depth)
- **SQLite local / Postgres prod through one Prisma schema** — the demo works with zero setup, and the production path is a config change, not a rewrite

## 13. Growth Logic

The 500-registration target decomposes into channel planning targets:

```
500 registrations =
  200  campus ambassador registrations      (14 ambassadors × ~15 each)
+ 150  college/community registrations      (20+ clubs & communities)
+ 100  WhatsApp/community registrations     (forwarded group messages)
+  50  incremental referral registrations  (the built-in engine)
```

**Important:** these are *campaign planning targets and assumptions*, **not** guaranteed conversion rates. They size the effort per channel — e.g. hitting 200 ambassador registrations assumes ~14 active ambassadors averaging 15 registrations each, which the dashboard would verify daily (registrations per `source_code`) so underperforming channels get re-worked mid-campaign. The referral number is deliberately conservative (10% of total) since viral loops are unpredictable; the upside case is exactly what this engine makes measurable.

## 14. Future Improvements

- **WhatsApp Cloud API integration** for automated join-link delivery (needs a business number + token) — the nudge queue's manual `wa.me` flow is the demo stand-in
- Supabase Auth to replace env-password admin, with per-ambassador logins
- **Scheduled digest delivery** — the digest payload is already composed per owner (`GET /api/admin/digests`); production only needs a cron trigger + email/WhatsApp sender to close the loop
- **Cohort retention view** — do nudge-converted referrers keep referring after their first milestone?
- Register-page share-style picker (variant chosen by the *invitee's* context) to widen A/B coverage beyond referred traffic
- Offline app-shell upgrade: precache a skeleton + the top-referrers data so a cold offline open renders structured content instead of the last full HTML snapshot
- Analytics events (Plausible/Umami) on share-tap, QR-download and board-return to correlate console metrics with real traffic

---

*Built as a growth-internship challenge simulation. No real student outreach is performed; the WhatsApp share opens a normal chat compose window and nothing is sent automatically.*
