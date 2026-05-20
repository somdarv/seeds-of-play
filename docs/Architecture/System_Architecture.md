# Kalaanba — System Architecture

**Status:** Architecture baseline (proposed, ready for build)
**Date:** 2026-05-12
**Scale target:** 500,000 daily active users at peak (Ghana-first, mobile-heavy)
**Stack:** Laravel 11 (PHP 8.3) API + Next.js 15 frontend, deployed across a VPS cluster
**Source product spec:** `docs/Full Kalaanba Brief.md` (sections 1–16) — the single, authoritative product brief — plus the 17 locked engine system documents it consolidates.

> This document is the technical counterpart to the Full Kalaanba Brief. The brief says **what** Kalaanba is and **what it must do**. This document says **how we build and run it** so that 17 cooperating engines, a reputation economy, a verification layer, a venue-booking layer, and a fan-buzz layer can all live in one codebase and serve half a million daily users without falling over.
>
> Every section below cites the brief section it implements. If the brief changes, this document changes in the same PR.

---

## 0. TL;DR

- **Backend:** Laravel 11 as a **modular monolith**, one module per engine, talking over an **internal event bus + outbox**. Served by **FrankenPHP in worker mode** (Octane-class throughput) behind HAProxy.
- **Frontend:** Next.js 15 (App Router, RSC, ISR) in **standalone** mode on a Node pool. Cloudflare in front for edge caching, WAF, and DDoS.
- **Data:** PostgreSQL 16 (primary + 2 read replicas, partitioned), Redis (Sentinel) for cache/queues/locks/rate limits, Meilisearch for discovery, S3-compatible object storage (Cloudflare R2) for media and evidence.
- **Realtime:** Laravel Reverb (self-hosted WebSockets) for live match, admin queues, notifications.
- **Workers:** Laravel Horizon on a dedicated pool — every non-critical action (notifications, analytics rollups, Buzz scoring, Trust checks, recognition generation, integrity sweeps) is queued.
- **Capacity baseline:** ~25 VPS nodes (load balancers, web tier, PHP tier, worker tier, DB tier, Redis, search, Reverb, observability). Hetzner CCX/CPX class hardware.
- **Cost order-of-magnitude:** ~€1,500–2,000/month at V1 peak. Vertical-first, horizontal-second scaling path documented below.

The architecture is **boring on purpose**. The product is ambitious; the runtime should not be.

---

## 1. Architectural Principles (anchored to the product brief)

These principles come directly from the brief's Section 2.2 and Section 11. The architecture must enforce all of them at the infrastructure level — not as developer discipline alone.

1. **Backend is the source of truth.** No business logic in React. Frontend renders state the engines compute.
2. **Modular monolith.** One Laravel codebase, one deployable unit, **strict module boundaries**. Modules communicate via the event bus, not by reaching into each other's tables.
3. **Event-driven between engines.** Every domain action emits a typed event. Engines react via listeners + queued jobs.
4. **Outbox for reliability.** Notifications, analytics events, share cards, and cross-engine triggers are never lost on request latency or restart.
5. **Idempotency on every user-triggered write.** Match submit, payment, booking, reaction, RP transfer, override.
6. **Configurable, not hardcoded.** Every threshold/window/weight/label is read from the Admin Config registry with a cache layer. Internal keys stable, labels swappable, effective-dated.
7. **Capture history; never silently delete.** Archive, merge, version, audit. Compensating ledger entries on corrections.
8. **Verified before official.** Nothing official updates until `result_confirmed = true` and Trust clearance is stored.
9. **Trust gates records. Moderation gates public distribution.** Two independent gates, never collapsed.
10. **Analytics from day one.** Standard event payload, stable `domain.action` event names, schema registry, versioned.
11. **Stateless web/PHP tiers.** No local sessions, no local file writes. Everything that needs state goes to Postgres, Redis, or object storage.
12. **Cache aggressively.** Cloudflare edge → Redis app cache → DB. Most public reads should never hit Laravel.

---

## 2. High-Level Topology

