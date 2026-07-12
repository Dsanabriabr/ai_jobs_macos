# Roadmap

## P0 — Discovery shell (done)

- Agent TS clean layers + Oxylabs **Web Scraper API** (`google_search`) as the only `JobSearchPort` adapter
- File persistence + digest
- HTTP API for any future client
- SwiftUI menu bar: `idle | running | attention | ready | error`
- `SearchPolicy` with configurable `DigestCadence` + manual run

**Known P0 bias:** default query `ios senior` + `geo_location: United States` → English/US-heavy SERPs. Acceptable for smoke test; corrected in P1 via persona + query graph.

## P1 — Sources, schedule & search persona

### Scheduler & sources

- Real scheduler honoring cadence
- Additional search adapters (boards / dedicated Google Jobs-style URLs) behind the same `JobSearchPort`
- Editable pipeline stages on job entities (no apply yet)

### Search persona & weighted term graph (from P0 feedback)

Encode the human context as domain data, not hardcoded queries:

| Context | Implication for discovery |
|---------|---------------------------|
| Brazilian, advanced English | Bilingual query expansion (pt-BR + en); do not lock geo to US |
| No US visa | Prefer remote / worldwide / contractor; downrank “must relocate US”, H1B-only |
| Company in Brazil, works as PJ | Boost contractor / B2B / remote international / LatAm-friendly language |

**Domain additions (P1):**

- `CandidateProfile` — locale, work model (`pj_contractor`), visa constraints, preferred geos/timezones
- `TermGraph` — weighted nodes (`ios`, `swift`, `senior`, `remote`, `contractor`, `vaga`, …) with relations (`synonym`, `boost`, `penalty`)
- `QueryPlanner` — expands graph + profile → concrete query set + geo rotation for Oxylabs
- `SearchPolicy` evolves from raw `queries[]` to `profileId + graph + plannedQueries` (raw overrides still allowed)

**Planner rules (initial):**

1. Always emit EN + PT variants of core role terms  
2. Rotate / combine `geo_location` (e.g. Brazil, United States, Germany) instead of US-only  
3. Attach must-boost phrases: `remote`, `worldwide`, `contractor`, `PJ`, `async`  
4. Attach penalties / filters later: visa sponsorship required, on-site only (full filter may wait until P2 ranking)

UI (menu bar): edit profile weights lightly; show which planned queries ran in the digest.

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
