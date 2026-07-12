# ai_jobs_macos

Menu bar macOS app + local TypeScript agent for job discovery.

## Architecture (P0)

| Layer | Location | Role |
|-------|----------|------|
| Domain / Data / Application | `packages/agent` | Discovery, policy, digest, status |
| HTTP contract | `packages/agent` `:8787` | Client-agnostic API (Swift today, Flutter later) |
| Interface | `apps/macos` | `MenuBarExtra` client |

**P0 scope:** Oxylabs AI-Search only → normalize → persist → digest list → menu bar status.
No Cursor ranking, no apply, no Google adapter.

## Quick start

### 1. Agent

```bash
cd packages/agent
cp .env.example .env   # set OXYLABS_API_KEY
npm install
npm run dev
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

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).
