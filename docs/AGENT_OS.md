# Agent OS — How One Prompt Flows Through the Whole Team

This is the runbook for the disciplined, multi-agent development pipeline that builds Kalaanba (Seeds of Play). One prompt enters; ten stages later, code merges with full architectural, domain, security, and documentation sign-off.

> The Agent OS does NOT replace the Build Plan. The **Build Plan** (`docs/Architecture/Build_Plan.md`) is *what* gets built and in what order. The **Agent OS** is *how every change is built*. Both apply to every PR.

---

## 1. The Layers

| Layer | What it is | Where it lives |
|---|---|---|
| **Constitution** | Non-negotiable laws — auto-loaded into every Copilot chat | `.github/copilot-instructions.md` |
| **Chat modes (agents)** | 9 specialised personas with scoped tools and refusals | `.github/chatmodes/*.chatmode.md` |
| **Prompt files (playbooks)** | 10 reproducible workflow steps, invoked as `/01-intake` etc. | `.github/prompts/*.prompt.md` |
| **Source of truth** | Engine docs, ADRs, contracts, Build Plan, glossary | `docs/engines/`, `docs/adr/`, `contracts/`, `docs/Architecture/` |
| **Sankofa** | Continuous-documentation subagent (auto-runs after every substantive turn) | `.github/agents/sankofa.agent.md` |

---

## 2. The Nine Agents

| Mode | Role | Owns |
|---|---|---|
| **Product Steward** | Turns prompts into structured Work Packets and Impact Maps. | Stages 1–2 |
| **Engine Owner** | Domain expert per engine; reviews against locked rules. | Stage 3 (one pass per affected engine) |
| **Architect** | Engine boundaries, event flows, ADRs. | Stage 4 |
| **Contract Designer** | Versioned event/API/config contracts. | Stage 5 |
| **Implementer** | Writes the code against approved contracts. | Stage 6 |
| **Security Reviewer** | Privacy, audit, abuse vectors, OWASP. | Stage 7 |
| **QA Engineer** | Unit/contract/integration/config-flip tests + arch lint. | Stage 8 |
| **Docs Scribe** | Engine docs, ADRs, glossary, changelog. | Stage 9 |
| **Release Captain** | PR description, migration notes, rollback, risk. | Stage 10 |

Sankofa runs silently after every substantive turn and updates `docs/JOURNAL.md`.

---

## 3. The Ten Pipeline Stages

```
prompt
  │
  ▼
01-intake          → Work Packet (Product Steward)
02-impact-map      → Impact Map  (Product Steward)
03-rules-review    → per affected engine (Engine Owner — repeat N times)
04-architecture-check → Architect (may propose ADR)
05-contract-design → contracts/{events,api,config}/ (Contract Designer)
06-implementation  → code in kalaanba-api / kalaanba-front (Implementer)
07-security-review → Security Reviewer
08-qa-plan         → tests + arch lint (QA Engineer)
09-docs-update     → engine docs, ADRs, glossary (Docs Scribe)
10-release-packet  → PR description + flags + rollback (Release Captain)
  │
  ▼
PR opened → PR template checklist must be fully ticked → CODEOWNERS reviewers gate → CI gates (Deptrac, contract-schema validation, arch lint, tests) → merge
  │
  ▼
Sankofa journals the decisions in docs/JOURNAL.md (automatic, after-turn)
```

---

## 4. Worked Example — "Add stood-ground cost configuration to admin console"

This is the canonical test Work Packet to walk the full pipeline before scaling.

| Stage | Mode | Command | Output |
|---|---|---|---|
| 1 | Product Steward | `/01-intake` with the raw prompt | `## Work Packet WP-20260520-stood-ground-cost` |
| 2 | Product Steward | `/02-impact-map wpId=WP-20260520-stood-ground-cost` | Impact Map showing Challenge + RP Economy + Admin Governance |
| 3a | Engine Owner | `/03-rules-review wpId=... engine=challenge` | Confirms draw stood-ground is configurable, currently hardcoded |
| 3b | Engine Owner | `/03-rules-review wpId=... engine=rp-economy` | Confirms ledger entry shape unchanged |
| 3c | Engine Owner | `/03-rules-review wpId=... engine=admin-governance` | Confirms approval level should be **High** |
| 4 | Architect | `/04-architecture-check wpId=...` | Approves; no ADR needed |
| 5 | Contract Designer | `/05-contract-design wpId=...` | Creates `contracts/config/challenge/draw.stood_ground_cost.json` |
| 6 | Implementer | `/06-implementation wpId=...` | Code in `kalaanba-api/app/Modules/Challenge/...` + admin UI in `kalaanba-front/` |
| 7 | Security Reviewer | `/07-security-review wpId=...` | PASS — admin-only, audit logged |
| 8 | QA Engineer | `/08-qa-plan wpId=...` | Config-flip test: change value → next resolved draw uses new cost |
| 9 | Docs Scribe | `/09-docs-update wpId=...` | Engine doc updated, glossary entry added |
| 10 | Release Captain | `/10-release-packet wpId=...` | PR description ready with flip plan and rollback |

