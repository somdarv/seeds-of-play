\`\`\`markdown name=Kalaanba\_Product\_Brief.md  
\# Kalaanba Product Brief

\*\*Status:\*\* Pre-architecture consolidation    
\*\*Date:\*\* 2026-05-12    
\*\*Source:\*\* Locked engine system documents (Season, Trust & Verification, Venue/Surface/Booking, Zone, Admin Configuration & Governance, Analytics, Awards & Recognition, Challenge, Club, Competition & Rules, Fan Buzz/Feed/Discovery, Match/Fixture, Moderation & Safety, Notification & Distribution, Player/Affiliation, Referee/Officiator, RP Economy)    
\*\*Purpose:\*\* A single, architecture-ready product brief that synthesizes all locked engine directions into one coherent view of what Kalaanba is, who it is for, what it does, how the engines fit together, and what V1 must ship.

\---

\#\# 1\. Executive Summary

Kalaanba is a grassroots football platform that records and structures real-world football activity in cities like Tamale, Bolga, Kumasi, and Accra. It is built around the idea that grassroots football already exists — it just isn't credibly recorded, ranked, organized, booked, refereed, recognized, or distributed.

Kalaanba turns that activity into:

\- \*\*Trusted football records\*\* (verified matches, player stats, standings, archives).  
\- \*\*A reputation economy\*\* based on Respect Points (RP) — never money.  
\- \*\*Public football drama\*\* through Challenges, Fan Buzz, recognitions, and shareable cards.  
\- \*\*A booking and operations layer\*\* for venues, surfaces, and facility managers.  
\- \*\*A governance layer\*\* that keeps fairness, safety, and configurability under control.

Core product line:

\> \*\*Public drama on the surface. Boringly fair rules underneath.\*\*    
\> \*\*Results drive respect. Buzz drives visibility. Trust decides what counts.\*\*

\---

\#\# 2\. Vision and Core Principles

\#\#\# 2.1 Vision

Kalaanba should be the credible home of grassroots football: where neighborhood clubs, school teams, academies, workplace sides, and community crews can play real matches, build verified history, challenge each other publicly, fill local venues, get recognized weekly, and grow zone-level and city-hub rivalries — all without losing the informal feel of grassroots football.

\#\#\# 2.2 Core Principles (platform-wide)

1\. \*\*No money / no gambling.\*\* The currency is Respect Points (RP), not cash.  
2\. \*\*Verified before official.\*\* Nothing official updates until results are confirmed and Trust-cleared.  
3\. \*\*Configurable, not hardcoded.\*\* Every threshold, window, weight, percentage, label, and rule is admin-configurable. Internal keys stay stable; user-facing labels can change.  
4\. \*\*Engines own rules; the frontend displays results.\*\* Backend is the source of truth.  
5\. \*\*Capture history; never silently delete.\*\* Use archive, merge, version, audit, and compensating entries.  
6\. \*\*Banter is allowed; harm is not.\*\* Moderation protects public speech; Trust protects records.  
7\. \*\*Recognition must be continuous.\*\* Weekly recognitions create movement; season awards create legacy.  
8\. \*\*One source of truth per engine; flexible outputs per use case.\*\*  
9\. \*\*Start as a modular monolith.\*\* Not microservices.  
10\. \*\*Analytics from day one.\*\* Capture the smallest meaningful data point, in context.

\---

\#\# 3\. Users and Roles

\#\#\# 3.1 Primary Actors

| Actor | Description |  
|---|---|  
| Fan | Discovers, follows, reacts, predicts, shares, tracks. |  
| Player | Belongs to clubs; can be ghost or claimed; has verified stats once confirmed. |  
| Club Rep / Captain | Confirms results, lineups, stats, disputes, no-shows for V1. |  
| Club Admin / Owner | Manages club identity, members, season participation, challenges, high-risk decisions. |  
| Competition Organizer | Creates and runs competitions; confirms/overrides per rules. |  
| Referee | Officiates matches; high trust weight; submits reports. |  
| Community Officiator | Grassroots match overseer accepted by both sides. Lower trust weight than verified referee. |  
| Facility Manager / Owner | Manages venue, surfaces, calendar, bookings, payments, offline blocks. |  
| Hub Admin | Manages one City Hub: areas, zones, local competitions, disputes. |  
| Kalaanba Admin / Reviewer | Reviews disputes, flags, queues, moderation, verification. |  
| Super Admin | Full visibility and override. Every override audit-logged. |

\#\#\# 3.2 Secondary / System Actors

\- Notification & distribution channels (WhatsApp-first, in-app, later SMS/email/push).  
\- Payment Service Providers (for venue booking payments in V1).  
\- Analytics workers, integrity observers, moderation auto-screeners.

\---

\#\# 4\. Geographic Model

Kalaanba uses a \*\*football geography\*\*, not government boundaries:

\`\`\`  
Country → Region → City Hub → Zone / Belt → Area → Club  
\`\`\`

\- \*\*City Hub:\*\* the practical football home (e.g., Tamale City Hub).  
\- \*\*Zone:\*\* core competitive division inside a hub.  
\- \*\*Belt:\*\* outer/peri-urban directional zone.  
\- \*\*Area:\*\* the locality a club identifies with (Taha, Kukuo, Sakasaka).  
\- \*\*Territory:\*\* copy word for drama, not a data level.

Users pick \*\*Area first\*\*; the system maps Area → Zone/Belt. Admin-controlled, season-stable. A club may belong to one Zone but play in another Zone's venue. Club identity location, venue location, and match location are explicitly different fields.

\---

\#\# 5\. Calendar and Season Model

\#\#\# 5.1 Platform Season (locked)

\- \*\*April 1 → February 28/29\*\* is the active season.  
\- \*\*December–January:\*\* High Activity Peak.  
\- \*\*February:\*\* Final Run-In.  
\- \*\*March:\*\* Transition Month (closing, archive, setup, no new Season RP).  
\- \*\*Season participation cutoff:\*\* July 31\.  
\- \*\*Season RP hard-resets to 0 every April 1.\*\* Lifetime RP preserves legacy.  
\- \*\*Challenge cutoffs:\*\* Feb 7 (no new), Feb 14 (no acceptance), Feb 28/29 (all played).  
\- \*\*Closing window:\*\* March 1–14. \*\*Archive/setup:\*\* March 15–31.

\#\#\# 5.2 Calendars Are Core Infrastructure

A match/fixture is a specialized \*\*Event\*\*. Events sit on:

\- Club calendars  
\- Competition calendars  
\- Venue / surface calendars  
\- Referee / officiator calendars  
\- Challenge calendars  
\- Fan / follower calendars  
\- Training calendars (later)

V1 conflict checks prevent the same club, surface, or referee from being double-booked.

\---

\#\# 6\. The Engines (System Map)

Kalaanba is organized into a set of cooperating engines. Each owns a domain. Each emits events. Other engines read trusted outputs rather than recalculate.

\#\#\# 6.1 Engine Catalog

| \# | Engine | Role |  
|---|---|---|  
| 1 | \*\*Season Engine\*\* | Platform clock: phases, cutoffs, RP reset, archive timing. |  
| 2 | \*\*Club Engine\*\* | Club identity, roles, maturity, verification, related-club detection, archive/merge. |  
| 3 | \*\*Player / Affiliation Engine\*\* | Players, ghost players, claims, affiliations, transfers, official stats source. |  
| 4 | \*\*Match / Fixture Engine\*\* | Match lifecycle, events, calendars, walkover/abandonment/postponement, result confirmation gate. |  
| 5 | \*\*Competition & Rules Engine\*\* | Competitions, formats, rules, standings, brackets, public pages. |  
| 6 | \*\*Challenge Engine\*\* | Public call-outs, counter offers, RP-on-the-line drama, challenge fixtures, settlement. |  
| 7 | \*\*RP Economy Engine\*\* | RP minting, locking, transfer, ledger, tiers, anti-farming, stakes. |  
| 8 | \*\*Zone Engine\*\* | City Hub / Zone / Belt / Area mapping; inter-zone records; consumes RP outputs. |  
| 9 | \*\*Venue, Surface & Booking Engine\*\* | Venues, surfaces, manager portal, calendars, online bookings, commission, settlement. |  
| 10 | \*\*Referee & Officiator Engine\*\* | Referees, community officiators, split officiating, reports, trust weight, calendars. |  
| 11 | \*\*Trust & Verification Engine\*\* | Verification, evidence, disputes, confidence, caution levels, decision trace, Super Admin override. |  
| 12 | \*\*Fan Buzz, Feed & Discovery Engine\*\* | Attention layer: reactions, shares, tracks, follows, predictions, feed ranking, discovery. |  
| 13 | \*\*Awards & Recognition Engine\*\* | Matchday/weekly/monthly/season/competition recognitions, badges, shareable cards. |  
| 14 | \*\*Moderation & Safety Engine\*\* | Public content safety, reports, restrictions, safe defaults, escalation. |  
| 15 | \*\*Notification & Distribution Engine\*\* | Event-driven communication: WhatsApp \+ in-app first; outbox \+ workers \+ WebSockets. |  
| 16 | \*\*Analytics, Insights & Intelligence Engine\*\* | Event-first data nervous system; raw events → metrics → insights → future intelligence. |  
| 17 | \*\*Admin Configuration & Governance Engine\*\* | Config registry, governance workflows, approvals, audit logs, overrides, presets. |

\#\#\# 6.2 Engine Dependency Map (Read Direction)

\`\`\`  
                ┌─────────────────────┐  
                │ Admin Config & Gov  │ ← values, labels, approvals, overrides  
                └─────────┬───────────┘  
                          │  
                          ▼  
        ┌──────────────────────────────────────────────┐  
        │ Season │ Zone │ Club │ Player │ Venue │ Ref  │  Identity / Timing layer  
        └──────────────────────────────────────────────┘  
                          │  
                          ▼  
                ┌─────────────────────┐  
                │ Match / Fixture     │  The event  
                └─────────┬───────────┘  
                          │  
                          ▼  
                ┌─────────────────────┐  
                │ Trust & Verification│  Decides what counts  
                └─────────┬───────────┘  
            ┌─────────────┼──────────────┐  
            ▼             ▼              ▼  
        ┌────────┐  ┌────────────┐  ┌───────────────┐  
        │  RP    │  │ Competition│  │ Player stats  │  Official downstream effects  
        │ Economy│  │  & Rules   │  │ & history     │  
        └────┬───┘  └─────┬──────┘  └──────┬────────┘  
             │            │                │  
             └─────┬──────┴────────────────┘  
                   ▼  
        ┌────────────────────┐  
        │ Challenge Engine   │  Public reputation duels  
        └─────────┬──────────┘  
                  │  
                  ▼  
        ┌────────────────────┐  
        │ Awards & Recognition│  
        └─────────┬──────────┘  
                  │  
       ┌──────────┴──────────┐  
       ▼                     ▼  
┌────���─────────┐      ┌──────────────────┐  
│  Moderation  │ ───► │ Fan Buzz / Feed  │ ─► public surfaces  
└──────────────┘      └────────┬─────────┘  
                               │  
                               ▼  
                     ┌──────────────────┐  
                     │ Notifications &  │  
                     │ Distribution     │  
                     └────────┬─────────┘  
                              │  
                              ▼  
                     ┌──────────────────┐  
                     │    Analytics     │  Observes everything  
                     └──────────────────┘  
\`\`\`

\*\*Boundary rules:\*\*  
\- Match/Fixture records events. \*\*Nothing official updates until \`result\_confirmed \= true\`.\*\*  
\- Trust gates RP, stats, standings, challenge settlement, awards, archives.  
\- RP Engine is the only place RP moves. Zone, Awards, Buzz only read RP outputs.  
\- Buzz only affects visibility, never RP, standings, or match truth.  
\- Moderation gates public content distribution; Trust gates records.  
\- Admin Config supplies values; engines apply rules.

\---

\#\# 7\. Core Domain Concepts

\#\#\# 7.1 Clubs

\- Any shared football identity: informal crews, schools, academies, churches/mosques, workplace, institutions, facility-based teams, registered clubs.  
\- \*\*Maturity levels:\*\* Informal → Structured → Verified → Registered/Official.  
\- Public badge: \*\*Verified Club\*\* (single label). Internal: verification source \+ maturity.  
\- Onboarding is light (WhatsApp-group easy): name, City Hub, Area, contact.  
\- \*\*Roles:\*\* Owner, Co-founder, Admin, Manager, Captain, Scorer, Media Manager, Member/Viewer.  
\- \*\*Inactive at 3 months / Dormant at 6 months\*\* (configurable).  
\- \*\*Related clubs\*\* (same owner/admin/device/squad) can play, but: no Season RP, no Ranked Challenges, no RP transfer between them.  
\- \*\*Never delete.\*\* Archive, merge, version. "Formerly…" notice for 90 days after major identity changes.

\#\#\# 7.2 Players & Affiliations

\- Players exist as \*\*ghost players\*\* (referenced in lineups before claiming) or \*\*claimed/verified profiles\*\*.  
\- Affiliations to clubs are versioned (joins, transfers, loans, leaves).  
\- Stats become \*\*official only after \`result\_confirmed \= true\`\*\* and stats clearance from Trust.  
\- Minor-protected players have restricted public display.  
\- Free agent players supported; preferred number rules configurable.

\#\#\# 7.3 Matches / Fixtures

\- Five types: \*\*Friendly, Competition fixture, Challenge match, Internal match, Training event.\*\*  
\- Match duration is \*\*configurable\*\* (never assume 90 minutes).  
\- \*\*Lifecycle:\*\* Draft → Scheduled → Confirmed → Live → Awaiting Result → Verification Pending → Result Confirmed → Archived (with side states: Postponed, Cancelled, Walkover, Abandoned, Disputed, Void).  
\- \*\*Confirmation models:\*\*  
  \- Friendly: both club reps.  
  \- Competition: organizer/official authority.  
  \- Ranked Challenge: 2-of-3 (challenger \+ respondent \+ referee/officiator).  
  \- Referee-officiated: referee strongest weight.  
  \- Internal: club admin only.  
\- \*\*Walkover produces no player stats.\*\* \*\*Abandoned never auto-confirms.\*\*  
\- V1 live entry is \*\*online-only\*\*; offline-first deferred.  
\- Eligibility flags exposed: \`verified\`, \`rpEligible\`, \`statsEligible\`, \`standingsEligible\`, \`zoneEligible\`, \`challengeLinked\`, \`competitionLinked\`.

\#\#\# 7.4 Competitions

\- V1 formats: \*\*League and Knockout\*\* (manual fixture generation).  
\- Scopes: Internal, Open, Invitational, Official/Sanctioned.  
\- \*\*Challenges are NOT a competition format.\*\* They are club-level actions.  
\- \*\*Rules lock after first confirmed result\*\* (fairness-sensitive fields).  
\- Defaults: Win 3 / Draw 1 / Loss 0; default walkover 3-0 (configurable).  
\- Every competition can have a \*\*public, unlisted, or private page\*\*.  
\- Templates (community league, weekend cup, school competition, informal 5-a-side) are on-ramps, not destinations.  
\- Paid competitions, promotion/relegation, group stages, auto-generation: \*\*deferred\*\*.

\#\#\# 7.5 Challenges

\- Public reputation duels. Challenger puts RP on the line; respondent locks matching stake.  
\- \*\*Lifecycle:\*\* Drafted → Issued → Seen → Countered/Accepted/Declined/Ignored → Scheduling → Scheduled → Prediction Open → Live → Verification Pending → Resolved/Disputed/Forfeited → Archived.  
\- \*\*Unlock:\*\* 50 Season RP minimum to issue a Ranked Challenge.  
\- \*\*Stake \= max(tier floor, % stake), bounded by tier cap.\*\* Tiers: Unranked, Emerging, Rising, Local, Established, Elite, Crowned.  
\- \*\*Outcomes:\*\* winner takes locked stake; \*\*draw \= stood-ground cost\*\* to respondent (default 10% of stake, min 2 RP, max 15 RP).  
\- \*\*One counter offer\*\* per side in V1.  
\- 72-hour response window; 4-day scheduling window \+ optional extension (all configurable).  
\- \*\*Open Call-out Windows\*\* and \*\*Inter-Zone Leader Duels\*\* loosen restrictions for campaign periods.  
\- Public language: "Respect on the line", never "bet".

\#\#\# 7.6 RP Economy

\- \*\*Two RP movements:\*\* minted (small, slow, from verified activity) and transferred (larger, from challenge stakes).  
\- \*\*Standard verified match (RP-eligible):\*\* Win \+5, Draw \+3, Loss \+2 (configurable).  
\- \*\*One-time bonuses:\*\* Profile complete \+5; First verified match ever \+10. Off-season earnings are queued.  
\- \*\*Wallet:\*\* Available Season RP, Locked Season RP, Lifetime RP, Season Snapshot.  
\- \*\*Ledger:\*\* every gain/loss/lock/release/transfer/penalty/adjustment is recorded with reason, balance before/after, source.  
\- \*\*Anti-farming:\*\* repeat-pairing decay (full RP only for first 2 matches in 30 days between same clubs); new clubs cannot transfer ranked RP until minimum verification and 3 verified matches; related clubs blocked from RP transfer; Buzz cannot mint RP.

\#\#\# 7.7 Venues, Surfaces, Bookings

\- A \*\*venue\*\* has many \*\*surfaces\*\*. The surface owns the bookable calendar.  
\- Four location modes: \*\*bookable platform venue, listed venue, open/community venue, manual venue text\*\*.  
\- \*\*Facility manager portal\*\* with roles: Owner, Manager, Booking Attendant, Media Manager, Finance Viewer.  
\- \*\*Booking lifecycle:\*\* draft → slot\_selected → hold\_created → approval\_pending/payment\_pending → confirmed → linked\_to\_fixture → completed/cancelled/refunded/no\_show/disputed.  
\- \*\*Online payment is required in V1\*\* to confirm bookable slots. Commission is recorded; payouts can be manual/scheduled if PSP doesn't support clean splits.  
\- \*\*Offline blocks\*\* (phone, WhatsApp, walk-in, private events, maintenance) keep the calendar honest.  
\- Refunds, cancellations, no-shows, facility-unavailable flows are explicit and audit-logged.  
\- Capture rich media: daytime \+ nighttime \+ drone shots; GPS pins.

\#\#\# 7.8 Trust & Verification

\- The \*\*decision and clearance layer\*\*. Recommends; never silently executes irreversible actions.  
\- \*\*Verified vs RP-Eligible:\*\* all RP-eligible matches are verified, but not all verified matches are RP-eligible.  
\- \*\*Clearance outputs:\*\* \`verificationStatus\`, \`trustLevel\`, \`cautionLevel\`, \`disputeStatus\`, \`evidenceStatus\`, \`rpClearance\`, \`statsClearance\`, \`standingsClearance\`, \`challengeSettlementClearance\`, \`archiveClearance\`, \`reviewFlag\`.  
\- \*\*Decision Trace\*\* is auditable: rules checked, triggered, verdict, recommended action, override history.  
\- \*\*Super Admin override\*\* must capture previous/new status, reason, affected systems, evidence, timestamp.  
\- \*\*No AI for MVP decisions.\*\* Rule-based, event-driven, auditable, overrideable. AI can later assist admins.  
\- Final principle: \*\*The engine recommends. The platform records. The Super Admin can correct. The audit trail remembers.\*\*

\#\#\# 7.9 Referees & Officiators

\- Types: No official, Single community officiator, \*\*Split community officiators\*\* (one per period), Verified referee, Organizer-appointed official, Kalaanba-appointed referee.  
\- \*\*Trust weights:\*\* community medium → verified high → Kalaanba-appointed very high.  
\- Split officiating allowed for friendlies, internal, low-risk competitions; \*\*discouraged or blocked for high-RP challenges and finals\*\*.  
\- Reports are light in V1: match completed, score, no-show/walkover/abandoned flags, cards, key incidents, optional photo/video.  
\- \*\*No zone restriction in V1\*\*; referees are City Hub-wide.  
\- \*\*Marketplace, payments, public ratings: deferred.\*\*

\#\#\# 7.10 Fan Buzz, Feed & Discovery

\- \*\*Buzz drives visibility. Results drive respect.\*\*  
\- Contexts: Season, Competition, Hub, Zone/Belt, Challenge, Fixture, Club, Venue, Player Moment.  
\- Inputs: views (low), reactions (medium), shares (high), tracks (high), follows (high long-term), predictions (high event-time), comments (later), repeat visits, saved venues, booking clicks.  
\- Decay is content-type aware; freshness matters.  
\- Surfaces: Home feed, City Hub feed, Zone feed, Challenge Wall, Fixture/Club/Venue/Competition discovery, Player Moment feed.  
\- \*\*UI kit owned:\*\* Buzz badge, Heat meter, Engagement bar, Reaction picker, Track/Follow/Predict/Share buttons, Feed filter tabs, Admin feed controls.  
\- \*\*Soft-follow\*\* is inferred (track \+ share \+ repeat views) and personalizes feeds without spamming.  
\- \*\*Never\*\* mints RP, settles challenges, verifies matches, or updates standings.

\#\#\# 7.11 Awards & Recognition

\- \*\*Continuous cadence:\*\* Matchday → Weekly → Round → Monthly → Season → Historical.  
\- \*\*Performance recognition\*\* \= verified records \+ stats clearance.  
\- \*\*Buzz recognition\*\* \= attention only, clearly labeled.  
\- \*\*Hybrid\*\* \= explicitly weighted.  
\- \*\*Per-competition weekly goals and assists are V1-required.\*\*  
\- Examples: Goals of the Week, Assist King, Club of the Week, Most Buzzed Challenge, Hat-trick Hero, Zone Pulse, Season RP Champion.  
\- All cards must pass \*\*Trust clearance\*\* for performance and \*\*Moderation clearance\*\* for public distribution.  
\- Corrections preserve history (never silent edits).

\#\#\# 7.12 Moderation & Safety

\- Protects \*\*public speech, media, and amplification\*\* — not match truth.  
\- \*\*Risk levels:\*\* Clean → Watch → Hold for Review → Restricted → Hidden → Escalated.  
\- \*\*Statuses:\*\* submitted, auto\_screened, clean, watch, held\_for\_review, restricted, hidden, escalated, approved, edit\_requested, removed, restored, sanction\_recommended.  
\- Categories: Challenge copy, public accusations, comments (later), media, recognition cards, club/player/venue/competition/referee public fields.  
\- \*\*Safe default copy library\*\* so business flows don't fail when copy is held.  
\- Restriction levels are progressive (warning → public\_copy\_review → … → account\_suspended). Automatic punishment avoided in V1.  
\- \*\*Banter is allowed. Harm is not.\*\*

\#\#\# 7.13 Notification & Distribution

\- \*\*WhatsApp-first, in-app from V1.\*\* SMS, email, push deferred.  
\- \*\*Architecture:\*\* event listeners → outbox queue → background workers (delivery) \+ WebSockets (live UI updates).  
\- Notification (private/targeted) vs Distribution (public/shareable).  
\- Must consult Moderation before sending public messages or share cards.  
\- Reminders, quiet hours, preferences, channel fallback, delivery audit log.

\#\#\# 7.14 Analytics, Insights & Intelligence

\- \*\*Day-one mandatory infrastructure.\*\* Not a post-launch reporting feature.  
\- \*\*Event-first:\*\* standard event payload, stable \`domain.action\` event names, versioned schemas.  
\- Three layers: \*\*Raw events → Derived metrics → Insights/Intelligence.\*\*  
\- Categories: User, Club, Player, Match, Challenge, Venue, Competition, Buzz, Notification, Trust/Safety, Admin/Operations.  
\- \*\*Funnels tracked from day one:\*\* signup, club activation, match creation, venue booking, challenge, competition setup, player claim.  
\- Observes only. \*\*Does not replace\*\* domain engines as source of truth.  
\- AI-driven intelligence is deferred; raw capture is not.

\#\#\# 7.15 Admin Configuration & Governance

\- The control room. Every value, threshold, percentage, window, weight, label is \*\*configurable, scoped, versioned, audit-logged, effective-dated\*\*.  
\- \*\*Scopes:\*\* Platform default → Season → City Hub → Zone/Belt → Competition → Entity override.  
\- \*\*Approval levels:\*\* Low (immediate), Medium (admin confirmation), High (senior approval), Critical (Super Admin \+ possibly dual approval).  
\- \*\*Effective dates\*\* protect fairness — RP, tier, and competition rule changes prefer future activation.  
\- \*\*Overrides never erase history\*\* — use compensating entries and audit logs.  
\- Governance workflows: club verification, zone changes, related-club confirmation, duplicate merge, suspensions, dispute escalation, manual RP adjustment, match override, venue verification.

\---

\#\# 8\. Cross-Cutting Workflows

\#\#\# 8.1 The Football Loop (alpha → V1)

\`\`\`  
Create club → Add members/players → Create match  
→ Choose venue/location (manual or bookable)  
→ Optional: assign referee/officiator  
→ Play match → Enter result and events (online)  
→ Required parties confirm result  
→ Trust clearance → RP/Standings/Stats/Awards/Archive updates  
→ Public cards \+ Fan Buzz \+ Notifications  
→ Analytics events at every step  
\`\`\`

\#\#\# 8.2 The Challenge Loop

\`\`\`  
Club A has ≥50 Season RP → Issues Ranked Challenge with stake  
→ Public card published (after Moderation clearance)  
→ Fans react/share/track → Buzz rises  
→ Club B sees → Counters or accepts → RP locked on both sides  
→ Schedule: date/time/venue/format/referee → Fixture created  
→ Prediction window opens → Match played  
→ 2-of-3 verification (or referee-confirmed) → Trust clearance  
→ RP transferred per outcome (or stood-ground cost on draw)  
→ Result card distributed → Awards/Buzz/Notifications fired  
→ Ledgered, archived  
\`\`\`

\#\#\# 8.3 The Venue Booking Loop

\`\`\`  
Manager onboarded (direct, claim, or community-suggested)  
→ Surfaces defined → Calendar live → Pricing/rules set  
→ Club searches/discovers venue → Selects surface \+ slot  
→ Hold created → Online payment → Booking confirmed  
→ Linked to fixture → Notifications to clubs/referee/manager  
→ Offline blocks keep calendar honest  
→ Post-match: settlement tracked, commission recorded  
→ Cancellations/refunds/no-shows handled via Trust \+ Admin  
\`\`\`

\#\#\# 8.4 The Recognition Loop

\`\`\`  
Verified matches generate stats → End of week window closes  
→ Awards Engine generates candidates (by scope: platform/hub/zone/competition)  
→ Trust \+ stats clearance applied → Moderation clears card copy  
→ Auto-publish or admin review → Recognition cards distributed  
→ Buzz rises around winners → Player/club profile badges updated  
→ Archive at season end → Lifetime RP / Legacy preserved  
\`\`\`

\#\#\# 8.5 The Trust & Dispute Loop

\`\`\`  
Submission/claim raised → Engine emits evidence/clearance state  
→ If clean → official records update  
→ If disputed → RP locked, public copy restricted  
→ Evidence requested → Reviewed → Verdict  
→ Engine verdict vs Final verdict (Super Admin can override w/ reason)  
→ Compensating ledger entries if needed → Audit trail preserved  
\`\`\`

\---

\#\# 9\. Data Boundaries and Visibility

| Surface | Public | Private (admin/trusted only) |  
|---|---|---|  
| Verified fixtures & results | ✅ | — |  
| Public challenge cards | ✅ (after moderation) | Pre-acceptance details |  
| Competition standings/brackets | ✅ (if competition is public) | Internal/private competitions |  
| Player public cards | ✅ (claimed, non-minor) | Minor-protected, unclaimed ghosts |  
| Venue pages | ✅ (verified/listed) | Manual venue text not yet reviewed |  
| RP balances & history | Club-visible; some elements public | Ledger detail private |  
| Evidence files | ❌ | Always private unless cleared |  
| Admin notes, dispute details, override reasons | ❌ | Super Admin / Governance only |  
| Phone numbers, screenshots, identity docs | ❌ | Privacy-protected |  
| Audit logs | ❌ | Admin/Super Admin only |

\---

\#\# 10\. V1 Scope (What Ships)

\#\#\# 10.1 Must-Have in V1

\*\*Identity & Geo\*\*  
\- Club creation (informal-friendly), maturity levels, Verified Club badge  
\- City Hub \+ Area selection, Area → Zone/Belt mapping  
\- Player records with ghost players and claim flow

\*\*Football activity\*\*  
\- Friendly, Competition, Challenge, Internal match types  
\- Manual fixture creation, online live entry, configurable duration  
\- Score, scorers, cards, lineups  
\- Walkover, Postpone, Cancel, Abandoned handling  
\- Result confirmation gate

\*\*Competitions\*\*  
\- League and Knockout formats  
\- Manual fixtures, organizer-added teams  
\- Configurable rules, rules-lock after first confirmed result  
\- Public/unlisted/private competition pages  
\- Per-competition Top Scorer / Top Assist (Awards integration)

\*\*Challenges & RP\*\*  
\- Issued → Accepted → Scheduled → Verified → Resolved lifecycle  
\- 50 RP unlock threshold; tier-based stake floor/cap  
\- 2-of-3 verification, locked RP, draw stood-ground  
\- One counter offer; configurable windows  
\- Standard match RP (Win+5 / Draw+3 / Loss+2) with anti-farming

\*\*Trust & Verification\*\*  
\- Verification statuses, evidence handling for disputes, no-show flow  
\- Caution levels, Decision Trace, Super Admin override, audit trail  
\- Stored clearance outputs consumed by other engines

\*\*Venues & Booking\*\*  
\- Venue \+ surface profiles, manager portal, surface calendar  
\- Offline blocks, booking hold/payment/confirmation, fixture linkage  
\- Online payment \+ commission record \+ settlement tracking  
\- Cancellation/refund statuses, admin verification queues

\*\*Referees\*\*  
\- Single community officiator, split community officiators, verified referee  
\- Acceptance, calendar conflict prevention, light V1 report

\*\*Fan Buzz, Feed & Discovery\*\*  
\- Reactions, shares, tracks, follows, predictions  
\- Home/Hub/Zone feeds, Challenge Wall, discovery cards  
\- Buzz badges, engagement bars, share cards  
\- Soft-follow, anti-manipulation basics

\*\*Awards & Recognition\*\*  
\- Matchday cards (scorer, hat-trick, clean sheet)  
\- Weekly recognitions (Goals/Assists of the Week, Club of the Week, Challenge of the Week)  
\- Per-competition Goals/Assists/Top Scorer leaderboards  
\- Profile badges, season award snapshots  
\- Admin review queue, Trust \+ Moderation clearance

\*\*Moderation & Safety\*\*  
\- Rule-based screening, report flow, admin queue  
\- Held/restricted/hidden states, safe default copy  
\- Public/private visibility rules, progressive restrictions

\*\*Notification & Distribution\*\*  
\- WhatsApp \+ in-app  
\- Event-driven outbox \+ workers; WebSockets for live UI  
\- Reminders, delivery audit log, share cards

\*\*Analytics\*\*  
\- Event capture on all major flows (signup, club, match, venue, challenge, competition, player claim)  
\- Raw events, derived metrics, V1 dashboards (platform, club, venue, competition, trust)  
\- Schema registry, sessions, source/device tracking, retention rules

\*\*Admin Configuration & Governance\*\*  
\- Config registry, audit logs, manual versioning, presets  
\- Core settings exposed: RP values, thresholds, season dates, challenge windows, ghost expiry, match presets, walkover defaults  
\- Super Admin override capture with reason

\#\#\# 10.2 Explicitly Deferred (Post-V1)

\- Promotion/relegation, group \+ knockout, auto fixture generation  
\- Paid competitions, prize pools, entry fees  
\- Referee marketplace, referee payments, public referee ratings  
\- Full comment system, fan voting, fan reputation  
\- AI-driven trust/moderation decisions  
\- Offline-first live match entry  
\- Advanced public trust scores and automated punishments  
\- Subscriptions, sponsorships, promoted listings  
\- Self-hosted SLM, AI dashboard queries, advanced personalization  
\- Bulk tournament booking automation  
\- All-time / cross-season advanced analytics

\---

\#\# 11\. Non-Functional Requirements

\#\#\# 11.1 Architecture

\- \*\*Modular monolith\*\* at start, with clean engine boundaries to migrate later if needed.  
\- \*\*Event-driven\*\* between engines via event bus / outbox.  
\- \*\*Workers/queues\*\* for delivery, analytics rollups, integrity checks, recognition generation.  
\- \*\*WebSockets\*\* for live UI surfaces (notifications, admin queues, live match).  
\- \*\*Backend owns rules; frontend renders.\*\* No business logic in React.

\#\#\# 11.2 Reliability

\- Outbox pattern for all engine events (so notifications and analytics are never lost on action latency).  
\- Idempotency keys on all user-triggered events (match submit, payment, booking, reaction).  
\- Compensating entries for corrections; never silent edits.  
\- Retry policies for WhatsApp/PSP integrations.

\#\#\# 11.3 Performance

\- User actions must not wait for analytics/notification delivery.  
\- Trust decisions and clearance outputs are \*\*stored\*\*, not recalculated per page load.  
\- Heavy checks (farming, related-club signals, abnormal patterns) run in background workers.  
\- Buzz scoring runs incrementally; not on every read.

\#\#\# 11.4 Security & Privacy

\- Phone numbers, evidence, screenshots, minor data, override reasons, audit notes are \*\*private by default\*\*.  
\- Public share cards must only contain data cleared for publication.  
\- Device IDs are privacy-safe (deduplication only).  
\- Audit logs are append-only and admin-scoped.  
\- All admin actions and Super Admin overrides require reasons.

\#\#\# 11.5 Configurability

\- No hardcoded business values. All values pulled from Admin Config (with sensible defaults).  
\- Internal keys stable; user-facing labels swappable.  
\- Effective-dated changes for fairness-sensitive rules.

\#\#\# 11.6 Observability

\- Analytics event log is the activity backbone.  
\- Engine logs, queue depths, delivery rates, failure rates, override frequencies, dispute throughput visible to admins.  
\- Metric definitions are explicit (active club, verified match, RP-eligible match, hot fixture, etc.).

\---

\#\# 12\. Risks and Guardrails

| Risk | Guardrail |  
|---|---|  
| RP becomes meaningless / inflates | Slow minting \+ meaningful transfers \+ caps \+ decay \+ ledger audits |  
| Farming via fake/related clubs | Related-club detection, RP transfer block, 30-day repeat decay, minimum verification |  
| Public accusations damage clubs/refs | Moderation holds risky copy; Trust handles underlying review |  
| Unverified results trend as official | Buzz cannot promote unverified; share cards labeled clearly |  
| Venue double-booking | Surface calendar \+ offline blocks \+ hold/payment lifecycle |  
| Disputes drag forever | Closing Window \+ dispute SLA \+ admin queues with priority |  
| Notification spam | Preferences, quiet hours, reminder caps, channel fallback |  
| Hidden engine behavior | Decision Trace, audit logs, Super Admin visibility |  
| Config changes break fairness mid-season | Effective dates \+ scoped overrides \+ version history |  
| Analytics drift | Schema registry, stable event keys, dashboard metric definitions |  
| Moderation blocks all energy | Safe default copy library; banter explicitly allowed |  
| Referee gaming | Trust weights by type; split officiating restricted for high-RP |

\---

\#\# 13\. Glossary (Key Terms)

| Term | Meaning |  
|---|---|  
| \*\*RP\*\* | Respect Points. Kalaanba's reputation currency. Never money. |  
| \*\*Season RP\*\* | Current-season RP. Resets to 0 every April 1\. |  
| \*\*Lifetime RP\*\* | Historical RP across seasons. Never resets. |  
| \*\*Verified Match\*\* | Match the platform trusts happened with reliable result. |  
| \*\*RP-Eligible Match\*\* | Verified match that meets all RP rules (season, participation, related-club, etc.). |  
| \*\*City Hub\*\* | Practical football home (e.g., Tamale City Hub). |  
| \*\*Zone / Belt\*\* | Competitive divisions within a hub; Belts are outer/peri-urban. |  
| \*\*Area\*\* | Locality a club identifies with (Taha, Kukuo). |  
| \*\*Ranked Challenge\*\* | Public RP-staking call-out between clubs. |  
| \*\*Stood Ground\*\* | Draw outcome where respondent successfully resisted; challenger pays a small cost. |  
| \*\*2-of-3 Verification\*\* | Challenge result verified when any two of challenger/respondent/referee agree. |  
| \*\*Decision Trace\*\* | Auditable record of what Trust Engine checked and concluded. |  
| \*\*Clearance Outputs\*\* | Stored flags (\`rpClearance\`, \`statsClearance\`, etc.) other engines read. |  
| \*\*Soft Follow\*\* | Inferred follower interest from repeated interactions. |  
| \*\*Buzz\*\* | Normalized attention score; affects visibility, never RP. |  
| \*\*Recognition\*\* | Lighter, frequent acknowledgement (weekly, matchday). |  
| \*\*Award\*\* | Formal, archival recognition (season, tournament, monthly). |  
| \*\*Offline Block\*\* | Manager-entered calendar block for bookings made outside Kalaanba. |  
| \*\*Outbox\*\* | Reliable queue of pending engine events / notifications. |  
| \*\*Effective Date\*\* | When a config change actually starts applying. |

\---

\#\# 14\. Recommended Build Phasing

\#\#\# Phase A — Alpha (validate football loop)  
\- Club, players, manual venue, basic match creation, score entry, result confirmation  
\- Minimal analytics event capture  
\- Super Admin can see and edit anything

\#\#\# Phase B — Private Beta (validate operations \+ drama)  
\- Challenge lifecycle end-to-end  
\- Venue surfaces, manager portal, surface calendar, offline blocks  
\- 2-of-3 verification, Trust clearance, evidence handling  
\- Basic Fan Buzz \+ feed \+ share cards  
\- WhatsApp notifications \+ in-app  
\- Admin review queues, audit logs  
\- Per-competition Top Scorer / Top Assist (Awards minimum)

\#\#\# Phase C — V1 (public acquisition \+ revenue)  
\- Online booking payments \+ commission \+ settlement  
\- Full Awards & Recognition (weekly, monthly, season)  
\- Moderation & Safety integration across public surfaces  
\- Discovery feeds for venues, clubs, competitions, zones  
\- Full Admin Configuration UI for core settings  
\- V1 dashboards across all engines

\#\#\# Phase D — Post-V1 (depth)  
\- Group stages, auto fixtures, paid competitions  
\- Referee marketplace and ratings  
\- Comments \+ fan voting \+ advanced personalization  
\- AI-assisted admin review (summaries, classification)  
\- Offline-first live match entry

\---

\#\# 15\. Open Architecture Questions to Resolve Next

These are intentionally \*\*not decided\*\* in product direction and need architectural decisions before build:

1\. \*\*Event bus implementation:\*\* in-process pub/sub vs message broker (e.g., Redis Streams, NATS, RabbitMQ) for outbox \+ workers.  
2\. \*\*Storage strategy for raw analytics events:\*\* append-only table vs warehouse vs hybrid.  
3\. \*\*PSP integration model:\*\* which provider supports clean split-payouts in the target region; fallback "Kalaanba collects \+ manually settles" wire-up.  
4\. \*\*WhatsApp delivery:\*\* Cloud API vs BSP provider; templated messages and rate limits.  
5\. \*\*WebSocket infrastructure:\*\* sticky-session approach vs managed (e.g., Pusher/Ably).  
6\. \*\*Config store:\*\* dedicated config service vs DB table with caching layer.  
7\. \*\*Audit log store:\*\* same DB vs separate append-only store.  
8\. \*\*Authorization model:\*\* role-based \+ scope-based (hub, club, competition, venue) — concrete enforcement layer.  
9\. \*\*Search/Discovery layer:\*\* Postgres full-text vs ElasticSearch/Meilisearch for V1.  
10\. \*\*Real-time match presence/check-in:\*\* GPS check-in storage, manager attendance marks, referee check-in proofs.

\---

\#\# 16\. Locked Summary

Kalaanba is a grassroots football platform with a reputation economy (RP, never money), real verified records, public rivalry through Challenges, week-by-week recognitions, a venue booking and revenue layer, and strong governance under the hood.

It is built as a set of cooperating engines:

\- \*\*Season\*\* sets the clock.  
\- \*\*Club, Player, Zone, Venue, Referee\*\* define identity and context.  
\- \*\*Match/Fixture\*\* records the event.  
\- \*\*Trust & Verification\*\* decides what counts.  
\- \*\*RP Economy, Competition, Player stats, Awards\*\* apply official effects.  
\- \*\*Challenge\*\* creates public drama with locked RP.  
\- \*\*Fan Buzz, Feed & Discovery\*\* drives visibility.  
\- \*\*Moderation & Safety\*\* keeps public content safe.  
\- \*\*Notification & Distribution\*\* delivers the right message at the right time.  
\- \*\*Analytics\*\* captures every meaningful signal from day one.  
\- \*\*Admin Configuration & Governance\*\* keeps every rule configurable, scoped, versioned, and auditable.

Final product line:

\> \*\*Public drama on the surface. Boringly fair rules underneath.\*\*  
\> \*\*Results drive respect. Buzz drives visibility. Trust decides what counts.\*\*

This brief is ready to drive the architecture phase.  
\`\`\`  
