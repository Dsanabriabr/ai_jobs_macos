# P1.4 — Clean posting list (gate before P2)

## Feedback (validated)

1. **Board/list pages ≠ signal** — A Vagas/LinkedIn/Indeed *index* or *search results* URL is not an apply-able job. Jobs live *inside* that listing. Marking those as `signal` pollutes training.
2. **Signal persistence across runs** — Keep (good). Labeled postings must survive digest re-runs.
3. **Unknown company** — If the user can mark Signal, they can also set company (and title) manually → richer journal for later ML.
4. **Not ready for P2** — Cursor on noisy/hub links wastes tokens. Gate: only analyze **clean postings**.

## Signal taxonomy (clarify)

| Concept | Meaning | Typical URL | Default treatment |
|---------|---------|-------------|-------------------|
| **Posting** | Single job you can apply to | `…/jobs/11616815`, Greenhouse job, LinkedIn `/jobs/view/…` | Eligible for `signal` |
| **Hub / listing** | Search or index of many jobs | Indeed search, Vagas list, LinkedIn jobs search, company `/careers` index | **Not signal** — `hub` (or noise) + optional follow |
| **Noise** | Irrelevant / spam / wrong role | Blog, marketing, wrong SERP | `noise` |

**Answer:** a “plataforma com lista de vagas” is **usually hub, not signal**.  
We need an explicit kind (or label) — not overload `signal`/`noise` alone.

Proposed labels (P1.4):

```text
unlabeled | posting_candidate | signal | hub | noise | duplicate
```

Or keep labels + add `pageKind: posting | hub | unknown` set by heuristic + user override.

**Rule:** `signal` only allowed when `pageKind == posting` (user can promote hub→posting only after correcting URL/kind).

## Logging strategy (today vs needed)

**Today:** `feedback.jsonl` stores `{ url, host, title, label, fingerprint, … }` — no HTML snapshot, no company correction field.

**P1.4 (human enrichment first, HTML optional):**

| Field | Why |
|-------|-----|
| `pageKind` | posting vs hub |
| `company` (editable) | user fill when Unknown |
| `title` (editable) | cleanup |
| `canonicalUrl` (editable) | paste real apply URL if hub |
| label + timestamp | already |
| optional `snapshotRef` | save HTML/markdown later for Create ML — **not required to gate P2** |

Priority is **clean cells in the UI**, not scraping HTML yet.

## UI / product goals before P2

1. Default list view: **Signal only** or **Postings only** (hide hubs by default)  
2. Per row: edit company (+ optional title/URL)  
3. Buttons: Signal | Hub | Noise | Dup (Dup still cross-source)  
4. Hub → “Open” / “Follow” path, not Cursor  
5. Gate metric: e.g. “ready for P2” when N signals with company filled and pageKind=posting  

## P1.4 scope

### A — Domain

- `pageKind: posting | hub | unknown`
- Heuristic: board search URLs + careers index → `hub`; ATS job id paths + `/jobs/view/` → `posting`
- `signal` requires `pageKind=posting` (API validation)
- `PATCH /jobs/:id` for `{ company, title, url, pageKind, label }`
- Persist edits across runs (same as signal today)

### B — Listing cleanliness

- Default filter: `postings` or `signal` (not raw SERP soup)
- Soft-demote hubs in ranking; optional auto-label `hub` from heuristic
- Diagnostics: count hubs vs postings

### C — Human training loop (no Cursor yet)

- Manual company (required nudge when marking Signal if empty)
- Journal events include corrections
- HTML snapshot = optional follow-up (P1.4b / P4 prep), not blocker

### D — Explicit P2 gate

P2 starts only when:

- List default shows postings/signals, not hubs  
- Company editable + persisted  
- User can maintain a clean signal set without SERP noise dominating  

## Out of P1.4

- Cursor pros/cons/cover letter (P2)  
- Apply automation (P3)  
- Create ML (P4)  
- Full HTML corpus pipeline (can be P1.4b if needed)
