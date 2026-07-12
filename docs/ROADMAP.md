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

- Host denylist + ATS preference (later de-biased)
- Canonical fingerprint + mirrors + Signal/Noise/Dup → `feedback.jsonl`
- Listing filters + cadence picker

## P1.2 — Dual discovery (`feature/p1-dual-discovery`)

- Configurable ATS targets + surface/ATS/follow lanes + Oxylabs pages + follow/resolve
- Dup only cross-source

## P1.3 — Surface-first recovery (`feature/p1-surface-first`) — current

See [docs/P1_3_SURFACE_FIRST.md](P1_3_SURFACE_FIRST.md).

- Soft demote boards; relaxed heuristic; coupled 100% budget
- Diagnostics; ATS lane off by default; BR+remote surface queries
- **Still:** many cells are hubs/search pages, not apply-able postings; company often Unknown → **not P2-ready**

## P1.4 — Clean posting list (in progress — gate before P2)

See [docs/P1_4_CLEAN_POSTINGS.md](P1_4_CLEAN_POSTINGS.md).

- Distinguish **posting** vs **hub** (listing/search page ≠ signal)
- Edit company/title/URL/**logoUrl** on row; logo on cell left; persist with labels
- Default UI filter: **postings**; hubs filtered or labeled `hub`
- `signal` only valid on `pageKind=posting`
- Human enrichment loop before any Cursor spend
- **P2 blocked** until listing is clean enough to not waste tokens on noise/hubs

## P2 — Intelligence v1 (Cursor) — gated

- Pros/cons + cover letter **only on `signal` postings with company**
- Extend journal with Cursor outputs + approve/reject/ignore

## P3 — Apply

- Playwright + ATS adapters
- Captcha human-in-the-loop
- Per-job authorization

## P4 — Intelligence v2 (Create ML)

- On-device classifier on P1.x+P2 journal (labels, corrections, optional snapshots)
- Local pre-filter; Cursor for edge cases / generative text

## P5 — Multi-client & voice

- Flutter (iOS/Android) against the same agent HTTP contract
- App Intents / Siri
