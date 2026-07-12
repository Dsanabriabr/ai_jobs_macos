# Agent HTTP contract (P1.2 on `feature/p1-dual-discovery`)

Base URL default: `http://127.0.0.1:8787`

## `GET /health`

```json
{ "ok": true, "phase": "P1.2" }
```

## Policy `sources` (P1.2)

```json
{
  "sources": {
    "surfaceEnabled": true,
    "atsTargets": [
      { "id": "gupy", "label": "Gupy", "hostSuffix": "gupy.io", "enabled": true, "weight": 0.9 }
    ],
    "budget": { "surface": 0.45, "ats": 0.45, "follow": 0.1 },
    "maxPagesPerQuery": 2,
    "maxFollowResolves": 3
  },
  "resultLimitPerQuery": 10,
  "maxPlannedQueries": 8
}
```

## `GET /policy/plan`

Returns `searches[]` with `lane`: `surface` | `ats` | `follow` | `manual`, plus `slots`.

## `GET /digest/latest?filter=hide_noise`

Filters + jobs with `mirrors` / `hostKind` / `label`.

## `POST /jobs/:id/label`

`signal` | `noise` | `duplicate` — `duplicate` requires 2+ distinct mirror hosts (400 otherwise).

## `POST /runs`

Runs surface + ATS google_search (with `pages`) and optional follow/resolve scrapes.
