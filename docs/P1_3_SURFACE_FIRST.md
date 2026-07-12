# P1.3 — Surface-first recovery (empty list + budget UX)

## Symptoms (validated)

1. **“No jobs”** after P1.1/P1.2 — discovery runs but the list is empty  
2. **Budget sliders** don’t stay at 100% (independent surface/ATS sliders)  
3. **ATS bias** after Gupy example — product drifted from “vagas BR + remote” to “site:gupy / ATS lane”

## Why the list went empty (funnel)

```text
Oxylabs SERP (often LinkedIn / Indeed / Vagas / Glassdoor / company pages)
        │
        ▼
looksLikeJobPosting
  • aggregators → DROP
  • unknown host needs path (/jobs|/careers|…) AND title (ios|swift|…)
        │
        ▼
isDeniedHost (DENYLIST)
  • linkedin, indeed, glassdoor
  • remoterocketship, remoteok, weworkremotely
  • vagas.com.br, catho, infojobs, trabalhabrasil  ← kills BR surface
        │
        ▼
ATS lane may return little for geo=Brazil + site:greenhouse/lever
        │
        ▼
UI filter hide_noise → empty → “No jobs”
```

P1.0 soft filter kept noisy-but-visible results.  
P1.1 hard denylist + strict path/title filter **over-corrected**.  
P1.2 dual lanes helped diversity in the **plan**, but the **pipe still drops** most surface hits before listing.

## Budget UX — you are right

Intended model: **composition that always sums to 100%**.

What shipped: two independent sliders `surface` and `ats` (0…0.9), `follow = 1 - sum`.  
That allows invalid mental models (50+50 with follow leftover ambiguity, or 40+40+20 without linked controls).

**Correct UX for P1.3:**

| Control | Behavior |
|---------|----------|
| Primary: Surface % | 0–100 |
| ATS % | `100 - surface - follow` (read-only or linked) |
| Follow % | small fixed band (e.g. 0–20) or second linked control |
| Invariant | `surface + ats + follow == 100` always |

One slider (“Surface vs ATS”) + optional Follow toggle/percent is enough.

## Product intent (reset)

Goal: **vagas no Brasil + remotas** (PJ / worldwide ok), not “maximize Gupy”.

ATS is a **secondary enrichment** (canonical apply URL), not the main search index.

## P1.3 scope

### A — Unblock listing (P0 visibility with soft signal)

1. Split denylist into:
   - **hard drop**: pure SERP engines / hub spam (`google.com`, `bing.com`, ziprecruiter search hubs)
   - **soft demote** (`board`): LinkedIn, Indeed, Vagas.com.br, Catho, RemoteOK… — **keep in list**, lower rank, prefer ATS mirror when follow finds one  
2. Relax `looksLikeJobPosting` for surface: title role terms **OR** job-like path (not AND only)  
3. Default filter stays `hide_noise` but new jobs stay `unlabeled` (already) — ensure empty digest isn’t from over-filter  

### B — Surface-first defaults

```text
budget: surface 70% / ats 20% / follow 10%
atsTargets: all enabled=false by default OR only used in follow/resolve
planner: Brazil + remote/PJ queries dominate surface lane
geo default: Brazil first
```

### C — Coupled budget (100%)

- Domain: `setSurfaceShare(x)` recomputes `ats = 1 - follow - x`  
- UI: one linked control; never two free sliders  
- Persist only normalized triple summing to 1.0  

### D — Observability (why empty?)

Digest (or `/runs` response) includes:

```json
{
  "diagnostics": {
    "rawHits": 40,
    "droppedDenied": 22,
    "droppedHeuristic": 10,
    "kept": 8,
    "followed": 2
  }
}
```

So “No jobs” is explainable in the popover.

### E — Dup / labels

Keep P1.2 rule: Dup only cross-host. No change.

## Out of P1.3

- Cursor (P2)  
- Apply (P3)  
- Create ML (P4)  
- Re-adding full aggregator spam as equals to ATS (soft demote ≠ celebrate ZipRecruiter hubs)

## Success criteria

1. Run now with Brazil-focused persona returns **visible jobs** without requiring Gupy  
2. Budget UI always shows Surface+ATS+Follow = 100%  
3. Diagnostics show where hits were dropped when list is thin  
4. ATS can be enabled as optional enrichment, not the default worldview  
