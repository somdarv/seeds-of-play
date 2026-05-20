# Event Contracts

JSON Schema (draft 2020-12) definitions for every outbox event in Kalaanba.

## Naming

- File: `<engine>/<event_name>.v<N>.json` — e.g. `rp-economy/rp.transferred.v1.json`
- `event_name` is `engine.action` lower snake_case.

## Required envelope fields

Every event payload MUST carry:

| Field            | Type         | Notes                                                   |
| ---------------- | ------------ | ------------------------------------------------------- |
| `event_id`       | UUID v7      | Idempotency key for listeners.                          |
| `event_name`     | string       | Matches the filename's event_name.                      |
| `schema_version` | integer      | Matches the file `vN`.                                  |
| `occurred_at`    | ISO 8601     | When the source-of-truth write happened.                |
| `actor_id`       | UUID \| null | User who triggered the change (null for system events). |
| `actor_role`     | enum         | User's effective role at the time.                      |
| `source`         | string       | `engine.<engine>` or `system.<job>`.                    |
| `payload`        | object       | Event-specific body.                                    |

## Template

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://kalaanba.dev/contracts/events/<engine>/<event_name>.v1.json",
  "title": "<engine>.<event_name> v1",
  "type": "object",
  "required": [
    "event_id",
    "event_name",
    "schema_version",
    "occurred_at",
    "actor_id",
    "actor_role",
    "source",
    "payload"
  ],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_name": { "type": "string", "const": "<engine>.<event_name>" },
    "schema_version": { "type": "integer", "const": 1 },
    "occurred_at": { "type": "string", "format": "date-time" },
    "actor_id": { "type": ["string", "null"], "format": "uuid" },
    "actor_role": { "type": "string" },
    "source": { "type": "string" },
    "payload": {
      "type": "object",
      "required": [],
      "properties": {}
    }
  },
  "$comment": "Producers: [...]. Consumers: [...]."
}
```

## Versioning

- `v1`, `v2`, etc. Coexist while consumers migrate. Drop only when all consumers have moved.
- Adding optional fields → same version.
- Removing/renaming fields, tightening required → new version + migration note in PR description.
