# Roadmap

## P0 — Discovery shell (done)

- Agent TS clean layers + Oxylabs **Web Scraper API** (`google_search`) as the only `JobSearchPort` adapter
- File persistence + digest
- HTTP API for any future client
- SwiftUI menu bar: `idle | running | attention | ready | error`
- `SearchPolicy` with configurable `DigestCadence` + manual run

## P1 — Search persona (`feature/p1-search-persona`)

- `CandidateProfile` + `TermGraph` + `QueryPlanner`
- Bilingual EN/PT + geo rotation
- `GET /policy/plan` + menu bar plan preview
- Cadence scheduler (backend)

## P1.1 — Signal quality (`feature/p1-signal-quality`) — current

- Host denylist (aggregators) + ATS preference / allowlist
- Canonical job via fingerprint + mirror merge (same role across boards → one card)
- Manual labels: `signal` | `noise` | `duplicate` → `feedback.jsonl` journal (Create ML corpus)
- Noisy hosts from journal reinforce denylist at runtime
- Listing filters: hide_noise / unlabeled / signal / ats_only / all
- Cadence picker in menu bar (manual / daily / weekly / monthly)
- Planner ATS-first `site:` queries (gupy / greenhouse / lever / ashby)

## P2 — Intelligence v1 (Cursor)

- Ranking, pros/cons, cover letter via Cursor SDK (on **cleaned** jobs)
- Extend journal with Cursor outputs + approve/reject/ignore

## P3 — Apply

- Playwright + ATS adapters
- Captcha human-in-the-loop
- Per-job authorization

## P4 — Intelligence v2 (Create ML)

- On-device classifier trained on P1.1+P2 journal
- Local pre-filter; Cursor for edge cases / generative text

## P5 — Multi-client & voice

- Flutter (iOS/Android) against the same agent HTTP contract
- App Intents / Siri
