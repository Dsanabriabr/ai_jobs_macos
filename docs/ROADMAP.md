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

## P1.1 — Signal quality (`feature/p1-signal-quality`)

- Host denylist + ATS preference (static — too biased toward Gupy; addressed in P1.2)
- Canonical fingerprint + mirrors + Signal/Noise/Dup labels → `feedback.jsonl`
- Listing filters + cadence picker in menu bar
- Planner ATS-first `site:` queries (reduced aggregator noise, reduced source diversity)

## P1.2 — Dual discovery & configurable sources (next)

See [docs/P1_2_DUAL_DISCOVERY.md](P1_2_DUAL_DISCOVERY.md).

- `SourcePolicy` editável (ATS on/off/weight — não hardcoded)
- Lanes: **surface** + **ATS-targeted** + budget configurável
- Follow/resolve: superfície → extrair apply ATS e cruzar fingerprint
- Paginação Oxylabs (`pages` / `start_page`) + limites explícitos na UI
- Dup só faz sentido cross-source (não “duplicata dentro do Gupy”)

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