```
                          ┌──────────────────────────────────┐
                          │       Cloudflare (global)        │
                          │  TLS · WAF · DDoS · CDN · Images │
                          └──────────────┬───────────────────┘
                                         │
                                  ┌──────┴──────┐
                                  │  HAProxy LB │  (2 nodes, active/passive, floating IP)
                                  └──────┬──────┘
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
        ┌───────────────┐        ┌───────────────┐        ┌────────────────┐
        │ Next.js pool  │        │ Laravel API   │        │ Reverb (WS)    │
        │ 3–5 nodes     │        │ pool          │        │ 2 nodes        │
        │ Node 20 +     │        │ 4–6 nodes     │        │ sticky for WS  │
        │ PM2 standalone│        │ FrankenPHP    │        │ only           │
        └──────┬────────┘        └──────┬────────┘        └───────┬────────┘
               │                        │                         │
               │                        ▼                         │
               │                ┌───────────────┐                 │
               │                │ Horizon worker│                 │
               │                │ pool (2 nodes)│                 │
               │                └──────┬────────┘                 │
               │                       │                          │
               └─────────────┬─────────┴──────────────┬───────────┘
                             ▼                        ▼
                ┌────────────────────────┐  ┌──────────────────────┐
                │ Postgres 16            │  │ Redis (Sentinel x3)  │
                │ primary + 2 replicas   │  │ cache · queues ·     │
                │ PgBouncer in front     │  │ locks · rate limits  │
                └────────────────────────┘  └──────────────────────┘
                             │                        │
                ┌────────────┴────────────┐  ┌────────┴────────┐
                ▼                         ▼  ▼                 ▼
        ┌──────────────┐         ┌─────────────────┐   ┌───────────────┐
        │ Meilisearch  │         │ Cloudflare R2   │   │ Prometheus /  │
        │ (Scout)      │         │ media + evidence│   │ Grafana / Loki│
        │ 2 nodes      │         │ + backups       │   │ + Sentry      │
        └──────────────┘         └─────────────────┘   └───────────────┘
```

Edge (Cloudflare) → LB (HAProxy) → Web tiers (Next + Laravel + Reverb) → Workers → Data plane (Postgres + Redis + Meili + R2). Observability sees all of it.

---

## 3. Backend — Laravel as a Modular Monolith

### 3.1 Module layout (one folder per engine)

```
app/
└── Modules/
    ├── Season/                    # Platform clock, phases, cutoffs, RP reset
    ├── Geography/                 # Country/Region/Hub/Zone/Belt/Area
    ├── Identity/                  # Auth, OTP, users, roles
    ├── Clubs/                     # Identity, maturity, verification, related-club
    ├── Players/                   # Players, ghost, claim, affiliations, transfers
    ├── Matches/                   # Match/fixture lifecycle, events, calendars
    ├── Competitions/              # Formats, rules, standings, brackets, pages
    ├── Challenges/                # Public duels, stakes, counter offers, settlement
    ├── RpEconomy/                 # Wallet, ledger, locks, transfers, anti-farming
    ├── Venues/                    # Venues, surfaces, manager portal, calendars
    ├── Bookings/                  # Holds, payments, commission, settlement, refunds
    ├── Referees/                  # Verified refs, community officiators, reports
    ├── Trust/                     # Verification, evidence, disputes, clearance flags
    ├── FanBuzz/                   # Reactions, shares, tracks, follows, predictions, feed
    ├── Awards/                    # Matchday/weekly/monthly/season recognitions
    ├── Moderation/                # Public content safety, queues, restrictions
    ├── Notifications/             # WhatsApp + in-app outbox, workers, distribution
    ├── Analytics/                 # Event capture, derived metrics, dashboards
    └── AdminConfig/               # Config registry, governance workflows, audit
```

Each module has the same internal shape:

```
Modules/<Engine>/
├── Domain/                # Entities, value objects, domain events
├── Application/           # Commands, queries, use-case services
├── Infrastructure/        # Eloquent models, repositories, external adapters
├── Http/                  # Controllers, requests, resources, routes
├── Listeners/             # React to events from other modules
├── Jobs/                  # Queueable units of work
├── Policies/              # Authorization
├── Config/                # Module-scoped config defaults
└── Tests/
```

### 3.2 Boundary rules (enforced, not aspirational)

- **No cross-module Eloquent reads.** Module A never queries Module B's tables. It calls Module B's application service or reads a published event.
- **One database, many schemas.** Each module owns a Postgres schema (`clubs.*`, `matches.*`, `rp.*`, …). Foreign keys *within* a schema; **no FKs across schemas** — use IDs and integrity workers instead. This is what lets us extract a module to its own service later without rewriting it.
- **Public contracts only.** Each module exposes a `Contracts/` namespace (interfaces + DTOs). Other modules type-hint the interface, not the implementation.
- **Architectural linting.** Deptrac or Pest Architecture tests in CI block illegal dependencies.

### 3.3 Why monolith, not microservices

The brief mandates a modular monolith (Section 2.2, principle 9, and 11.1). The architecture follows. One deploy unit, one transaction boundary where it matters (RP ledger, match confirmation, booking payment), one place to debug. We pay the modular-discipline tax now so we can extract services later if and when scale forces it — not before.

### 3.4 PHP runtime: FrankenPHP worker mode

- **FrankenPHP** runs Laravel in long-lived worker processes, like Octane but with native HTTP/2/3 and zero-config workers.
- 3–5× throughput vs PHP-FPM for Laravel workloads. Critical at 500K DAU.
- `Model::preventLazyLoading()` and `Model::preventSilentlyDiscardingAttributes()` enabled outside production to catch N+1 and silent data drops in CI.
- OPcache + JIT enabled, preload Laravel core.

