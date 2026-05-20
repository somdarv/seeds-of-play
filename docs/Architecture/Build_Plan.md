# Kalaanba — Build Plan & Progress Tracker

**Status:** Living document — update as we go
**Started:** 2026-05-12
**Last updated:** 2026-05-12
**Source spec:** [Full Kalaanba Brief](../Full%20Kalaanba%20Brief.md)
**Architecture:** [System Architecture](System_Architecture.md)

---

## How to use this file

- Each **Stage** has a goal, exit criteria, and a checklist of **targeted build phases** with concrete tasks.
- Update task status as you go: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` dropped
- When a stage's exit criteria are met, mark the stage **DONE** and update the *Last updated* date at the top.
- New tasks discovered mid-stage are added under the relevant phase. Don't silently skip — mark `[-]` with a one-line reason.
- The order matters. Don't start Stage N+1 until Stage N's exit criteria are met. The brief's discipline (Trust before official, gates before publishing, etc.) depends on this ordering.
- The **Discipline Rules** at the bottom apply across every stage and every task. They are not optional.

**Legend**
- 🎯 Stage goal
- ✅ Exit criteria
- 📌 Tasks (checklist)
- 🔗 Brief reference

---

## Progress Snapshot

| Stage | Title | Status | Notes |
|---|---|---|---|
| 0 | Foundations | ⬜ Not started | |
| 1 | Identity Spine | ⬜ Not started | |
| 2 | The Match | ⬜ Not started | |
| 3 | Competitions | ⬜ Not started | |
| 4 | Distribution | ⬜ Not started | |
| 5 | Drama Layer (RP + Challenges + Buzz) | ⬜ Not started | |
| 6 | Operations & Revenue | ⬜ Not started | |
| 7 | Recognition & Governance UI | ⬜ Not started | |
| 8 | Hardening for 500K DAU | ⬜ Not started | |

Stage status options: ⬜ Not started · 🟡 In progress · ✅ Done · ⏸ Paused · ❌ Blocked

---

## Stage 0 — Foundations

🎯 **Goal:** Build the invisible plumbing once, properly. Nothing user-facing. If we skip any of this, we rewrite it under pressure later.

✅ **Exit criteria:** A developer can hit `/api/health`, the request flows through middleware, emits an analytics event, writes an outbox row, and a worker picks it up. All visible in dashboards. The architecture lint blocks cross-module reach-ins in CI.

🔗 **Brief refs:** §2.2 (principles), §6.2 (engine map), §11 (NFRs), §15 (open questions — all answered in System_Architecture.md §14)

### Phase 0.1 — Repos, CI, infra spine
- [ ] Confirm repo strategy (two repos: `kalaanba-api`, `kalaanba-front`) — current state in workspace
- [ ] Wire CI pipelines (GitHub Actions): lint, test, build for both repos
- [ ] Provision minimal infra: 1 LB, 1 Next node, 1 Laravel node, 1 worker node, 1 Postgres, 1 Redis, 1 Meilisearch, R2 buckets
- [ ] Cloudflare in front (DNS, TLS, WAF baseline)
- [ ] Private network / WireGuard between nodes; no public DB/Redis ports
- [ ] Domain + subdomain plan (`app.`, `api.`, `admin.`, `ws.`)
- [ ] Deploy tooling (Deployer or equivalent) — zero-downtime symlink swap

### Phase 0.2 — Laravel module scaffold
- [ ] Install Laravel 11, PHP 8.3, FrankenPHP worker mode running locally
- [ ] Create `app/Modules/` with one folder per engine (17 modules) using the standard shape (`Domain/Application/Infrastructure/Http/Listeners/Jobs/Contracts/Policies/Config/Tests`)
- [ ] Per-module service providers wired in `config/app.php`
- [ ] Per-module route registration pattern
- [ ] **Deptrac** (or Pest Architecture) configured to forbid cross-module reach-ins — fails CI
- [ ] **Schema-per-module migration convention** with namespaced migrations
- [ ] Architectural lint: no foreign keys across module schemas — fails CI
- [ ] `Model::preventLazyLoading()` enabled outside production

### Phase 0.3 — Event bus + outbox
- [ ] `outbox_events` table per module schema (id, event_name, payload, occurred_at, delivered_at, attempts)
- [ ] OutboxRelay worker (reads pending → dispatches to event bus → marks delivered)
- [ ] Redis Streams as transport
- [ ] Idempotent listener pattern: `(event_id, listener_name)` dedupe table
- [ ] Event naming convention enforced: `engine.action`
- [ ] **Ship dummy `health.ping` event end-to-end** as proof

### Phase 0.4 — Analytics envelope
- [ ] `analytics.events` table, daily partitioned
- [ ] Standard payload shape (event_id, event_name, schema_version, occurred_at, actor_id, actor_role, session_id, source, device, context_json, properties_json)
- [ ] Schema registry in code (`app/Modules/Analytics/Schemas/`), versioned
- [ ] Emit helper that validates against registry
- [ ] Schema-validation test that fails CI if event shape drifts

### Phase 0.5 — Admin Config registry
- [ ] `admin_config` table (key, scope, scope_id, value, effective_from, version, approved_by)
- [ ] Redis cache layer with TTL + bust-on-write
- [ ] `Config::get(key, scope, at?)` helper with effective-dated reads
- [ ] Seed defaults from brief (RP win/draw/loss, challenge windows, season dates, etc.)
- [ ] Approval workflow stub (Low/Med/High/Critical) — UI comes in Stage 7

### Phase 0.6 — Auth + authorization
- [ ] Sanctum installed, token issuance endpoint
- [ ] OTP issuance endpoint (mock provider; WhatsApp arrives in Stage 4)
- [ ] User model + role enum (Fan, Player, ClubRep, ClubAdmin, CompOrg, Referee, Officiator, FacilityMgr, HubAdmin, KalaanbaAdmin, SuperAdmin)
- [ ] Policy classes per resource convention
- [ ] Scope middleware (hub / club / competition / venue)
- [ ] `admin.audit_log` table, append-only, partitioned monthly
- [ ] All admin/Super Admin writes audit-logged via middleware

### Phase 0.7 — Frontend skeleton
- [ ] Next.js 15 with App Router, TypeScript strict, Tailwind, shadcn/ui
- [ ] TanStack Query, React Hook Form, Zod, MapLibre GL, Lucide
- [ ] OpenAPI codegen pipeline (Laravel → TS types)
- [ ] `api-client/` package with bearer token, error envelope, idempotency-key support
- [ ] `laravel-echo` + `pusher-js` configured (real Reverb arrives Stage 4)
- [ ] PM2 ecosystem file, standalone build, deploy to Next node
- [ ] Custom cache handler pointing at Redis

### Phase 0.8 — Observability
- [ ] Sentry on Laravel + Next.js
- [ ] Laravel Pulse + Telescope (Telescope sampled in prod)
- [ ] Prometheus + Grafana stack
- [ ] Loki + Promtail; JSON logs to stdout
- [ ] OpenTelemetry → Tempo
- [ ] UptimeRobot / BetterStack on public endpoints
- [ ] Horizon dashboard accessible to ops
- [ ] Baseline alerts: p95 latency, 5xx rate, queue depth, replication lag, Redis memory, disk %

---

## Stage 1 — Identity Spine

🎯 **Goal:** Stand up the entities everything else depends on — time, place, people, teams.

✅ **Exit criteria:** A Hub Admin can create their hub's zones; a user can sign up; a club can be created; a player can be added as a ghost and later claimed via OTP. All events emit to analytics. Trust module is stubbed and always clears.

🔗 **Brief refs:** §4 (geography), §5 (calendar/season), §6.1 (engines 1, 2, 3), §7.1 (clubs), §7.2 (players), §10.1 (V1 must-haves)

### Phase 1.1 — Season Engine
- [ ] `seasons` table (id, name, starts_at, ends_at, status, key dates JSON)
- [ ] Seed seasons (April 1 → Feb 28/29), phase definitions (high activity, final run-in, transition, archive)
- [ ] `Season::current()` cached helper
- [ ] Scheduler with leader-election Redis lock
- [ ] Phase transition jobs emitting `season.phase_changed`, `season.cutoff_passed`, `season.rp_reset_due`
- [ ] Configurable cutoffs read from Admin Config

### Phase 1.2 — Geography Engine
- [ ] Tables: countries, regions, city_hubs, zones, belts, areas (versioned per season)
- [ ] Area → Zone/Belt mapping (admin-managed)
- [ ] Hub Admin policy gates
- [ ] Seed Tamale City Hub with realistic areas/zones
- [ ] Public read endpoints for area/zone pickers

### Phase 1.3 — Identity / Users
- [ ] Full OTP registration flow (mock provider)
- [ ] User profile (name, phone hash, area, optional avatar in R2)
- [ ] Role assignment + admin promotion flow
- [ ] Scope middleware applied to protected routes
- [ ] Frontend: signup, login, profile screens

### Phase 1.4 — Club Engine
- [ ] Clubs table with maturity levels (Informal/Structured/Verified/Registered)
- [ ] Club types (community, school, academy, corporate, religious, institution, facility-based, registered)
- [ ] Roles: Owner, Co-founder, Admin, Manager, Captain, Scorer, Media Manager, Member/Viewer
- [ ] Verified Club badge storage (no judgement UI yet)
- [ ] Inactive (3mo) / Dormant (6mo) state transitions on cron
- [ ] Archive / merge primitives with redirect records
- [ ] Related-club detection on `integrity` queue (writes signals only; doesn't block actions yet)
- [ ] "Formerly…" notice retention (90 days)
- [ ] Frontend: club creation, members management, club profile

### Phase 1.5 — Player & Affiliation Engine
- [ ] Players table (claimed + ghost)
- [ ] Affiliations table (versioned: joined/transferred/loaned/left, start/end)
- [ ] Ghost player creation in lineups
- [ ] Claim flow via OTP linking ghost row to a user
- [ ] Minor-protected flag + restricted visibility query layer
- [ ] Free agent player support
- [ ] Frontend: player profile (basic card), ghost claim screen

### Phase 1.6 — Trust stub
- [ ] Trust module emits `trust.match_cleared` immediately on `matches.result_confirmed` (stub passthrough)
- [ ] Clearance flag table exists with proper shape so Stage 2 can swap in real rules without consumers changing

---

## Stage 2 — The Match (the heart of the product)

🎯 **Goal:** Make the football loop work end-to-end. Until this works, nothing else matters.

✅ **Exit criteria:** A club creates a friendly match, both reps confirm the result, Trust clears it, stats appear on the player's profile, and the public match card is live on the web. Public match/club/player pages are ISR with on-demand revalidation. **This is the demo-able product.**

🔗 **Brief refs:** §7.3 (matches), §7.8 (trust), §8.1 (football loop), §10.1

### Phase 2.1 — Match / Fixture Engine
- [ ] Matches table with state-machine column
- [ ] States: Draft → Scheduled → Confirmed → Live → Awaiting Result → Verification Pending → Result Confirmed → Archived + side states (Postponed, Cancelled, Walkover, Abandoned, Disputed, Void)
- [ ] `match_events` append-only (goals, cards, subs, key incidents) with `client_event_id` idempotency
- [ ] Configurable match duration (read from Admin Config)
- [ ] Five match types: Friendly, Competition fixture, Challenge match, Internal match, Training event
- [ ] Walkover/Postpone/Cancel/Abandoned flows with their stats implications

### Phase 2.2 — Confirmation gate
- [ ] Per-type confirmation models (Friendly = both reps; Internal = club admin; Competition = organizer; Challenge = 2-of-3; Referee-officiated = referee strongest weight)
- [ ] `result_confirmed` boolean is the explicit hard gate
- [ ] Eligibility flags exposed on match record: `verified`, `rpEligible`, `statsEligible`, `standingsEligible`, `zoneEligible`, `challengeLinked`, `competitionLinked`

### Phase 2.3 — Trust & Verification V1
- [ ] Replace Stage 1 stub with real rule engine
- [ ] Rule inputs: confirmation parties, referee type weight, evidence presence, repeat-pairing signal, related-club signal, caution levels
- [ ] Stored clearance outputs: `verificationStatus`, `trustLevel`, `cautionLevel`, `rpClearance`, `statsClearance`, `standingsClearance`, `archiveClearance`, `reviewFlag`
- [ ] Decision Trace JSON attached to each clearance record
- [ ] Super Admin override endpoint with reason + previous/new status + audit log
- [ ] Trust emits `trust.match_cleared`, `trust.stats_cleared`, `trust.requires_review`

### Phase 2.4 — Stats projection
- [ ] Listener on `trust.stats_cleared` writes player/club aggregate stats
- [ ] Player career table (per season + lifetime)
- [ ] Club aggregate table (per season)
- [ ] Backfill job for any reprocessing

### Phase 2.5 — Notifications V1 (in-app only)
- [ ] In-app inbox table + endpoints
- [ ] Outbox-driven worker delivery to in-app inbox
- [ ] Delivery audit log
- [ ] Notification preferences + quiet hours scaffolding (WhatsApp arrives Stage 4)

### Phase 2.6 — Frontend public surfaces
- [ ] Public match page (ISR, revalidate-on-result-confirmed via webhook from Laravel)
- [ ] Public club page
- [ ] Public player page (respecting minor-protected flag)
- [ ] Organizer match-entry flow (create → schedule → live entry → submit result)
- [ ] Both-reps confirmation UI for friendlies
- [ ] Super Admin minimal override UI

---

## Stage 3 — Competitions

🎯 **Goal:** Give matches a container so they aggregate into standings.

✅ **Exit criteria:** The "Tamale Premier League" demo dataset runs as a real competition with real fixtures, real results, real standings, real top-scorer table — all on a public URL.

🔗 **Brief refs:** §7.4 (competitions), §10.1

### Phase 3.1 — Competition & Rules Engine
- [ ] Competitions table (type: League | Knockout, scope: Internal | Open | Invitational | Official)
- [ ] Versioned rules JSON (points, tiebreakers, match duration, squad cap, walkover default)
- [ ] **Rules lock on first confirmed result** — subsequent edits require Critical approval + effective-dated version
- [ ] Public / unlisted / private visibility

### Phase 3.2 — Manual fixtures
- [ ] Organizer adds each fixture (no auto-generation in V1)
- [ ] Team registration into competition
- [ ] Fixture ↔ Match linkage

### Phase 3.3 — Standings projection
- [ ] Materialized standings table (one row per (competition, team))
- [ ] Job refreshes on `matches.result_confirmed` filtered to the competition
- [ ] Tiebreaker calculation per competition rules

### Phase 3.4 — Public competition page
- [ ] ISR rendered Next.js page at `/competitions/[slug]`
- [ ] Tag-based revalidation on every standings update (webhook from Laravel)
- [ ] Visibility enforcement (public / unlisted / private)

### Phase 3.5 — Per-competition Top Scorer / Assist (minimum Awards integration)
- [ ] Per-competition stats aggregation
- [ ] Top scorer + top assist leaderboards on competition page
- [ ] Listener-driven, refreshed on stats clearance

---

## Stage 4 — Distribution (let the world see it)

🎯 **Goal:** Push verified moments out of the platform and into the WhatsApp groups where grassroots football already lives.

✅ **Exit criteria:** A confirmed match generates a moderated share card pushed into a WhatsApp group within minutes. Live score updates show on the public match page in real time.

🔗 **Brief refs:** §7.12 (moderation), §7.13 (notification & distribution), §7.11 (awards — matchday only)

### Phase 4.1 — Notification & Distribution Engine full V1
- [ ] Meta WhatsApp Cloud API integration live
- [ ] Template message approval pipeline
- [ ] Quiet hours + per-user preferences enforced
- [ ] Channel fallback (WhatsApp → in-app)
- [ ] Reminders with idempotency
- [ ] Delivery audit log + provider error capture
- [ ] Public vs targeted distribution split

### Phase 4.2 — Reverb realtime
- [ ] Reverb deployed on 2 nodes behind HAProxy (sticky for WS only)
- [ ] Sanctum-backed broadcasting auth
- [ ] Channels: `private-match.{id}`, `private-user.{id}`
- [ ] Public match page subscribes for live score / event updates
- [ ] Reverb metrics in Grafana

### Phase 4.3 — Moderation & Safety Engine
- [ ] Rule-based auto-screening (regex + lists)
- [ ] Admin review queue with priority
- [ ] States: submitted, auto_screened, clean, watch, held_for_review, restricted, hidden, escalated, approved, edit_requested, removed, restored, sanction_recommended
- [ ] **Safe default copy library** keyed by context — business flows never stall
- [ ] Restriction levels on user/club/venue
- [ ] Public distribution checks Moderation clearance at send time

### Phase 4.4 — Matchday share cards
- [ ] Card renderer (Puppeteer / chrome-php)
- [ ] Card templates: goal scorer, hat-trick, clean sheet, final score
- [ ] Render → R2 (public bucket) → distribute
- [ ] Trust + Moderation gates before publish
- [ ] WhatsApp template message linking to the card

---

## Stage 5 — The Drama Layer (RP + Challenges + Buzz)

🎯 **Goal:** Give the platform its public personality. This is where Kalaanba stops being a record-keeper and becomes a stage.

✅ **Exit criteria:** Club A issues a Ranked Challenge, fans react and share, Club B accepts, the match is played and verified, RP transfers, the result card distributes via WhatsApp, the Challenge Wall shows the resolved card with engagement counts.

🔗 **Brief refs:** §7.5 (challenges), §7.6 (RP), §7.10 (fan buzz), §6.2 (boundaries — Buzz NEVER mints RP)

### Phase 5.1 — RP Economy Engine
- [ ] `rp_ledger` table — source of truth (entity_type, entity_id, amount, reason, source_event_id, balance_before, balance_after, season_id, occurred_at)
- [ ] Wallet projections (available season, locked season, lifetime, season snapshot)
- [ ] Win/Draw/Loss minting listener on `trust.rp_cleared` (configurable values)
- [ ] One-time bonuses (profile complete, first verified match)
- [ ] Tier system (Unranked → Crowned), tier transitions audit-logged
- [ ] Atomic transfer pattern (advisory lock + ledger entry in one tx)
- [ ] Anti-farming listeners:
  - [ ] Repeat-pairing decay (30-day window, full RP only first 2 matches)
  - [ ] Related-club RP-transfer block
  - [ ] New-club gating (min verification + 3 verified matches before ranked RP transfer)
- [ ] Off-season earnings queued, applied on April 1 transition
- [ ] Season RP reset job (April 1) preserving lifetime RP

### Phase 5.2 — Challenge Engine
- [ ] Challenges table with full lifecycle state machine
- [ ] States: Drafted → Issued → Seen → Countered/Accepted/Declined/Ignored → Scheduling → Scheduled → Prediction Open → Live → Verification Pending → Resolved/Disputed/Forfeited → Archived
- [ ] 50 Season RP unlock check
- [ ] Stake calculation: `max(tier_floor, %_stake)` bounded by tier cap
- [ ] One counter offer per side
- [ ] 72h response window + 4-day scheduling window jobs
- [ ] Open Call-out Windows + Inter-Zone Leader Duels admin toggles
- [ ] 2-of-3 verification table + evaluator job
- [ ] Outcomes: winner takes stake, draw = stood-ground cost to respondent (defaults from Admin Config)
- [ ] Challenge → Match linkage on schedule
- [ ] Public challenge card flow (gated by Moderation)
- [ ] Frontend: challenge issue flow, accept/counter UI, Challenge Wall, prediction UI

### Phase 5.3 — Fan Buzz, Feed & Discovery V1
- [ ] Reactions, shares, tracks, follows, predictions
- [ ] Redis sorted sets per (surface, context) for incremental Buzz scoring
- [ ] Periodic reconciliation to Postgres
- [ ] Feed generation job per (user_segment, surface)
- [ ] Soft-follow inference nightly job
- [ ] Surfaces: Home, City Hub, Zone, Challenge Wall, Fixture/Club/Venue/Competition discovery, Player Moment feed
- [ ] UI kit: Buzz badge, Heat meter, Engagement bar, Reaction picker, Track/Follow/Predict/Share buttons, Feed filter tabs
- [ ] **Architectural enforcement: Buzz module has no write access to RP/Match/Competition schemas (Deptrac rule)**
- [ ] Anti-manipulation basics (rate limits, dedupe by device, no-self-reaction)

### Phase 5.4 — Zone Engine inter-zone records
- [ ] Inter-zone match aggregation table
- [ ] Zone leaderboards derived from RP outputs
- [ ] Zone Pulse feed surface
- [ ] Frontend zone pages

---

## Stage 6 — Operations & Revenue

🎯 **Goal:** Let venues onboard, let clubs book, take money, record commission. The platform now pays for itself.

✅ **Exit criteria:** A club discovers a venue, books a slot online via Paystack, the booking links to a fixture, the surface calendar reflects it, commission is recorded, settlement is tracked. A referee can be assigned and submits a post-match report.

🔗 **Brief refs:** §7.7 (venues/surfaces/bookings), §7.9 (referees), §10.1

### Phase 6.1 — Venue & Surface Engine
- [ ] Venues + surfaces tables (one venue, many surfaces)
- [ ] Four location modes: bookable platform venue, listed venue, open/community venue, manual venue text
- [ ] Facility manager portal scaffold
- [ ] Manager roles: Owner, Manager, Booking Attendant, Media Manager, Finance Viewer
- [ ] Surface calendar (the bookable resource)
- [ ] Offline blocks (phone, WhatsApp, walk-in, private events, maintenance) — first-class on the calendar
- [ ] Rich media capture (daytime, nighttime, drone, GPS pin)
- [ ] Venue verification queue (admin)

### Phase 6.2 — Booking Engine (pre-payment)
- [ ] Bookings table with state machine: draft → slot_selected → hold_created → approval_pending|payment_pending → confirmed → linked_to_fixture → completed|cancelled|refunded|no_show|disputed
- [ ] Hold expiry job (configurable TTL)
- [ ] Conflict prevention against surface calendar + offline blocks + other holds
- [ ] Fixture linkage
- [ ] Notification triggers to club, referee, manager

### Phase 6.3 — Booking payments
- [ ] `PaymentProvider` interface
- [ ] Paystack implementation (Ghana)
- [ ] Webhook verification (idempotent)
- [ ] Payment capture → booking confirmed transition (atomic)
- [ ] Commission recording on `bookings.settlement`
- [ ] Refund / cancellation / no-show / disputed flows with admin queues
- [ ] Manual settlement support (until clean splits available)
- [ ] Monetary amounts in integer minor units (pesewas) — enforced by lint or value object

### Phase 6.4 — Referee & Officiator Engine V1
- [ ] Referees table with kind discriminator (community officiator, split community, verified referee, organizer-appointed, Kalaanba-appointed)
- [ ] Trust weights stored in Admin Config, consumed by Trust engine
- [ ] Acceptance flow
- [ ] Calendar conflict prevention
- [ ] Light V1 report: completed, score, no-show/walkover/abandoned flag, cards, key incidents, optional photo/video
- [ ] Split officiating restricted for high-RP challenges and finals
- [ ] No marketplace / payments / public ratings (deferred per brief §10.2)

---

## Stage 7 — Recognition & Governance UI

🎯 **Goal:** Continuous recognition cadence + the admin tooling to run all of it without code changes.

✅ **Exit criteria:** An admin can change the RP win value for next season without touching code, approve a venue verification, resolve a disputed challenge with full audit trail, and review every weekly recognition card before it publishes.

🔗 **Brief refs:** §7.11 (awards), §7.15 (admin config & governance), §11.6 (observability), §10.1

### Phase 7.1 — Awards & Recognition full
- [ ] Cadence schedulers: matchday (after each confirmed match), weekly (Sun night), monthly (1st), season-end (closing window)
- [ ] Candidate generation reads Trust + stats clearance
- [ ] Weekly: Goals of the Week, Assists of the Week, Club of the Week, Challenge of the Week, Hat-trick Hero, Zone Pulse
- [ ] Monthly + season snapshots
- [ ] Card render → R2 → distribution (Moderation-gated)
- [ ] Corrections preserve history (revoked_at + compensating record)
- [ ] Admin review queue before publish
- [ ] Profile badges updated on award

### Phase 7.2 — Admin Configuration & Governance UI
- [ ] Config registry browser (all keys, all scopes, all values)
- [ ] Effective-dated editing UI
- [ ] Version history per key
- [ ] Approval workflows (Low immediate / Medium admin confirm / High senior approval / Critical Super Admin + dual)
- [ ] Preset library (competition presets, RP config presets, season presets)
- [ ] Scope picker (platform / season / hub / zone / competition / entity)

### Phase 7.3 — Dispute & evidence handling
- [ ] Dispute queue with priority
- [ ] Evidence upload to private R2 (`kalaanba-evidence`)
- [ ] Signed URLs (5-min TTL), audit-logged access
- [ ] Decision Trace surfacing in admin UI
- [ ] Super Admin override capture (previous/new status, reason, affected systems, evidence ref, timestamp)
- [ ] Compensating ledger entries on RP corrections
- [ ] Dispute SLA tracking

### Phase 7.4 — V1 dashboards
- [ ] Platform dashboard (active clubs, verified matches, RP-eligible matches, hot fixtures, DAU)
- [ ] Club dashboard (their matches, RP, challenges, awards)
- [ ] Venue dashboard (bookings, occupancy, revenue, commission, no-shows)
- [ ] Competition dashboard (standings, top scorers, fixture progress)
- [ ] Trust dashboard (clearance throughput, override frequency, dispute SLA)
- [ ] Moderation dashboard (queue depth, decision times, restriction trends)
- [ ] Notification dashboard (delivery rate, latency, channel split, failures)

---

## Stage 8 — Hardening for 500K DAU

🎯 **Goal:** Stretch from minimal infra to the §11 capacity baseline. Prove it holds under load and under failure.

✅ **Exit criteria:** Documented headroom of at least 2× projected peak. Restored DB inside SLA. No single-node failure causes user-visible outage longer than 60s. Cache hit rates and queue depths within healthy ranges under load.

🔗 **Brief refs:** §11 (NFRs), Architecture §11 (capacity), §12 (scaling path)

### Phase 8.1 — Scale out
- [ ] Scale to: 2 LB, 4 Next.js, 6 Laravel/FrankenPHP, 2 worker, 2 Reverb, 1 Postgres primary + 2 replicas, 3 Redis Sentinel, 2 Meilisearch, 1 observability
- [ ] PgBouncer in front of every Postgres node
- [ ] HAProxy floating IP active/passive

### Phase 8.2 — Read-write split + caching
- [ ] Laravel `read`/`write` connection split active
- [ ] Read-heavy routes verified to hit replicas
- [ ] Cloudflare edge cache rules per public surface (matches, competitions, clubs, venues, feeds)
- [ ] Redis hit rates measured per cache namespace
- [ ] Materialized projections covering all hot reads (standings, leaderboards, feeds, dashboards)

### Phase 8.3 — Load testing
- [ ] k6 scripts for: signup flow, match entry, public match read, competition page read, challenge issue, booking, feed scroll
- [ ] Sustain 1,500 rps on public read path
- [ ] Sustain 500 rps on writes
- [ ] Reverb test: 50K concurrent connections
- [ ] Soak test: 6h sustained load, no memory leak / connection drift

### Phase 8.4 — DR & game-day
- [ ] Full Postgres PITR rehearsal in side environment
- [ ] Restore inside documented RTO/RPO
- [ ] Game-day failure injection: kill a Laravel node, kill Postgres primary, fill Redis, saturate `default` queue
- [ ] All failure modes recover within 60s of user-visible impact
- [ ] Runbook documented for each failure mode

---

## Discipline Rules (apply across every stage)

These are not optional. They are the spine of the brief and the architecture. If a task seems to require violating one, **the task is wrong, not the rule.**

1. **Every stage emits analytics events.** No "we'll add tracking later." Day-one capture is mandated by the brief.
2. **Every stage reads from Admin Config** for any business value. No hardcoded RP/threshold/window/label values, ever.
3. **Every record-affecting flow goes through Trust clearance.** Trust outputs are **stored, not recomputed** per page load.
4. **Every public output passes Moderation** before distribution. Including admin-generated content.
5. **Every stage's tests include the architecture lint.** Cross-module reach-ins and cross-schema foreign keys fail CI.
6. **Every irreversible action has a Super Admin override path and an audit log entry** with reason capture.
7. **Every user-triggered write is idempotent.** Mobile networks retry; we will double-write without `Idempotency-Key` discipline.
8. **No FanBuzz writes touch RP, Match, or Competition schemas.** Deptrac-enforced.
9. **RP is mutated only via ledger entries.** Wallet balances are projections, never directly updated.
10. **Money is integer minor units.** Never floats. Booking commission, settlement, refunds all in pesewas.
11. **Archive, don't delete.** Clubs, players, matches, awards, challenges — all preserve history. Corrections via compensating entries.
12. **The football loop (Stage 2) must be solid before the drama layer (Stage 5).** Drama only works if Trust is real.
13. **Revenue (Stage 6) is the last thing before scale-out, not the first.** Don't let monetization pressure jump the queue.

---

## Out of Scope (deferred — brief §10.2)

Do not let any of these slip into the V1 stages above under any pressure:

- Promotion / relegation
- Group + knockout combined formats
- Auto fixture generation
- Paid competitions, prize pools, entry fees
- Referee marketplace, referee payments, public referee ratings
- Full comment system, fan voting, fan reputation
- AI-driven trust/moderation decisions
- Offline-first live match entry
- Advanced public trust scores and automated punishments
- Subscriptions, sponsorships, promoted listings
- Self-hosted SLM, AI dashboard queries, advanced personalization
- Bulk tournament booking automation
- All-time / cross-season advanced analytics

---

## Change Log

| Date | Change | By |
|---|---|---|
| 2026-05-12 | Initial build plan derived from System_Architecture.md §13 + brief §14 | initial |
