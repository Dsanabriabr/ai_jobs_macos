# Agent HTTP contract (P0)

Base URL default: `http://127.0.0.1:8787`

## `GET /health`

```json
{ "ok": true, "phase": "P0" }
```

## `GET /status`

```json
{ "status": "idle|running|attention|ready|error", "errorMessage": null }
```

## `GET /digest/latest`

```json
{
  "digest": {
    "id": "uuid",
    "createdAt": "ISO-8601",
    "status": "attention",
    "jobIds": ["..."],
    "jobs": [
      {
        "id": "...",
        "title": "...",
        "company": null,
        "url": "https://...",
        "source": "oxylabs-ai-search",
        "queryMatched": "ios senior",
        "description": "...",
        "discoveredAt": "ISO-8601"
      }
    ],
    "errorMessage": null,
    "queriesRun": ["ios senior"]
  }
}
```

`digest` may be `null` before the first run.

## `GET /policy` / `PUT /policy`

```json
{
  "queries": ["ios senior"],
  "cadence": { "kind": "manual" },
  "resultLimitPerQuery": 10,
  "geoLocation": "United States"
}
```

Cadence kinds: `manual`, `daily`, `weekly`, `monthly`, `quarterly`, `semiannual`, `annual`.

## `POST /runs`

Triggers `RunDigest`. Returns `{ "digest": { ... } }`.
