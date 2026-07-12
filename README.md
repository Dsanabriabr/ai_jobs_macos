# ai_jobs_macos

Menu bar macOS app + local TypeScript agent for job discovery.

## Architecture (P0)

| Layer | Location | Role |
|-------|----------|------|
| Domain / Data / Application | `packages/agent` | Discovery, policy, digest, status |
| HTTP contract | `packages/agent` `:8787` | Client-agnostic API (Swift today, Flutter later) |
| Interface | `apps/macos` | `MenuBarExtra` client |

**P0 scope:** Oxylabs **Web Scraper API** (`google_search`) → normalize → persist → digest → menu bar.  
No Cursor ranking, no apply, no AI Studio.

## Credentials (important)

Use the **Web Scraper API** user from the Oxylabs dashboard (`USERNAME` / `PASSWORD` → Basic auth on `realtime.oxylabs.io`).

Do **not** use an AI Studio API key. Do **not** commit real credentials.

```bash
cd packages/agent
cp .env.example .env
# edit .env:
# OXYLABS_USERNAME=your_api_user
# OXYLABS_PASSWORD='your_password'   # quote if it has +, #, spaces, etc.
```

## Quick start

Branch for this work: `feature/p1-dual-discovery` (P1.2 — merge after you validate).

### 1. Agent

```bash
cd packages/agent
cp .env.example .env   # fill USERNAME / PASSWORD
npm install
npm run dev
```

Smoke check (another terminal):

```bash
curl -s http://127.0.0.1:8787/health
curl -s -X POST http://127.0.0.1:8787/runs | head -c 500
```

### 2. macOS menu bar

```bash
cd apps/macos
swift run
```

Popover: latest digest + **Run now**. Status colors map from `MenuBarStatus`.

## HTTP contract (local)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `GET` | `/status` | `idle \| running \| attention \| ready \| error` |
| `GET` | `/digest/latest` | Latest digest + jobs |
| `GET` | `/policy` | Search policy |
| `PUT` | `/policy` | Update queries + cadence |
| `POST` | `/runs` | Trigger digest run |

Details: [docs/HTTP_CONTRACT.md](docs/HTTP_CONTRACT.md)

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md). P1 includes search persona + weighted term graph (bilingual, remote/PJ) — [docs/P1_SEARCH_PERSONA.md](docs/P1_SEARCH_PERSONA.md).