**Fallback:** Laravel Octane + Swoole if FrankenPHP causes issues with a specific dependency. The application code is identical.

### 3.5 The event bus + outbox

Every cross-engine effect goes through this. **No exceptions.**

```
[ Domain action in Module A ]
        │
        ▼
[ DB transaction ]
   • write business state
   • write OutboxEvent row in same transaction   ◄── atomic
        │
        ▼
[ Commit ]
        │
        ▼
[ OutboxRelay worker ]
   • reads pending outbox rows
   • dispatches to Laravel event bus / Redis Streams
   • marks delivered
        │
        ▼
[ Listeners in Modules B, C, D ]
   • each queues a Job for its own side effect
   • idempotent on (event_id, listener_name)
```

- **Outbox table** lives in each module's schema: `outbox_events(id, event_name, payload, occurred_at, delivered_at, attempts)`.
- **Idempotency:** every job checks an `(event_id, listener_id)` row in a dedupe table before executing.
- **Transport:** Redis Streams in V1 (already present for queues). Upgradeable to NATS or RabbitMQ later without changing producer/consumer code.
- **Event naming:** `engine.action` (e.g., `matches.result_confirmed`, `rp.transferred`, `challenges.accepted`, `bookings.payment_captured`). These are the same names the Analytics engine indexes.

### 3.6 Queues — Horizon on Redis

