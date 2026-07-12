# Agent HTTP contract (P1.1 on `feature/p1-signal-quality`)

Base URL default: `http://127.0.0.1:8787`

Discovery: Oxylabs Web Scraper `google_search` + signal pipeline (denylist, ATS prefer, fingerprint merge, labels).

## `GET /health`

```json
{ "ok": true, "phase": "P1.1" }
```

## `GET /digest/latest?filter=hide_noise`

Filters: `all` | `hide_noise` | `signal` | `unlabeled` | `ats_only`

Jobs include `hostKind`, `label`, `fingerprint`, `mirrors`.

## `POST /jobs/:id/label`

```json
{ "label": "signal" }
```

Values: `signal` | `noise` | `duplicate` → appends `feedback.jsonl`.

## `GET /feedback`

Recent label events (Create ML corpus later).

## `GET /policy` / `PUT /policy` / `GET /policy/plan` / `POST /runs`

Same as P1; cadence is editable from the menu bar (manual/daily/weekly/monthly).
