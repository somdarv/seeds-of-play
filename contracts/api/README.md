# API Contracts

OpenAPI 3.1 fragments per engine and endpoint. The Laravel side serves these; the Next.js side generates TypeScript types from them via the codegen pipeline (see `kalaanba-front/` tooling).

## Layout

```
api/
  <engine>/<endpoint>.v<N>.yaml
```

Example: `api/match-fixture/post-matches.v1.yaml`, `api/rp-economy/get-wallet.v1.yaml`.

## Required of every endpoint

- **Idempotency-Key** header REQUIRED on every write endpoint (POST/PUT/PATCH/DELETE that mutates state).
- **Error envelope** — standardised:
  ```json
  { "error": { "code": "string", "message": "string", "details": {} } }
  ```
- **Pagination** — cursor-based (`?cursor=...&limit=...`), never offset/limit for hot lists.
- **Auth** — Sanctum bearer token unless explicitly public.
- **Scope** — declare which scope middleware applies (`hub`, `club`, `competition`, `venue`, etc.).
- **Money fields** — integer (minor units, pesewas). Document the unit in the schema description.

## Template

```yaml
openapi: 3.1.0
info:
  title: "<Engine> — <Endpoint>"
  version: "1.0.0"
paths:
  /api/v1/<engine>/<path>:
    post:
      summary: "<one line>"
      security:
        - bearerAuth: []
      parameters:
        - in: header
          name: Idempotency-Key
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Request"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Response"
        "4XX":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer }
  schemas:
    Request: { type: object }
    Response: { type: object }
    ErrorEnvelope:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: object }
```