Result: one prompt → 10 disciplined hand-offs → one PR with full traceability.

---

## 5. Daily Developer Loop in VS Code

1. **Open the workspace.** Copilot auto-loads `.github/copilot-instructions.md`.
2. **Paste your idea.** Mode picker → **Product Steward** → run `/01-intake`.
3. **Open a GitHub issue** from the Work Packet template (`.github/ISSUE_TEMPLATE/work-packet.yml`). The WP ID lives there.
4. **Walk the pipeline** — switch chat modes and run `/02` … `/10` in order. Don't skip.
5. **Open the PR.** The template checklist must be fully ticked, all CODEOWNERS reviewers approve, CI green.
6. **Sankofa updates `docs/JOURNAL.md` automatically** after each substantive turn.

---

## 6. Enforcement (so agents cannot quietly cheat)

| Mechanism | Effect |
|---|---|
| **Constitution** (`.github/copilot-instructions.md`) | Auto-loaded into every chat. Prevents drift on every prompt. |
| **Chat modes** | An Implementer cannot redesign architecture; an Architect cannot write code. Scoped tools and refusals. |
| **Prompt files** | Identical input shape → identical output shape. Reproducible. |
| **Contracts as files** | Engines communicate via versioned schemas in `contracts/`, not vibes. |
| **CODEOWNERS** | The right human reviewer is forced in. |
| **PR template** | The 10-box checklist cannot be silently skipped. |
| **CI (to add in Stage 0)** | Deptrac fails cross-module reach-ins. Schema validation fails event drift. Arch lint fails cross-schema FKs. |
| **Engine docs in repo** | Every agent cites the same source of truth. |
| **ADRs** | "Why" is preserved; future agents do not relitigate. |
| **Sankofa** | Decision history is auto-captured turn-by-turn. |

---

## 7. File Map (what was just scaffolded)

### `kalaanba-front/` (canonical)
```
.github/
  copilot-instructions.md              ← Constitution
  agents/sankofa.agent.md              ← (pre-existing) journal subagent
  instructions/auto-journal.instructions.md ← (pre-existing) runs Sankofa
  chatmodes/                           ← 9 agent personas
    product-steward / architect / engine-owner / contract-designer /
    implementer / security-reviewer / qa-engineer / docs-scribe / release-captain
  prompts/                             ← 10 pipeline playbooks (01–10)
  ISSUE_TEMPLATE/work-packet.yml
  pull_request_template.md
  CODEOWNERS
.vscode/settings.json                  ← Enables prompt + mode + instruction files
contracts/
  README.md  events/README.md  api/README.md  config/README.md
docs/
  engine-boundaries.md                 ← Quick reference
  glossary.md                          ← Project terms
  adr/README.md
  adr/0001-modular-monolith-with-event-bus.md
  engines/                             ← 17 engine folders (docs relocated)
    club/  player-affiliation/  match-fixture/  season/  rp-economy/
    challenge/  trust-verification/  zone/  venue-surface-booking/
    referee-officiator/  notification-distribution/  fan-buzz/
    moderation-safety/  admin-governance/  competition-rules/
    awards-recognition/  analytics/
  Architecture/
    System_Architecture.md             (pre-existing)
    Build_Plan.md                      (pre-existing)
  Full Kalaanba Brief.md               (pre-existing)
  JOURNAL.md                           (pre-existing — Sankofa-owned)
```

### `kalaanba-api/` (mirrored constitution + chat modes + prompts + templates)
Same `.github/` and `.vscode/` so the same Copilot discipline applies in the Laravel repo.

---

## 8. What Lives Where

| If you want to… | Go to |
|---|---|
| Read the laws | `.github/copilot-instructions.md` |
| Pick an agent | VS Code Chat mode picker |
| Run a stage | `/01-intake` … `/10-release-packet` in Copilot Chat |
| Find an engine's rules | `docs/engines/<slug>/` |
| Know who owns what | `docs/engine-boundaries.md` |
| Look up a term | `docs/glossary.md` |
| Record an architectural decision | `docs/adr/NNNN-<slug>.md` |
| Define an event / API / config key | `contracts/events|api|config/<engine>/` |
| Track build progress | `docs/Architecture/Build_Plan.md` |
| Read decision history | `docs/JOURNAL.md` (Sankofa-managed) |

---

## 9. Suggested First Real Run

Pick a small, contained Work Packet to validate the pipeline before scaling:

> *"Add a configurable `challenge.draw.stood_ground_cost` value, surfaced in the admin console with High approval level. Default 5 Season RP. Applies to all draws resolved after the effective date."*

Walk it through all 10 stages. The output should land as a single PR with:
- A WP ID, full checklist ticked.
- One new file in `contracts/config/challenge/`.
- Code in `kalaanba-api/app/Modules/Challenge/`.
- An admin-console screen in `kalaanba-front/src/...`.
- Tests including a config-flip integration test.
- A glossary entry, no ADR needed.
- A Release Packet that documents the flip and the rollback path.

If any stage feels unnatural, fix the chat mode or prompt file — don't bypass the stage.
