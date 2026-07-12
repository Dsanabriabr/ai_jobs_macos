# Roadmap

## P0 — Discovery shell (current)

- Agent TS clean layers + Oxylabs **Web Scraper API** (`google_search`) as the only `JobSearchPort` adapter
- File persistence + digest
- HTTP API for any future client
- SwiftUI menu bar: `idle | running | attention | ready | error`
- `SearchPolicy` with configurable `DigestCadence` + manual run

## P1 — Sources & schedule

- Additional search adapters (Google Jobs / boards) behind the same port
- Real scheduler honoring cadence
- Editable pipeline stages on job entities (no apply yet)

## P2 — Intelligence v1 (Cursor)

- Ranking, pros/cons, cover letter via Cursor SDK
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

## P5 — Multi-client & voice

- Flutter (iOS/Android) against the same agent HTTP contract
- App Intents / Siri
