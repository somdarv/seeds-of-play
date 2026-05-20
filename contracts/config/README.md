# Config Key Contracts

Every value that could ever change without a code release lives here. The Admin Configuration & Governance engine reads from this registry and exposes effective-dated, scoped values.

## Layout

```
config/
  <engine>/<key>.json
```

## File format

```json
{
  "key": "rp.win_value",
  "engine": "rp-economy",
  "scope": "season",
  "scope_options": [
    "platform",
    "season",
    "hub",
    "zone",
    "competition",
    "entity"
  ],
  "value_type": "integer",
  "default": 10,
  "min": 0,
  "max": 1000,
  "approval_level": "Critical",
  "description": "Season RP awarded to the winning club on a verified, RP-eligible match.",
  "consumers": ["app.Modules.RpEconomy.Listeners.MintOnTrustCleared"],
  "version": 1,
  "introduced_in": "WP-20260512-foundations"
}
```

## Approval levels

| Level    | Who can change                  | Use when                                                                   |
| -------- | ------------------------------- | -------------------------------------------------------------------------- |
| Low      | Admin (immediate)               | Cosmetic labels, copy, surface order.                                      |
| Medium   | Admin + secondary admin confirm | Quotas, lengths, non-financial windows.                                    |
| High     | Senior admin approval           | RP values, challenge windows, season cutoffs.                              |
| Critical | Super Admin + dual approval     | Anything affecting financial settlement, ledger semantics, or Trust gates. |

## Rules

1. No hardcoded constants in domain code. If a value can ever change, register it.
2. Bumping `default` is a config change, not a code change — versioned and audited.
3. `min`/`max` enforced at write time by the admin UI and re-checked at read time.
4. Effective-dated reads (`Config::get(key, scope, at?)`) are mandatory for any value that affects history (RP win value during last season vs this season, etc.).
