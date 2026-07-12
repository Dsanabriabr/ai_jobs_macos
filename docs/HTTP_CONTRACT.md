# Agent HTTP contract (P1 on `feature/p1-search-persona`)

Base URL default: `http://127.0.0.1:8787`

Discovery backend: Oxylabs Web Scraper API `google_search` via `OXYLABS_USERNAME` / `OXYLABS_PASSWORD`.  
P1 adds **persona graph** planning (`CandidateProfile` + `TermGraph` → `QueryPlanner`) and cadence scheduler.

## `GET /health`

```json
{ "ok": true, "phase": "P1" }
```

## `GET /status`

```json
{ "status": "idle|running|attention|ready|error", "errorMessage": null }
```

## `GET /digest/latest`

Includes `queriesRun` (display lines) and `plannedSearches` (structured plan used for the run).

## `GET /policy` / `PUT /policy`

P1 body includes:

```json
{
  "mode": "persona_graph",
  "queries": [],
  "cadence": { "kind": "manual" },
  "resultLimitPerQuery": 8,
  "geoLocation": "Brazil",
  "maxPlannedQueries": 6,
  "profile": {
    "id": "default-br-pj",
    "displayName": "BR PJ · iOS",
    "primaryLocale": "pt-BR",
    "languages": ["pt-BR", "en"],
    "workModel": "pj_contractor",
    "visaConstraint": "no_us_visa",
    "preferredGeos": ["Brazil", "United States", "Germany"],
    "timezone": "America/Sao_Paulo",
    "notes": "..."
  },
  "termGraph": { "nodes": [{ "id": "ios", "label": "ios", "weight": 0.95, "role": "skill", "lang": "any" }] }
}
```

`mode: "manual_queries"` keeps P0-style raw `queries[]`.

## `GET /policy/plan`

Preview of planned Oxylabs searches without spending credits.

```json
{
  "plan": {
    "mode": "persona_graph",
    "searches": [
      {
        "query": "ios swift senior remote contractor",
        "geoLocation": "Brazil",
        "lang": "en",
        "rationale": "..."
      }
    ]
  }
}
```

## `POST /runs`

Runs the planned searches (or manual queries), returns digest.
