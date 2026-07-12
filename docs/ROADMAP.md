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

## P1.2 — Dual discovery (`feature/p1-dual-discovery`)

- Configurable ATS targets + surface/ATS/follow lanes + Oxylabs pages + follow/resolve
- Dup only cross-source
- **Known issues:** empty list from hard denylist + strict heuristic; budget sliders not coupled to 100%; ATS still too central vs BR+remote goal → **P1.3**

## P1.3 — Surface-first recovery (next)

See [docs/P1_3_SURFACE_FIRST.md](P1_3_SURFACE_FIRST.md).

- Soft demote boards (don’t drop LinkedIn/Vagas/Indeed wholesale)
- Relax posting heuristic; surface-first defaults (≈70/20/10)
- Budget UI/domain invariant: surface+ATS+follow = 100%
- Run diagnostics (raw/dropped/kept) so empty list is explainable
- ATS optional enrichment, not primary index

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