Separate logical queues by priority and concern (so a notification flood can't starve match verification):

| Queue | Concurrency | Used by |
|---|---|---|
| `realtime` | high | live match updates, Reverb broadcasts |
| `default` | high | result confirmation, RP transfers, clearance updates |
| `verification` | medium | Trust checks, evidence processing |
| `notifications` | medium | WhatsApp + in-app delivery |
| `analytics` | medium | event rollups, derived metrics |
| `buzz` | low | reaction/share scoring, feed ranking |
| `awards` | low | recognition generation, share cards |
| `integrity` | low | anti-farming, related-club sweeps, repeat-pairing decay |
| `bulk` | lowest | re-indexing, exports, backfills |

Horizon auto-balances worker counts per queue based on backlog.

### 3.7 Authentication & authorization

- **Auth:** Laravel Sanctum with personal access tokens (mobile-first, no cookies-only flow). OTP login via WhatsApp/SMS provider — the brief is WhatsApp-first.
- **Authorization:** policy classes per resource, scoped by role **and** geography (City Hub / Zone) **and** entity ownership (Club, Competition, Venue).
- **Role tiers** (from brief §3.1): Fan, Player, Club Rep/Captain, Club Admin/Owner, Competition Organizer, Referee, Community Officiator, Facility Manager, Hub Admin, Kalaanba Admin, Super Admin.
- **Scope-based gates** implemented as an attribute middleware: `@Scope(hub: 'tamale', club: ':id')`. Hub Admins can never act outside their hub; Super Admin can, with every action audit-logged.

### 3.8 Configuration — Admin Config & Governance engine

- **Config registry** is a Postgres table: `key, scope (platform|season|hub|zone|competition|entity), scope_id, value, effective_from, version, approved_by`.
- **Application access:** `Config::get('rp.win_points', scope: $hub)` resolves through a cache (Redis, 60s TTL, busted on write).
- **Effective-dated:** writes don't take effect immediately; engines read the value that was effective at the event's `occurred_at`. Critical for fairness in RP and rules changes.
- **Approval workflow:** Low / Medium / High / Critical (Super Admin + dual approval) per the brief. Approvals are queued in an admin UI; nothing changes until approved.
- **Versioned:** every value change is a new row, never an update. Old values remain queryable for audit and replay.

---

## 4. Data Layer

### 4.1 PostgreSQL 16

- **1 primary + 2 read replicas**, async streaming replication.
- **PgBouncer** in front of every replica in transaction-pooling mode — non-negotiable with worker-mode PHP at this scale.
- **Read-write split** in Laravel via `read`/`write` connection config; reads route to replicas for list pages, public profiles, dashboards. Writes and read-after-write flows hit the primary.
- **Extensions:** `uuid-ossp` (IDs), `pg_trgm` (fuzzy name search for clubs/players/venues), `postgis` (venue and zone geo queries), `pgcrypto`.
- **Schemas per module** as in §3.2. Cross-schema queries via views only, owned by the consuming module.
- **Partitioning:**
  - `matches.match_events` partitioned by month (write-heavy, rarely re-read past the season)
  - `analytics.events` partitioned by day, dropped after retention window
  - `notifications.outbox` and `notifications.delivery_log` partitioned by week
  - `rp.ledger` partitioned by season
- **Indexes:** every foreign key, every status enum used in queues, every `(scope, occurred_at)` pair on event tables. Use `BRIN` for time-series tables.

### 4.2 Redis (Sentinel, 3 nodes)

Logical separation by purpose (separate DB indexes, or separate Redis clusters if memory pressure forces it):

| DB | Use |
|---|---|
| 0 | Application cache (Eloquent caches, config cache, Buzz score cache) |
| 1 | Queues (Horizon) |
| 2 | Rate limits (`throttle` middleware) |
| 3 | Locks (atomic critical sections like RP transfer, booking hold) |
| 4 | Broadcasting / Reverb presence |
| 5 | Sessions (admin portal only; mobile uses tokens) |

**Don't put queues and cache on the same Redis instance once load is real** — separate instances at V1 so a `cache:clear` can't nuke jobs.

### 4.3 Search — Meilisearch

- Powers: club discovery, player search, venue search, competition search, zone leaderboards browsing.
- Sync via Laravel Scout + queued indexer jobs on the `bulk` queue.
- **Two indexes per entity:** public and admin (admin sees unverified/restricted rows).
- Trust + Moderation clearance flags are indexed so filtering "verified only" or "moderation_clean" is O(index lookup).

### 4.4 Object storage — Cloudflare R2

- **Why R2:** zero egress fees, S3-compatible, well-suited to image-heavy mobile traffic in West Africa.
- **Buckets:**
  - `kalaanba-public` — verified share cards, public venue photos, club logos
  - `kalaanba-media` — match media, signed-URL access
  - `kalaanba-evidence` — dispute evidence, **always private**, signed short-TTL URLs only
  - `kalaanba-backups` — DB and config backups
- **Image pipeline:** Cloudflare Images (or self-hosted `imgproxy`) for on-the-fly resize/format. Original stays in R2, variants served from edge.

### 4.5 Backup & DR

- **Postgres:** nightly base backup + continuous WAL shipping to R2. PITR window: 7 days.
- **R2:** versioned buckets, lifecycle to cold storage after 90 days for backups.
- **Redis:** AOF + nightly RDB snapshot. Acceptable to lose <1 minute of cache.
- **Restore test monthly.** A backup that hasn't been restored is a hope, not a backup.

---

## 5. Frontend — Next.js 15

The brief is explicit (§2.2 principle 4 and §11.1): the **backend owns rules; the frontend renders**. The Next.js app is a presentation tier — it reads engine outputs, displays them, captures user intent, and hands intent back to Laravel. No business logic lives in React.

### 5.1 Rendering strategy per surface

| Surface | Mode | Why |
|---|---|---|
| Landing, marketing, about | **SSG** | Static, edge-cached |
| Public tournament page `/[slug]` | **ISR** (revalidate 60s) + tag-based revalidation on result confirmation | Highest-leverage public surface, must be fast and fresh |
| Club / Venue / Player public pages | **ISR** (revalidate 300s) + on-demand revalidate via webhook from Laravel | Public, cacheable |
| Fan Buzz / Feed / Discovery | **SSR (RSC) with streaming** + Redis-cached aggregates | Personalized but cacheable per segment |
| Organizer dashboard, match entry, challenge UI | **SSR (RSC) + client islands** | Authenticated, fresh |
| Live match view | **Client component + Reverb WebSocket** | Realtime |
| Admin portal | **Client-rendered SPA shell** | Heavy interactivity, low traffic |

### 5.2 Runtime

- **Node 20** with Next.js `standalone` output.
- **PM2** with one process per core, behind HAProxy.
- **Self-hosted on the VPS cluster.** At 500K DAU we own the runtime; no managed Vercel/Netlify dependency on the critical path.
- **Image optimization:** offloaded to Cloudflare Images. Never let Next.js node CPU do this in production.

### 5.3 Data fetching

- **Server components** call Laravel directly over the private network (HAProxy internal vhost).
- **Client components** use TanStack Query against `api.kalaanba.app` with bearer tokens.
- **Realtime** via `laravel-echo` + `pusher-js` configured for Reverb.
- **Shared cache** for `unstable_cache` / `revalidateTag` lives in the Redis cluster (Next.js custom cache handler).

### 5.4 BFF discipline

Next.js Route Handlers (`app/api/...`) are **only** for:
- Cookie ↔ token translation
- Server-only secrets (PSP webhook verification before forwarding)
- Image proxying when Cloudflare can't help

Business logic stays in Laravel. The brief is explicit: backend owns rules; frontend renders.

---

## 6. Realtime — Laravel Reverb

- **Self-hosted WebSocket server**, official Laravel package, Pusher-protocol compatible (so `laravel-echo` on the frontend works unchanged).
- **2 dedicated nodes** behind HAProxy with **sticky sessions for WS only** (cookie or IP hash).
- **Channels:**
  - `private-match.{id}` — live score, events, lineup changes
  - `private-challenge.{id}` — challenge status transitions
  - `private-user.{id}` — personal notifications
  - `presence-admin.queue.{type}` — admin sees other admins in the same review queue
  - `private-booking.{id}` — booking status (payment confirmed, etc.)
- **Capacity:** Reverb comfortably handles ~10k concurrent connections per node. At 500K DAU, expect 30–80k concurrent at peak. 2 nodes is the floor; scale to 4 if needed.
- **Auth:** Sanctum token verified by a Reverb broadcasting auth route in Laravel.

---

## 7. The Engines — Implementation Notes

This section maps each of the 17 engines from the brief to concrete implementation patterns. The brief is the contract; this is the build sketch.

### 7.1 Season Engine
- Cron via `schedule:work` on **one** worker node (Redis lock to prevent dupes).
- Phase transitions (April 1 reset, March transition, Feb cutoffs) fire domain events that all other engines subscribe to.
- `seasons.current` is cached in Redis and on every engine boot.

### 7.2 Club Engine
- Maturity progression is event-driven: actions add eligibility, never a manual upgrade.
- Related-club detection runs on the `integrity` queue: graph queries over `owner_user_id`, device fingerprints, squad overlap.
- Archive ≠ delete. `clubs.status` enum: `active|inactive|dormant|archived|merged`. Merge writes a redirect record so old URLs and references resolve.

### 7.3 Player & Affiliation Engine
- Ghost players: rows with `user_id IS NULL`, `phone` optional, claimable via OTP.
- Affiliations are **versioned** (start/end dates, type: joined/transferred/loaned/left).
- Stats are computed by listeners on `matches.result_confirmed` **only after** Trust emits `trust.stats_cleared`.

### 7.4 Match / Fixture Engine
- Lifecycle is a state machine (Spatie Model States or hand-rolled with enum + transition table). Illegal transitions throw and audit-log.
- `match_events` is append-only (goals, cards, subs). The "current score" is a projection rebuildable from events.
- Online-only live entry in V1 (brief §7.3). Mobile clients debounce + retry; conflicts resolved server-side by `client_event_id` idempotency keys.

### 7.5 Competition & Rules Engine
- Rule set stored as a versioned JSON blob; **locks after first confirmed result**. Subsequent changes require Critical approval and a new version with effective date.
- Standings are a materialized table refreshed by a job on `matches.result_confirmed` for that competition.
- Public page rendered by Next.js ISR with a tag revalidated on every standings update.

### 7.6 Challenge Engine
- Stake calculation reads RP tier + config (floor, cap, % stake) — all from Admin Config.
- Locking RP: atomic Postgres advisory lock + ledger entry in one transaction. No way to over-lock.
- 72h and 4-day windows enforced by scheduled jobs that fire `challenges.expired` events.
- 2-of-3 verification: a `verifications` table with `(challenge_id, party, decision, at)`. A job evaluates after each vote.

### 7.7 RP Economy Engine
- **`rp_ledger`** is the source of truth. Wallet balances are projections, never directly mutated.
- Every ledger entry: `entity_type, entity_id, amount, reason, source_event_id, balance_before, balance_after, season_id, occurred_at`.
- Anti-farming sits in listeners: repeat-pairing decay, related-club blocks, new-club gating. All decisions write their reasoning into the ledger entry's `reason` field for auditability.

### 7.8 Zone Engine
- Geographic hierarchy is reference data, admin-managed, versioned per season.
- Inter-zone records and leaderboards are derived materialized tables, refreshed by jobs.
- Reads RP outputs; never writes RP.

### 7.9 Venue, Surface & Booking Engine
- **Surface calendar** is the bookable resource, not the venue.
- Booking state machine: `draft → slot_selected → hold_created → approval_pending|payment_pending → confirmed → linked_to_fixture → completed|cancelled|refunded|no_show|disputed`.
- Holds expire via scheduled jobs (default 10 min, configurable).
- **PSP integration:** abstract `PaymentProvider` interface. V1 implementation: Paystack (Ghana) with webhook for capture + manual settlement; commission recorded in `bookings.settlement` table. Split-payouts via PSP later when supported cleanly.
- Offline blocks are first-class — they participate in the same calendar table with `source = 'offline_manual'`.

### 7.10 Referee & Officiator Engine
- Three referee types share a single `referees` table with a `kind` discriminator.
- Trust weights stored in Admin Config, applied by the verification logic in §7.13.
- No marketplace, no payments, no public ratings in V1.

### 7.11 Trust & Verification Engine
- **Rule-based, deterministic, auditable.** No AI in V1.
- Inputs: confirmation parties, referee type, evidence presence, repeat-pairing signal, related-club signal, caution levels.
- Outputs (stored, not recalculated): `verificationStatus`, `trustLevel`, `cautionLevel`, `rpClearance`, `statsClearance`, `standingsClearance`, `challengeSettlementClearance`, `archiveClearance`, `reviewFlag`.
- **Decision Trace** is a JSON document attached to each clearance record: which rules were evaluated, which fired, the verdict, the recommended action, the override history.
- Super Admin override writes a `trust_overrides` row with previous/new status, reason, affected systems, evidence reference, timestamp.

### 7.12 Fan Buzz, Feed & Discovery Engine
- Buzz score = weighted sum of normalized interaction counts with content-type-aware decay.
- Scores updated **incrementally** in Redis sorted sets keyed by surface (`zsadd buzz:hub:tamale <score> <entity_id>`); periodically reconciled to Postgres.
- Feed = Redis sorted set per (user_segment, surface), regenerated by a job, cheap to read.
- Soft-follow inference is a nightly job; results stored on `user_interests`.
- **Cannot mint RP, settle challenges, or update standings.** Hard architectural separation — Buzz module has no write access to RP/Match/Competition schemas.

### 7.13 Awards & Recognition Engine
- Cadence runs as scheduled jobs (matchday after each confirmed match, weekly Sunday night, monthly first of month, season-end on closing).
- Candidate generation reads Trust + stats clearance flags; rejects anything not cleared.
- Card generation: Laravel job → render template via `puppeteer-laravel` or `chrome-php` → upload to R2 → emit `awards.card_ready`.
- Moderation gate before publication.
- Corrections preserve history: a revoked award keeps its row with `revoked_at`, plus a compensating record.

### 7.14 Moderation & Safety Engine
- Two-layer screening: rule-based regex/list match → admin review queue.
- **Safe default copy library** keyed by context (`challenge.copy.default`, `award.headline.default`). Business flows never stall waiting for moderation — they substitute the safe default and queue the original for review.
- Restriction levels are progressive and applied via a `restrictions` table on user/club/venue.

### 7.15 Notification & Distribution Engine
- **Outbox pattern** (already in §3.5) carries every notification intent.
- Workers fan out: WhatsApp (Meta Cloud API), in-app (Reverb broadcast + DB row for inbox), later SMS/email/push.
- Reminders use scheduled jobs with idempotency keys so retries don't double-fire.
- **Quiet hours and preferences** stored on user; checked before send.
- Delivery audit log: `notifications.delivery_log` (provider, status, latency, error, retried_at).
- Public distribution always passes through Moderation clearance check at send time, not just at content creation.

### 7.16 Analytics, Insights & Intelligence Engine
- **Event-first, from day one.** Every meaningful action emits an `analytics.events` row with the standard payload.
- Standard payload: `event_id, event_name, schema_version, occurred_at, actor_id, actor_role, session_id, source, device, context_json, properties_json`.
- **Storage:** append-only Postgres table partitioned daily for V1. Move to ClickHouse if/when query patterns exceed Postgres's comfort (typically past several hundred million rows).
- **Derived metrics** are nightly jobs that write to `analytics.metrics_daily` (small, indexed, fast to query for dashboards).
- **Dashboards:** Metabase or Grafana against a read-replica + the derived tables. Not the primary.
- **Schema registry:** events are defined in code (`app/Modules/Analytics/Schemas/`), versioned, validated at emit time. Producer can't ship an event the schema doesn't know.

### 7.17 Admin Configuration & Governance Engine
- Config table as in §3.8.
- Governance workflows are state machines on `admin_workflows` rows.
- Audit log: append-only `admin.audit_log` partitioned by month; every admin write produces a row.
- UI: admin portal (Next.js, client-rendered) with strict role-based access; Super Admin section gated behind a second factor.

---

## 8. Cross-Cutting Concerns

### 8.1 Idempotency
- Every mutating public endpoint accepts an `Idempotency-Key` header.
- Stored in Redis with the response envelope for 24h; retries return the cached response.
- Internal jobs use `(event_id, listener_name)` dedupe rows in Postgres.

### 8.2 Distributed locks
- Redis with `redlock` semantics via Laravel's `Cache::lock()`.
- Used for: RP transfer, booking slot hold→confirm, challenge accept, scheduler leader election, match result-confirmed transition.
- Always with a TTL; jobs that hold a lock past their TTL crash visibly rather than silently corrupt data.

### 8.3 Rate limiting
- Edge: Cloudflare rate-limit rules per route family.
- App: `throttle:api` on Redis, per-user **and** per-IP, per-route-family.
- Specifically tuned for: OTP requests (3/min/phone), reaction spam (60/min/user), share (30/min/user), challenge issue (5/day/club), booking attempts (10/min/user).

### 8.4 Money & ledgers
- All monetary amounts in **integer minor units** (pesewas, kobo). Never floats.
- Booking payments use `bookings.payments` with provider reference; commission and settlement on `bookings.settlement`.
- **RP is never money.** Separate ledger, separate code path, separate audit. The two never share a table.

### 8.5 PII & evidence
- Phone numbers indexed but stored only as needed; hashed copy for dedupe.
- Evidence files (dispute photos, screenshots) in private R2 bucket, signed URLs with 5-minute TTL, audit-logged access.
- Minor-protected players: row-level visibility flag enforced at query layer + frontend.

### 8.6 Internationalization & copy
- English V1, framework-ready (`__()`/`trans()` everywhere).
- User-facing labels come from Admin Config where they're business-meaningful (RP tier names, status display strings) so they're swappable without deploys.

### 8.7 Time
- Server time UTC. Display in `Africa/Accra`. Season cutoffs evaluated against `Africa/Accra` because the brief is explicit about dates.

---

## 9. Security

- **TLS everywhere.** Cloudflare → LB origin uses authenticated origin pulls.
- **Private network** (WireGuard mesh or provider VPC) between all nodes; no public DB/Redis ports.
- **Secrets:** environment-injected via deploy tool, optionally backed by HashiCorp Vault or Doppler later. Never committed.
- **SSH:** key-only, no root, Fail2ban, port-knocking optional.
- **WAF:** Cloudflare managed rules + custom rules for OWASP Top 10.
- **CSRF:** on admin web routes; not needed for token-auth API.
- **CORS:** strict allow-list (the Next.js origins).
- **Dependency scanning:** Dependabot, `composer audit`, `npm audit`, weekly review.
- **Sanitization:** every public-displayed string passes Moderation screening before render (per brief §7.12).
- **Audit:** append-only `admin.audit_log` for every admin/Super Admin action.

---

## 10. Observability

| Concern | Tool |
|---|---|
| Metrics | Prometheus + Grafana (self-hosted) |
| Logs | Loki + Promtail; Laravel logs JSON to stdout |
| Errors | Sentry (Laravel + Next.js) |
| Traces | OpenTelemetry → Tempo |
| Uptime | UptimeRobot or BetterStack |
| APM | Laravel Pulse (always) + Telescope (sampled in prod) |
| Queue health | Horizon dashboard |
| Realtime | Reverb metrics + custom Grafana board |

**Alert on:** p95 latency > 500ms, 5xx rate > 0.5%, queue depth > 5000 on `default`, queue depth > 50000 on `analytics`, replication lag > 30s, Redis memory > 80%, disk > 80%, override frequency anomaly, delivery failure rate > 5% on WhatsApp.

**Engine-specific dashboards** (per brief §11.6): active clubs, verified matches, RP-eligible matches, hot fixtures, dispute queue depth, override frequency, booking funnel, challenge funnel, signup funnel.

---

## 11. Capacity Plan (V1 launch baseline)

| Role | Nodes | Spec each |
|---|---|---|
| Load balancer (HAProxy) | 2 | 2 vCPU / 4 GB |
| Next.js | 4 | 4 vCPU / 8 GB |
| Laravel (FrankenPHP) | 6 | 8 vCPU / 16 GB |
| Horizon workers | 2 | 4 vCPU / 8 GB |
| Reverb (WebSockets) | 2 | 4 vCPU / 8 GB |
| Postgres primary | 1 | 16 vCPU / 64 GB / NVMe |
| Postgres replicas | 2 | 8 vCPU / 32 GB / NVMe |
| Redis (Sentinel) | 3 | 4 vCPU / 16 GB |
| Meilisearch | 2 | 4 vCPU / 16 GB |
| Observability | 1 | 4 vCPU / 16 GB |
| **Total** | **~25** | |

Estimated peak load: **500–1,500 req/s** at the API tier; sustained **~80 req/s** average. Each Laravel/FrankenPHP node handles 200–400 rps warm. Headroom built in.

**Cost order of magnitude:** ~€1,500–2,000/month on Hetzner-class hardware. More on DO/Linode/Vultr. Storage egress is the largest variable — choosing R2 over S3 saves significant money in West Africa.

---

## 12. Scaling Path

1. **Vertical first** on Postgres primary until replica reads are fully saturated.
2. **Horizontal** on stateless tiers (Next.js, Laravel, workers) — autoscale on CPU and queue depth.
3. **Cache aggressively**: Cloudflare → Redis → DB. Most GETs to public surfaces must never reach Laravel.
4. **Read replicas → table-level sharding** only past ~1M DAU and only on the obvious hot tables (analytics events, match events).
5. **Queue everything**: if a request doesn't need a result, dispatch it.
6. **Pre-compute hot reads**: standings, leaderboards, feeds, dashboards — materialized tables or Redis sorted sets refreshed by jobs.
7. **Extract a module to its own service** only when its load profile demands it (most likely candidates over time: Analytics, FanBuzz, Notifications). Module boundaries already permit this without rewriting consumers.

---

## 13. Build Phasing (mapped to brief §14)

### Phase A — Alpha (validate football loop)
- Infra: 1 LB, 1 Next, 2 Laravel, 1 worker, 1 Postgres, 1 Redis, 1 Meili, R2.
- Modules: Identity, Geography, Clubs, Players, Matches (basic), Trust (minimum viable), Notifications (in-app only), Analytics (event capture), AdminConfig (read-only UI).
- Frontend mock layer still serves the demo dataset alongside the real API.

### Phase B — Private Beta (validate operations + drama)
- Infra: add second Laravel node, second worker node, Postgres replica, Reverb.
- Modules: Challenges, RpEconomy, Venues, Bookings (no payments yet), Referees, FanBuzz (basic), Awards (matchday + per-competition), Moderation, Notifications (WhatsApp added).
- WhatsApp Cloud API integration live.

### Phase C — V1 (public acquisition + revenue)
- Infra: full §11 baseline.
- Modules: Bookings payments + commission + settlement, Awards (weekly/monthly), full FanBuzz, full Moderation, full AdminConfig UI, V1 dashboards.
- PSP (Paystack) integration in production.

### Phase D — Post-V1 (depth)
- Per brief §10.2: group stages, auto fixtures, paid competitions, referee marketplace, comments, AI-assisted admin review, offline-first live match entry.

---

## 14. Open Architecture Questions — Decisions

The brief left 10 questions open (§15). The architecture answers each:

| # | Question | Decision |
|---|---|---|
| 1 | Event bus implementation | **Redis Streams** for V1 (already running). Migrate to NATS if multi-region or strict ordering across partitions becomes critical. |
| 2 | Raw analytics storage | **Append-only Postgres**, daily-partitioned, retention 13 months. Move to ClickHouse only when query patterns force it. |
| 3 | PSP integration | **Paystack** as V1 provider (Ghana coverage). Wrap behind `PaymentProvider` interface. Fall back to "Kalaanba collects + manual settlement" until clean splits available. |
| 4 | WhatsApp delivery | **Meta WhatsApp Cloud API** direct integration. Templates pre-approved. BSP only if rate limits or onboarding push us. |
| 5 | WebSocket infrastructure | **Laravel Reverb** self-hosted, sticky sessions for WS only. |
| 6 | Config store | **DB table + Redis cache layer**, not a separate service. Effective-dated, versioned, audit-logged. |
| 7 | Audit log store | **Separate schema in primary Postgres**, append-only, partitioned monthly. Move to dedicated store only at very high write volume. |
| 8 | Authorization model | **Laravel Policies** + scope middleware (hub, club, competition, venue) + role tier. Super Admin always audited. |
| 9 | Search layer | **Meilisearch** V1. Postgres FTS only as fallback for tiny entities. |
| 10 | Match presence / check-in | **GPS check-in** stored on `match_checkins` (lat/lng/accuracy/at), manager/referee marks stored similarly. Used as Trust signal, never blocking. |

---

## 15. Critical Anti-Patterns to Avoid

- Running Postgres on the same node as PHP. Don't.
- Synchronous WhatsApp/email/SMS in request cycle. Queue it.
- File-based sessions or file cache. Redis.
- Local uploads to disk. R2 always.
- Cron without distributed lock — duplicate runs across nodes.
- Eloquent without eager loading on list endpoints. N+1 is the silent killer at 500K DAU.
- Mutating RP balances directly. Always via ledger entry.
- Letting Buzz writes touch RP/Match/Competition schemas. Architectural separation.
- Hardcoding RP values, windows, thresholds, labels. Read from Admin Config.
- Skipping idempotency on user mutations. Mobile networks retry; you will double-write.
- Mixing queue and cache on one Redis instance once load is real.
- Letting Moderation block business flows. Use safe default copy and queue the original.
- Recalculating Trust clearance per page load. Store the outputs.
- Foreign keys across module schemas. Use IDs and integrity workers.

---

## 16. Summary

Kalaanba's product is rich (17 cooperating engines, a reputation economy, a verification gate, a venue-booking layer, a moderation layer, day-one analytics) but its runtime is **deliberately conventional**: Laravel modular monolith + Next.js + Postgres + Redis + Meili + R2 + Reverb on a small VPS cluster. Boring infrastructure underneath dramatic product — the architecture follows the brief's own slogan:

> **Public drama on the surface. Boringly fair rules underneath.**

Every engine boundary in the brief is a module boundary in the codebase. Every "configurable" in the brief is a row in the Admin Config registry. Every "verified before official" in the brief is a clearance flag the Trust module writes and other modules read. Every "capture history, never delete" is an outbox row, a ledger entry, an audit log line, or an archive transition.

Build the modular monolith. Enforce the boundaries. Cache aggressively. Queue everything non-critical. Read Trust outputs, don't recompute them. Read Admin Config, don't hardcode. Keep the ledger honest. Trust the outbox.

That gets us to 500,000 DAU on ~25 VPS nodes, with a clean path to extract services later only if and when scale truly forces it.
