# ADR-0001: Modular monolith with schema-per-engine + outbox event bus

- **Status:** Accepted
- **Date:** 2026-05-12
- **Work Packet:** N/A (foundational; pre-dates pipeline)
- **Affected engines:** All 17

## Context

Kalaanba comprises 17 bounded engines (Club, Player & Affiliation, Match, Season, RP Economy, Challenge, Trust, Zone, Venue, Referee, Notification, Fan Buzz, Moderation, Admin Governance, Competition, Awards, Analytics). Several engines are tightly coupled at the conceptual level (e.g. Match → Trust → RP → Awards) but must remain independently scalable and independently lintable for AI-assisted development. We target 500K DAU on ~25 Hetzner VPS nodes with grassroots Ghanaian football as the workload, where data integrity (Trust, RP ledger) and brand safety (Moderation) matter more than feature velocity.

A pure microservice topology adds operational cost we cannot justify pre-traction. A monolithic shared schema lets engines silently couple, which is the exact failure mode the brief warns against (FanBuzz must never mint RP, Moderation must never own football truth, etc.).

## Decision

Adopt a **modular monolith** in Laravel 11 with the following constraints:

1. One Laravel module per engine under `app/Modules/<Engine>/` with a fixed internal shape (`Domain / Application / Infrastructure / Http / Listeners / Jobs / Contracts / Policies / Config / Tests`).
2. **One Postgres schema per engine.** Cross-schema foreign keys are forbidden. Deptrac (or Pest Architecture) enforces this in CI.
3. All cross-engine effects flow through a **transactional outbox**: writes happen to the local schema + an `outbox_events` row in the same transaction; an `OutboxRelay` worker dispatches to Redis Streams; consumers are idempotent listeners deduped by `(event_id, listener_name)`.
4. Event names follow the `engine.action` convention and are versioned in `contracts/events/`.
5. The RP ledger is append-only and partitioned by season; balances are projections.
6. Money is integer minor units (pesewas) at every layer.

## Alternatives considered

- **Microservices from day one** — Rejected. Operational cost (deployment, observability, distributed tx) outpaces value at our scale and team size.
- **Shared schema monolith** — Rejected. The brief's engine boundaries are load-bearing for product trust (Trust gating RP, etc.); a shared schema lets boundaries erode silently.
- **Kafka for the event bus** — Rejected. Redis Streams meets our throughput (well under the per-partition limits at 500K DAU) and removes a major piece of operational complexity. Reassess if/when we extract Notification, Analytics, or Buzz as standalone services.

## Consequences

### Positive

- Engines can be extracted to standalone services later with no application code rewrite — only deployment topology and the relay worker change.
- AI agents can be constrained per engine; `Deptrac` failing CI is mechanical enforcement of the same rules our Constitution states.
- The append-only ledger and outbox patterns are auditable by default.

### Negative

- Outbox + relay adds latency vs in-process listeners (acceptable; users do not perceive sub-second relay delays for cross-engine effects).
- Schema-per-engine forbids cross-engine joins; read-heavy dashboards must use projections or denormalised tables.
- Eventual consistency between engines must be reasoned about explicitly (integrity workers ship in Stage 0).

### Follow-up

- Stage 0 ships Deptrac config, the outbox tables, and a dummy `health.ping` event end-to-end as the proof-of-life gate.
- Post-V1: reassess Kafka vs Redis Streams once Notification, Analytics, or Buzz hit capacity limits.
