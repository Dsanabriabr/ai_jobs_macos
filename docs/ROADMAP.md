# Roadmap

## P0 — Discovery shell (done)

- Agent TS clean layers + Oxylabs **Web Scraper API** (`google_search`) as the only `JobSearchPort` adapter
- File persistence + digest
- HTTP API for any future client
- SwiftUI menu bar: `idle | running | attention | ready | error`
- `SearchPolicy` with configurable `DigestCadence` + manual run

**Known P0 bias:** default query `ios senior` + `geo_location: United States` → English/US-heavy SERPs. Acceptable for smoke test; corrected in P1 via persona + query graph.

## P1 — Sources, schedule & search persona (`feature/p1-search-persona`)

### Done on this branch

- `CandidateProfile` + `TermGraph` + `QueryPlanner`
- `SearchPolicy.mode`: `persona_graph` | `manual_queries`
- Geo rotation from `preferredGeos`; bilingual EN/PT planned searches
- `GET /policy/plan` preview; digest stores `plannedSearches`
- In-process cadence scheduler (non-manual)
- Menu bar: mode toggle, geos, max planned, plan preview

### Still open for later P1 follow-ups

- Additional search adapters (boards / dedicated Jobs URLs)
- Richer term-graph editor in UI (node weights)
- Editable pipeline stages on job entities

## P2 — Intelligence v1 (Cursor)

- Ranking, pros/cons, cover letter via Cursor SDK (uses profile + graph as context)
- **Structured logging / event journal** of every Cursor output and user feedback
  (`approve` / `reject` / `ignore`, scores, prompts, job snapshots)
- This journal is the training corpus for Create ML in P4 — do not skip

## P3 — Apply

- Playwright + ATS adapters
- Captcha human-in-the-loop
- Per-job authorization

## P4 — Intelligence v2 (Create ML)

- On-device ranker/classifier trained on P2 journal
- Local pre-filter; Cursor reserved for edge cases and generative text
- Term-graph weights can be tuned from feedback (edge weights ← approve/reject)

## P5 — Multi-client & voice

- Flutter (iOS/Android) against the same agent HTTP contract
- App Intents / Siri
