# Contracts

This folder holds the **versioned contracts** that engines use to talk to one another and to the outside world. Engines NEVER touch each other's schemas directly — every cross-engine effect goes through a contract defined here.

## Layout

```
contracts/
  events/<engine>/<event_name>.v<N>.json    # outbox event schemas (JSON Schema draft-2020-12)
  api/<engine>/<endpoint>.v<N>.yaml         # OpenAPI 3.1 fragments per endpoint
  config/<engine>/<key>.json                # admin config key definitions
```

## Rules

1. **Version everything.** A contract file's name always includes `vN`. Breaking changes get a new major version and a migration note.
2. **Event names are `engine.action`** (lower snake_case). Examples: `match.result_confirmed`, `trust.match_cleared`, `rp.transferred`, `challenge.accepted`, `booking.confirmed`, `moderation.held_for_review`.
3. **Stable internal keys, configurable labels.** Logic depends on the key. Labels are stored as a separate config entry.
4. **Every config key declares:** `key`, `scope` (platform/season/hub/zone/competition/entity), `value_type`, `default`, `approval_level` (Low/Med/High/Critical), `description`, `version`.
5. **Producers and consumers are listed explicitly** in every event schema. CI will eventually grep code for missing consumers.

## Pipeline integration

The **Contract Designer** chat mode (Stage 5) is the only role that may add or change files here. The Implementer (Stage 6) reads them; everyone else cites them.

## Files

- [events/README.md](events/README.md)
- [api/README.md](api/README.md)
- [config/README.md](config/README.md)
